import assert from 'node:assert/strict';
import { mkdir, readFile, writeFile, readdir } from 'node:fs/promises';
import path from 'node:path';
import { launchBrowser } from './lib/browser.mjs';

const { browser, tools } = await launchBrowser();
const origin = (process.env.AUDIT_URL ?? 'http://127.0.0.1:4321').replace(/\/$/, '');
const base = `/${(process.env.AUDIT_BASE ?? '').replace(/^\/+|\/+$/g, '')}`.replace(/\/$/, '');
const out = path.resolve(process.env.AUDIT_OUT ?? '.cache/premium-audit');
await mkdir(out, { recursive: true });
const errors = [], results = [];
const check = (value, message) => { if (!value) errors.push(message); };
const axe = await readFile(path.join(tools, 'axe-core/axe.min.js'), 'utf8');
async function walk(dir) { return (await Promise.all((await readdir(dir, { withFileTypes: true })).map(entry => entry.isDirectory() ? walk(path.join(dir, entry.name)) : path.join(dir, entry.name)))).flat(); }
const routes = (await walk('dist/client')).filter(file => file.endsWith('.html')).map(file => `/${path.relative('dist/client', file).split(path.sep).join('/').replace(/index\.html$/, '')}`);
const address = (route = '/') => `${origin}${base}${route}`;
try {
  for (const width of [320, 390, 768, 1025, 1440]) {
    const context = await browser.newContext({ viewport: { width, height: width === 320 ? 568 : width === 390 ? 844 : 1000 }, reducedMotion: 'reduce' });
    const page = await context.newPage();
    const paths = [320, 1440].includes(width) ? routes : ['/'];
    for (const route of paths) {
      const jsErrors = [], external = [];
      const onError = error => jsErrors.push(error.message);
      const onRequest = request => { if (new URL(request.url()).origin !== new URL(origin).origin) external.push(request.url()); };
      page.on('pageerror', onError); page.on('request', onRequest);
      const response = await page.goto(address(route), { waitUntil: 'networkidle' });
      await page.evaluate(() => document.fonts.ready);
      const metrics = await page.evaluate(() => {
        const root = document.documentElement;
        const portrait = document.querySelector('.hero__visual img');
        const hero = document.querySelector('.hero');
        const cta = document.querySelector('.hero__actions > a');
        const rect = cta?.getBoundingClientRect();
        return { client: root.clientWidth, scroll: root.scrollWidth, height: root.scrollHeight, hero: hero?.getBoundingClientRect().height, cta: rect ? { y: rect.y, bottom: rect.bottom, height: rect.height } : null, portrait: portrait ? { loaded: portrait.complete && portrait.naturalWidth > 0, source: portrait.currentSrc } : null, cookies: document.cookie, local: localStorage.length, session: sessionStorage.length };
      });
      check(metrics.scroll <= metrics.client + 1, `${width} ${route}: horizontal overflow ${metrics.scroll}/${metrics.client}`);
      check(jsErrors.length === 0, `${width} ${route}: JS errors ${jsErrors.join(', ')}`);
      check(external.length === 0, `${width} ${route}: unsolicited external requests ${external.join(', ')}`);
      check(metrics.cookies === '' && metrics.local === 0 && metrics.session === 0, `${width} ${route}: unexpected browser persistence`);
      if (route === '/') {
        check(metrics.portrait?.loaded, `${width}: hero portrait failed to load`);
        const safe = width === 320 ? 506 : width === 390 ? 782 : 1000;
        check(metrics.cta.bottom < safe, `${width}: hero CTA below safe first-screen area (${metrics.cta.bottom})`);
        check(await page.locator('[data-contact-form]').count() === 0, `${width}: disabled intake rendered a form`);
        check(await page.locator('[data-contact-mode="vk"] a.btn').getAttribute('href') === 'https://vk.me/advocat_yuriy51', `${width}: incorrect direct contact destination`);
        check(await page.locator('.accordion__item[open]').count() === 0, `${width}: FAQ must start collapsed`);
        if (width === 320) {
          await page.goto(address('/#kontakty'), { waitUntil: 'networkidle' });
          const contactCTA = await page.locator('.direct-contact .btn').boundingBox();
          check(contactCTA.y + contactCTA.height <= 568, '320: direct-contact CTA below arrival viewport');
          await page.goto(address(), { waitUntil: 'networkidle' });
        }
        const headerParts = await page.locator('.site-header__inner').evaluate(el => Array.from(el.children).map(child => child.getBoundingClientRect().toJSON()).filter(rect => rect.width > 0));
        for (let i = 1; i < headerParts.length; i++) check(headerParts[i - 1].right <= headerParts[i].left + 1, `${width}: overlapping header items`);
      }
      let violations = [];
      if ([320, 1440].includes(width)) {
        await page.addScriptTag({ content: axe });
        violations = await page.evaluate(async () => (await window.axe.run(document, { runOnly: { type: 'tag', values: ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'best-practice'] } })).violations.map(v => ({ id: v.id, impact: v.impact, nodes: v.nodes.map(node => ({ target: node.target, summary: node.failureSummary })) })));
        check(violations.length === 0, `${width} ${route}: axe ${violations.map(v => `${v.id}(${v.nodes.length})`).join(', ')}`);
      }
      results.push({ route, width, status: response?.status(), metrics, violations, jsErrors });
      if (route === '/' || (width === 320 && ['/ob-advokate/', '/napravleniya/zashchita-vrachey/', '/publikacii/vyzov-na-dopros/'].includes(route))) {
        await page.screenshot({ path: path.join(out, `${route === '/' ? 'home' : route.replaceAll('/', '_')}-${width}.png`), fullPage: true });
      }
      page.off('pageerror', onError); page.off('request', onRequest);
    }
    if (width === 390) {
      await page.goto(address(), { waitUntil: 'networkidle' });
      await page.evaluate(() => scrollTo(0, 300));
      const scroll = await page.evaluate(() => scrollY);
      await page.locator('[data-menu-toggle]').click();
      await page.waitForFunction(() => document.querySelector('dialog').open);
      check(await page.evaluate(() => document.body.classList.contains('is-locked')), 'Menu did not lock page scroll');
      for (let i = 0; i < 20; i++) { await page.keyboard.press('Tab'); check(await page.evaluate(() => document.querySelector('dialog').contains(document.activeElement)), `Menu Tab escaped at step ${i}`); }
      for (let i = 0; i < 10; i++) { await page.keyboard.press('Shift+Tab'); check(await page.evaluate(() => document.querySelector('dialog').contains(document.activeElement)), `Menu reverse Tab escaped at step ${i}`); }
      await page.addScriptTag({ content: axe });
      const menuViolations = await page.evaluate(async () => (await window.axe.run(document)).violations.map(violation => violation.id));
      check(menuViolations.length === 0, `Open menu axe: ${menuViolations.join(', ')}`);
      await page.screenshot({ path: path.join(out, 'menu-390.png') });
      await page.keyboard.press('Escape');
      await page.waitForFunction(() => !document.querySelector('dialog').open && !document.body.classList.contains('is-locked'));
      check(await page.evaluate(() => document.activeElement.matches('[data-menu-toggle]')), 'Escape did not restore menu trigger focus');
      check(Math.abs((await page.evaluate(() => scrollY)) - scroll) <= 1, 'Menu changed scroll position');
      await page.locator('[data-menu-toggle]').click();
      await page.locator('dialog a[href$="#poryadok"]').click();
      await page.waitForFunction(() => document.activeElement?.id === 'poryadok');
      check(await page.locator('[data-menu-toggle]').getAttribute('aria-expanded') === 'false', 'Menu state did not reset on anchor navigation');
      await page.locator('[data-menu-toggle]').click();
      await page.setViewportSize({ width: 1440, height: 1000 });
      await page.waitForFunction(() => !document.querySelector('dialog').open && !document.body.classList.contains('is-locked'));
      await page.setViewportSize({ width: 390, height: 844 });
      await page.goto(address('/#kontakty'), { waitUntil: 'networkidle' });
      const contactCTA = await page.locator('.direct-contact .btn').boundingBox();
      check(contactCTA.y + contactCTA.height < 844, 'Direct contact CTA is not visible on contact arrival');
      await page.screenshot({ path: path.join(out, 'contact-390.png') });
      const goals = await page.evaluate(() => {
        const captured = []; window.addEventListener('law:goal', event => captured.push(event.detail));
        document.addEventListener('click', event => event.preventDefault(), { once: true });
        document.querySelector('[data-goal="service_open"]').click(); return captured;
      });
      check(goals.length === 1 && goals[0].name === 'service_open' && Object.keys(goals[0]).sort().join(',') === 'name,path', 'Goal hooks contain unexpected data');
      results.push({ functional: 'menu, anchor focus, scroll restoration, direct contact, local goals', goals });
    }
    await context.close();
  }
  for (const mode of ['no-javascript', 'module-failure']) {
    const context = await browser.newContext({ viewport: { width: 320, height: 568 }, javaScriptEnabled: mode !== 'no-javascript' });
    if (mode === 'module-failure') await context.route('**/*', route => route.request().resourceType() === 'script' ? route.abort() : route.continue());
    const page = await context.newPage(); await page.goto(address(), { waitUntil: 'networkidle' });
    const visibility = await page.locator('[data-reveal]').evaluateAll(elements => elements.every(el => getComputedStyle(el).opacity === '1'));
    check(visibility, `${mode}: hidden content`);
    if (mode === 'no-javascript') { check(await page.locator('.noscript-nav a').count() >= 5, 'No-JS navigation missing'); check(await page.locator('[data-menu-toggle]').isHidden(), 'No-JS menu toggle must be hidden'); }
    check(await page.locator('.direct-contact .btn').getAttribute('href') === 'https://vk.me/advocat_yuriy51', `${mode}: direct contact unavailable`);
    results.push({ functional: mode, contentVisible: visibility }); await context.close();
  }
} finally { await browser.close(); }
await writeFile(path.join(out, 'browser-report.json'), JSON.stringify({ generatedAt: new Date().toISOString(), origin, base, errors, results }, null, 2));
console.log(JSON.stringify({ checks: results.length, errors, home: results.filter(row => row.route === '/').map(({ width, metrics }) => ({ width, ...metrics })) }, null, 2));
assert.equal(errors.length, 0, `Browser checks failed: ${errors.join('\n')}`);
