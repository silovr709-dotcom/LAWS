import { readFile, readdir, access } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';

const dir = path.resolve(process.env.BUILD_DIR ?? 'dist/client');
const base = `/${(process.env.EXPECT_BASE ?? '/').replace(/^\/+|\/+$/g, '')}`.replace(/\/$/, '');
const site = new URL(process.env.EXPECT_SITE ?? 'https://kochevinov.ru');
const noindex = process.env.EXPECT_NOINDEX !== 'false';
const form = process.env.EXPECT_FORM ?? 'vk';
const errors = [];
const check = (value, message) => { if (!value) errors.push(message); };
const decode = (value) => value.replaceAll('&amp;', '&').replaceAll('&#39;', "'").replaceAll('&quot;', '"');
const attrs = (tag) => Object.fromEntries([...tag.matchAll(/([\w:-]+)="([^"]*)"/g)].map((match) => [match[1], decode(match[2])]));
async function walk(root) { return (await Promise.all((await readdir(root, { withFileTypes: true })).map(entry => entry.isDirectory() ? walk(path.join(root, entry.name)) : path.join(root, entry.name)))).flat(); }
const files = await walk(dir);
const pages = new Map();
for (const file of files.filter(file => file.endsWith('.html'))) {
  const relative = path.relative(dir, file).split(path.sep).join('/');
  const route = `/${relative.replace(/index\.html$/, '')}`;
  const html = await readFile(file, 'utf8');
  const metas = Object.fromEntries([...html.matchAll(/<meta\b[^>]*>/g)].map(match => { const a = attrs(match[0]); return [a.name ?? a.property, a.content]; }));
  const ids = [...html.matchAll(/\bid="([^"]+)"/g)].map(match => match[1]);
  check(new Set(ids).size === ids.length, `${route}: duplicate IDs`);
  pages.set(route, { html, metas, ids: new Set(ids) });
}
const publishedCases = [...pages.keys()].filter(route => route.startsWith('/praktika/') && route !== '/praktika/').length;
let linkCount = 0, resourceCount = 0, schemaCount = 0;
async function internal(value, from, anchor = false) {
  if (!value || /^(tel:|mailto:|data:|javascript:)/.test(value)) return;
  let url;
  try { url = new URL(value, `${site.origin}${base}${from}`); } catch { check(false, `${from}: invalid URL ${value}`); return; }
  if (url.origin !== site.origin) return;
  check(!base || url.pathname === base || url.pathname.startsWith(`${base}/`), `${from}: missing ${base} prefix in ${value}`);
  const relative = decodeURIComponent(url.pathname.slice(base.length)) || '/';
  const target = pages.get(relative);
  if (target) {
    if (anchor && url.hash) check(target.ids.has(decodeURIComponent(url.hash.slice(1))), `${from}: missing anchor ${value}`);
    return;
  }
  const resource = path.join(dir, relative);
  try { await access(resource); }
  catch { check(false, `${from}: missing target ${value}`); }
}
function schemaURLs(value, route) {
  if (Array.isArray(value)) { value.forEach(item => schemaURLs(item, route)); return; }
  if (!value || typeof value !== 'object') return;
  for (const [key, item] of Object.entries(value)) {
    if (['url', '@id', 'image', 'mainEntityOfPage', 'item'].includes(key) && typeof item === 'string' && item.startsWith(site.origin)) {
      const url = new URL(item);
      check(!base || url.pathname === base || url.pathname.startsWith(`${base}/`), `${route}: JSON-LD omitted base in ${key}=${item}`);
    }
    schemaURLs(item, route);
  }
}
const titles = new Set();
for (const [route, { html, metas }] of pages) {
  const title = html.match(/<title>([\s\S]*?)<\/title>/)?.[1];
  check(Boolean(title), `${route}: missing title`); check(!titles.has(title), `${route}: duplicate title`); titles.add(title);
  check(Boolean(metas.description), `${route}: missing description`);
  check((html.match(/<h1\b/g) ?? []).length === 1, `${route}: expected one h1`);
  const canonical = [...html.matchAll(/<link\b[^>]*>/g)].map(match => attrs(match[0])).find(item => item.rel === 'canonical')?.href;
  check(canonical === `${site.origin}${base}${route === '/404.html' ? '/404/' : route}`, `${route}: wrong canonical ${canonical}`);
  check(metas['og:url'] === canonical, `${route}: OG URL differs from canonical`);
  // Персональная OG-картинка: /og/<путь-через-дефисы>.png; иначе — общая.
  const ogKey = route === '/404.html'
    ? null
    : (route === '/' ? 'home' : route.replace(/^\/+|\/+$/g, '').replace(/\//g, '-'));
  const ogFile = ogKey ? path.join(dir, 'og', `${ogKey}.png`) : null;
  const expectedOg = ogFile && existsSync(ogFile)
    ? `${site.origin}${base}/og/${ogKey}.png`
    : `${site.origin}${base}/og/og-default.png`;
  check(metas['og:image'] === expectedOg, `${route}: incorrect OG image`);
  check(metas['og:image:alt'] === metas['twitter:image:alt'] && Boolean(metas['og:image:alt']), `${route}: OG alt missing`);
  const shouldNoindex = noindex || route.includes('/soglasie-na-') || (route === '/praktika/' && publishedCases === 0) || route === '/404.html';
  check(Boolean(metas.robots?.includes('noindex')) === shouldNoindex, `${route}: incorrect indexability`);
  for (const match of html.matchAll(/<a\b[^>]*>/g)) {
    const a = attrs(match[0]); linkCount++; await internal(a.href, route, true);
    if (a.target === '_blank') check(a.rel?.includes('noopener'), `${route}: unsafe target=_blank`);
  }
  for (const match of html.matchAll(/<(?:img|source|script|link)\b[^>]*>/g)) {
    const a = attrs(match[0]);
    for (const resource of [a.src, a.rel && a.rel !== 'canonical' ? a.href : undefined, ...((a.srcset ?? '').split(',').map(item => item.trim().split(/\s/)[0]))].filter(Boolean)) { resourceCount++; await internal(resource, route); }
    if (match[0].startsWith('<img')) { check(a.alt !== undefined, `${route}: image without alt`); check(Boolean(a.width && a.height), `${route}: image without dimensions`); }
  }
  for (const match of html.matchAll(/<script\b[^>]*type="application\/ld\+json"[^>]*>([\s\S]*?)<\/script>/g)) {
    try {
      const schema = JSON.parse(match[1]); schemaCount++; schemaURLs(schema, route);
      if (schema['@type'] === 'Article') check(schema.mainEntityOfPage === canonical, `${route}: Article URL differs from canonical`);
      if (schema['@type'] === 'Service') check(schema.url === canonical, `${route}: Service URL differs from canonical`);
    } catch { check(false, `${route}: invalid JSON-LD`); }
  }
  check(!/href="(?:tel:|mailto:)"/.test(html), `${route}: empty contact link`);
  check(!/portrait\.jpg|portrait-references|reference-[123]\.png|image-[123]\.png/.test(html), `${route}: identity reference or obsolete portrait path leaked`);
}
const home = pages.get('/')?.html ?? '';
check(publishedCases > 0 || !home.includes('id="praktika"'), 'Empty practice section must not appear on the homepage');
check(publishedCases > 0 || !home.includes('href="' + base + '/praktika/"'), 'Empty practice catalogue must not appear in navigation');
check(form === 'server' ? home.includes('data-contact-form') : !/<form\b/.test(home), 'Incorrect contact mode');
check(form === 'server' || home.includes(`data-contact-mode="${form}"`), 'Direct-contact mode missing');
const manifest = JSON.parse(await readFile(path.join(dir, 'site.webmanifest'), 'utf8'));
check(manifest.start_url === './' && manifest.scope === './', 'Manifest start_url/scope must be base-relative');
check(manifest.description.includes('Твери') && !manifest.description.includes('Мурманске'), 'Manifest geography is stale');
for (const icon of manifest.icons) await internal(new URL(icon.src, `${site.origin}${base}/site.webmanifest`).href, '/');
const robots = await readFile(path.join(dir, 'robots.txt'), 'utf8');
check(noindex ? robots.includes('Disallow: /\n') : robots.includes(`Sitemap: ${site.origin}${base}/sitemap-index.xml`), 'robots.txt launch setting mismatch');
for (const file of files.filter(file => /sitemap.*\.xml$/.test(file))) {
  const xml = await readFile(file, 'utf8');
  for (const match of xml.matchAll(/<loc>(.*?)<\/loc>/g)) {
    const location = decode(match[1]);
    check(location.startsWith(`${site.origin}${base}/`), `Sitemap base/origin mismatch: ${location}`);
    check((publishedCases > 0 || !location.includes('/praktika/')) && !location.includes('/soglasie-na-') && !location.includes('/api/'), `Noindex/service URL in sitemap: ${location}`);
    await internal(location, '/');
  }
}
assert.equal(errors.length, 0, `Build checks failed:\n${errors.join('\n')}`);
console.log(`Build OK: ${pages.size} pages, ${linkCount} links, ${resourceCount} asset references, ${schemaCount} JSON-LD blocks. Base=${base || '/'}; noindex=${noindex}; contact=${form}.`);
