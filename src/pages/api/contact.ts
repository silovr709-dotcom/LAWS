import type { APIRoute } from 'astro';
import { constants, promises as fs } from 'node:fs';
import path from 'node:path';
import { randomUUID } from 'node:crypto';
import { legal } from '../../data/legal';

export const prerender = false;

// Disabled unless the operator explicitly enables intake and configures private, durable storage.
// A successful response means "saved locally", not "webhook delivered" or "mandate accepted".
const MAX_BODY_BYTES = 8_000;
const RATE_LIMIT = 5;
const RATE_WINDOW_MS = 60 * 60 * 1000;
const rateBuckets = new Map<string, number[]>();

function jsonResponse(data: unknown, status = 200): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      'Content-Type': 'application/json; charset=utf-8',
      'Cache-Control': 'no-store',
      'X-Content-Type-Options': 'nosniff',
      ...(status === 405 ? { Allow: 'POST' } : {}),
    },
  });
}

function isPrivatePath(dir: string): boolean {
  const forbidden = [process.cwd(), path.parse(dir).root];
  if (forbidden.includes(dir)) return false;
  return !['public', 'dist/client', '.git'].some((entry) => {
    const root = path.resolve(entry);
    return dir === root || dir.startsWith(`${root}${path.sep}`);
  });
}

function leadDirectory(): string | undefined {
  const dir = process.env.LEADS_DIR;
  if (process.env.CONTACT_FORM_ENABLED !== 'true' || !dir || !path.isAbsolute(dir)) return;
  const resolved = path.resolve(dir);
  return isPrivatePath(resolved) ? resolved : undefined;
}

function clean(value: unknown, maxLength: number): string {
  return typeof value === 'string'
    ? value.replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/g, '').replace(/\s+/g, ' ').trim().slice(0, maxLength)
    : '';
}

function isRateLimited(ip: string): boolean {
  const now = Date.now();
  const bucket = (rateBuckets.get(ip) ?? []).filter((time) => now - time < RATE_WINDOW_MS);
  if (bucket.length >= RATE_LIMIT) return true;
  bucket.push(now);
  if (!rateBuckets.has(ip) && rateBuckets.size >= 5_000) {
    for (const [key, times] of rateBuckets) {
      if (times.every((time) => now - time >= RATE_WINDOW_MS)) rateBuckets.delete(key);
    }
    if (rateBuckets.size >= 5_000) return true;
  }
  rateBuckets.set(ip, bucket);
  return false;
}

function originAllowed(request: Request): boolean {
  const origin = request.headers.get('origin');
  if (!origin) return true; // Non-browser clients still pass content-type, size and anti-spam checks.
  try {
    const url = new URL(origin);
    return ['http:', 'https:'].includes(url.protocol) && url.host === new URL(request.url).host;
  } catch {
    return false;
  }
}

class BodyTooLarge extends Error {}
async function readPayload(request: Request): Promise<Record<string, unknown>> {
  if (!request.body) throw new Error('Empty body');
  const reader = request.body.getReader();
  const chunks: Uint8Array[] = [];
  let length = 0;
  try {
    while (true) {
      const { value, done } = await reader.read();
      if (done) break;
      length += value.byteLength;
      if (length > MAX_BODY_BYTES) {
        await reader.cancel();
        throw new BodyTooLarge();
      }
      chunks.push(value);
    }
  } finally {
    reader.releaseLock();
  }
  const bytes = new Uint8Array(length);
  let offset = 0;
  for (const chunk of chunks) { bytes.set(chunk, offset); offset += chunk.byteLength; }
  const payload: unknown = JSON.parse(new TextDecoder('utf-8', { fatal: true }).decode(bytes));
  if (!payload || typeof payload !== 'object' || Array.isArray(payload)) throw new Error('Invalid object');
  return payload as Record<string, unknown>;
}

async function persistLead(dir: string, lead: Record<string, unknown>): Promise<void> {
  await fs.mkdir(dir, { recursive: true, mode: 0o700 });
  if (!isPrivatePath(await fs.realpath(dir)) || ((await fs.stat(dir)).mode & 0o077) !== 0) {
    throw new Error('Storage must be private');
  }
  const file = path.join(dir, `${new Date().toISOString().slice(0, 10)}.jsonl`);
  const handle = await fs.open(file, constants.O_APPEND | constants.O_CREAT | constants.O_WRONLY | constants.O_NOFOLLOW, 0o600);
  try {
    if (((await handle.stat()).mode & 0o077) !== 0) throw new Error('Receipt file must be private');
    await handle.writeFile(`${JSON.stringify(lead)}\n`);
    await handle.sync();
  } finally { await handle.close(); }
}

async function notifyWebhook(lead: Record<string, unknown>): Promise<void> {
  const url = process.env.LEADS_WEBHOOK_URL;
  if (!url) return;
  try {
    const endpoint = new URL(url);
    const localTest = ['localhost', '127.0.0.1', '[::1]'].includes(endpoint.hostname);
    if (endpoint.protocol !== 'https:' && !(localTest && endpoint.protocol === 'http:')) throw new Error('HTTPS required');
    const response = await fetch(endpoint, {
      method: 'POST',
      redirect: 'error',
      headers: {
        'Content-Type': 'application/json',
        ...(process.env.LEADS_WEBHOOK_TOKEN ? { Authorization: `Bearer ${process.env.LEADS_WEBHOOK_TOKEN}` } : {}),
      },
      body: JSON.stringify({ source: 'advokat-yuriy-kochevinov', lead }),
      signal: AbortSignal.timeout(5_000),
    });
    await response.body?.cancel();
    if (!response.ok) console.error('[contact] webhook HTTP failure; receipt saved locally', { status: response.status, receiptId: lead.receiptId });
  } catch {
    // Never put payloads, webhook URLs, credentials or arbitrary provider errors in logs.
    console.error('[contact] webhook unavailable; receipt saved locally', { receiptId: lead.receiptId });
  }
}

export const POST: APIRoute = async ({ request, clientAddress }) => {
  const dir = leadDirectory();
  if (!dir) return jsonResponse({ ok: false, error: 'Приём через форму отключён. Используйте прямой канал связи.' }, 503);
  if (!originAllowed(request)) return jsonResponse({ ok: false, error: 'Запрос отклонён.' }, 403);
  if (request.headers.get('content-type')?.split(';')[0].trim().toLowerCase() !== 'application/json') {
    return jsonResponse({ ok: false, error: 'Неподдерживаемый формат запроса.' }, 415);
  }
  const declaredLength = Number(request.headers.get('content-length') ?? '0');
  if (!Number.isFinite(declaredLength) || declaredLength < 0) return jsonResponse({ ok: false, error: 'Некорректный размер запроса.' }, 400);
  if (declaredLength > MAX_BODY_BYTES) return jsonResponse({ ok: false, error: 'Сообщение слишком большое.' }, 413);
  if (isRateLimited(clientAddress || 'unknown')) {
    return jsonResponse({ ok: false, error: 'Слишком много обращений. Попробуйте позже или используйте прямой канал связи.' }, 429);
  }
  let payload: Record<string, unknown>;
  try { payload = await readPayload(request); }
  catch (reason) {
    return jsonResponse({ ok: false, error: reason instanceof BodyTooLarge ? 'Сообщение слишком большое.' : 'Не удалось прочитать обращение.' }, reason instanceof BodyTooLarge ? 413 : 400);
  }
  if (typeof payload.website === 'string' && payload.website.trim()) return jsonResponse({ ok: true });
  const elapsed = Date.now() - Number(payload.startedAt ?? 0);
  if (!Number.isFinite(elapsed) || elapsed < 1_500 || elapsed > 24 * 60 * 60 * 1000) {
    return jsonResponse({ ok: false, error: 'Проверьте форму и попробуйте ещё раз.' }, 400);
  }
  const name = clean(payload.name, 60), phone = clean(payload.phone, 30), message = clean(payload.message, 600);
  const digits = phone.replace(/\D/g, '');
  const errors: Record<string, string> = {};
  if (name.length < 2) errors.name = 'Укажите имя.';
  if (digits.length < 10 || digits.length > 15) errors.phone = 'Укажите корректный телефон.';
  if (payload.consent !== true) errors.consent = 'Необходимо согласие на обработку данных.';
  if (Object.keys(errors).length) return jsonResponse({ ok: false, error: 'Проверьте заполнение формы.', errors }, 422);
  if (payload.consentVersion !== legal.consentVersion) {
    return jsonResponse({ ok: false, error: 'Текст согласия обновился. Обновите страницу и ознакомьтесь с новой редакцией.' }, 409);
  }
  let page: string | null = null;
  try { page = new URL(request.headers.get('referer') ?? '').pathname.slice(0, 300); } catch { /* Optional. Never store a referrer's query or fragment. */ }
  const lead = { receiptId: randomUUID(), receivedAt: new Date().toISOString(), name, phone, channel: payload.channel === 'sms' ? 'sms' : 'call', message, consent: true, consentVersion: legal.consentVersion, page };
  try { await persistLead(dir, lead); }
  catch {
    console.error('[contact] private receipt storage unavailable');
    return jsonResponse({ ok: false, error: 'Не удалось сохранить обращение. Используйте прямой канал связи.' }, 500);
  }
  await notifyWebhook(lead);
  return jsonResponse({ ok: true });
};

export const GET: APIRoute = () => jsonResponse({ ok: false, error: 'Метод не поддерживается.' }, 405);
