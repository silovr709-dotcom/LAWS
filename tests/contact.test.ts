import { test, type TestContext } from 'node:test';
import assert from 'node:assert/strict';
import { promises as fs } from 'node:fs';
import path from 'node:path';
import type { APIContext } from 'astro';
import { POST, GET } from '../src/pages/api/contact';
import { legal } from '../src/data/legal';

const envKeys = ['CONTACT_FORM_ENABLED', 'LEADS_DIR', 'LEADS_WEBHOOK_URL', 'LEADS_WEBHOOK_TOKEN'] as const;
let ip = 0;
const valid = (overrides: Record<string, unknown> = {}) => ({ name: 'Тест', phone: '+7 000 000-00-00', channel: 'call', consent: true, consentVersion: legal.consentVersion, startedAt: Date.now() - 3_000, ...overrides });
async function request(payload: unknown = valid(), headers: Record<string, string> = {}, address = `test-${++ip}`) {
  const request = new Request('https://site.example/LAWS/api/contact', { method: 'POST', headers: { 'Content-Type': 'application/json', Origin: 'https://site.example', ...headers }, body: typeof payload === 'string' ? payload : JSON.stringify(payload) });
  return await POST({ request, clientAddress: address } as APIContext);
}
async function setup(t: TestContext) {
  const previous = Object.fromEntries(envKeys.map(key => [key, process.env[key]]));
  await fs.mkdir('.cache', { recursive: true });
  const dir = await fs.mkdtemp(path.resolve('.cache/contact-test-'));
  process.env.CONTACT_FORM_ENABLED = 'true'; process.env.LEADS_DIR = dir;
  delete process.env.LEADS_WEBHOOK_URL; delete process.env.LEADS_WEBHOOK_TOKEN;
  t.after(async () => { for (const key of envKeys) { if (previous[key] === undefined) delete process.env[key]; else process.env[key] = previous[key]; } await fs.rm(dir, { recursive: true, force: true }); });
  return dir;
}

test('intake is off by default; it never writes without explicit opt-in', async t => {
  const dir = await setup(t); delete process.env.CONTACT_FORM_ENABLED;
  assert.equal((await request()).status, 503); assert.deepEqual(await fs.readdir(dir), []);
});
test('intake requires absolute private storage; public paths are rejected', async t => {
  await setup(t);
  for (const dir of ['', '.data/leads', path.resolve('public/leads'), path.resolve('dist/client/leads'), path.resolve('.git/leads'), path.resolve('.')]) {
    process.env.LEADS_DIR = dir; assert.equal((await request()).status, 503, dir);
  }
});
test('cross-origin JSON and non-JSON bodies are rejected', async t => {
  await setup(t);
  assert.equal((await request(valid(), { Origin: 'https://other.example' })).status, 403);
  assert.equal((await request(valid(), { 'Content-Type': 'text/plain' })).status, 415);
  assert.equal((await request(valid(), { 'Content-Type': 'application/json-invalid' })).status, 415);
});
test('declared and streamed bodies are bounded in bytes, including Cyrillic', async t => {
  await setup(t);
  assert.equal((await request(valid(), { 'Content-Length': '9000' })).status, 413);
  assert.equal((await request(valid({ message: 'я'.repeat(4_100) }))).status, 413);
});
test('malformed objects and invalid field types do not crash the endpoint', async t => {
  await setup(t);
  for (const payload of ['{', null, [], 23]) assert.equal((await request(payload)).status, 400);
  const result = await request(valid({ name: {}, phone: [], consent: 'true' }));
  assert.equal(result.status, 422); assert.deepEqual(Object.keys((await result.json()).errors).sort(), ['consent', 'name', 'phone']);
});
test('honeypot is silently discarded; a too-fast submission is rejected', async t => {
  const dir = await setup(t);
  assert.equal((await request(valid({ website: 'bot' }))).status, 200);
  assert.equal((await request(valid({ startedAt: Date.now() }))).status, 400);
  assert.equal((await request(valid({ startedAt: Date.now() - 86_500_000 }))).status, 400);
  assert.deepEqual(await fs.readdir(dir), []);
});
test('stale consent cannot be recorded under the current document version', async t => {
  const dir = await setup(t); assert.equal((await request(valid({ consentVersion: '1.0' }))).status, 409); assert.deepEqual(await fs.readdir(dir), []);
});
test('valid receipt is private, durable and excludes IP and referrer parameters', async t => {
  const dir = await setup(t);
  const result = await request(valid({ name: '  Тест\u0000   Имя  ', message: 'Краткое\nсообщение', channel: 'email' }), { Referer: 'https://site.example/LAWS/?phone=secret#private' });
  assert.equal(result.status, 200); assert.deepEqual(await result.json(), { ok: true }); assert.equal(result.headers.get('cache-control'), 'no-store');
  const [file] = await fs.readdir(dir); const receipt = JSON.parse(await fs.readFile(path.join(dir, file), 'utf8'));
  assert.equal(receipt.name, 'Тест Имя'); assert.equal(receipt.message, 'Краткое сообщение'); assert.equal(receipt.channel, 'call'); assert.equal(receipt.page, '/LAWS/'); assert.equal(receipt.consentVersion, legal.consentVersion);
  assert.ok(receipt.receiptId); assert.ok(receipt.receivedAt); assert.equal(receipt.ip, undefined);
  assert.equal((await fs.stat(path.join(dir, file))).mode & 0o077, 0); assert.equal((await fs.stat(dir)).mode & 0o077, 0);
});
test('rate limit rejects request six from the same client', async t => {
  const dir = await setup(t); const address = `rate-${++ip}`;
  for (let i = 0; i < 5; i++) assert.equal((await request(valid(), {}, address)).status, 200);
  assert.equal((await request(valid(), {}, address)).status, 429);
  const [file] = await fs.readdir(dir); assert.equal((await fs.readFile(path.join(dir, file), 'utf8')).trim().split('\n').length, 5);
});
test('storage failure cannot produce false success', async t => {
  const dir = await setup(t); const file = path.join(dir, 'not-a-directory'); await fs.writeFile(file, 'test'); process.env.LEADS_DIR = file;
  t.mock.method(console, 'error', () => {}); assert.equal((await request()).status, 500);
});
test('webhook HTTP failure is logged without PII, but the saved receipt stays accepted', async t => {
  const dir = await setup(t); process.env.LEADS_WEBHOOK_URL = 'https://webhook.example/private-token';
  const logs: unknown[][] = []; t.mock.method(console, 'error', (...args: unknown[]) => { logs.push(args); });
  const fetchMock = t.mock.method(globalThis, 'fetch', async () => new Response('provider secret body', { status: 503 }));
  assert.equal((await request()).status, 200); assert.equal(fetchMock.mock.callCount(), 1); assert.equal((await fs.readdir(dir)).length, 1);
  assert.ok(JSON.stringify(logs).includes('HTTP failure')); assert.ok(JSON.stringify(logs).includes('503'));
  assert.ok(!JSON.stringify(logs).includes('+7')); assert.ok(!JSON.stringify(logs).includes('private-token')); assert.ok(!JSON.stringify(logs).includes('provider secret body'));
});
test('webhook network failure is not confused with failed local storage', async t => {
  const dir = await setup(t); process.env.LEADS_WEBHOOK_URL = 'https://webhook.example';
  t.mock.method(console, 'error', () => {}); t.mock.method(globalThis, 'fetch', async () => { throw new Error('private detail'); });
  assert.equal((await request()).status, 200); assert.equal((await fs.readdir(dir)).length, 1);
});
test('GET advertises POST and never returns a cacheable response', async () => {
  const result = await GET({} as APIContext); assert.equal(result.status, 405); assert.equal(result.headers.get('allow'), 'POST'); assert.equal(result.headers.get('cache-control'), 'no-store');
});
