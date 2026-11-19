import { test } from 'node:test';
import assert from 'node:assert/strict';
import { promises as fs } from 'node:fs';
import sharp from 'sharp';
import { directions, site, about } from '../src/data/site';
import { services } from '../src/data/services';

test('each direction has a unique, substantive detail page and real related articles', async () => {
  assert.equal(services.length, 6); assert.equal(new Set(services.map(service => service.slug)).size, 6);
  assert.deepEqual(services.map(service => service.slug), directions.map(direction => direction.slug));
  for (const service of services) {
    assert.equal(service.scenarios.length, 3); assert.equal(service.work.length, 3); assert.equal(service.prepare.length, 3);
    assert.ok(service.focus.length > 100);
    for (const item of service.work) { assert.ok(item.title.length > 10); assert.ok(item.text.length > 60); }
    for (const id of service.articleIds) await fs.access(`src/content/articles/${id}.md`);
  }
});
test('biography distinguishes legal experience from advocate status', () => {
  assert.ok(about.timeline.some(item => item.period.includes('2023')));
  assert.ok(about.facts.some(fact => fact.value.includes('25')));
  assert.equal(site.registryNumber, '51/862'); assert.equal(site.city, 'Тверь');
});
test('all portrait variants have the declared dimensions and compact payloads', async () => {
  const gallery = about.gallery.map((image) => image.src.replace('/images/yuriy-', ''));
  for (const [name, ratio] of [['hero', 4 / 5], ['about', 3 / 4], ...gallery.map((name) => [name, 4 / 5] as const)] as const) {
    for (const width of [320, 640, 960]) for (const format of ['avif', 'webp']) {
      const file = `public/images/yuriy-${name}-${width}.${format}`;
      const meta = await sharp(file).metadata(); assert.equal(meta.width, width); assert.equal(meta.height, Math.round(width / ratio));
      assert.ok((await fs.stat(file)).size < 100_000);
    }
  }
  const avatar = await sharp('public/images/yuriy-avatar.webp').metadata(); assert.equal(avatar.width, 192); assert.equal(avatar.height, 192);
});
test('OG is 1200 × 630, contains portrait pixels and has the correct geography', async () => {
  const meta = await sharp('public/og/og-default.png').metadata(); assert.equal(meta.width, 1200); assert.equal(meta.height, 630);
  const stats = await sharp('public/og/og-default.png').extract({ left: 760, top: 20, width: 420, height: 540 }).stats();
  assert.ok(stats.channels.every(channel => channel.stdev > 20), 'Embedded portrait disappeared from OG raster');
  const svg = await fs.readFile('public/og/og-default.svg', 'utf8'); assert.ok(svg.includes('Тверь')); assert.ok(!svg.includes('МУРМАНСК')); assert.ok(!svg.includes('ИИ-портрет'), 'OG must not carry an AI caption');
});
test('no identity-reference originals or generic portrait file exist in public images', async () => {
  const files = (await fs.readdir('public/images')).filter(file => file !== '.gitkeep'); assert.ok(files.length >= 13);
  assert.ok(files.every(file => /^yuriy-[a-z]+(-\d+)?\.(avif|webp)$/.test(file)));
  assert.equal('portraitCredit' in site, false, 'AI captions were removed at the owner\'s request');
});
