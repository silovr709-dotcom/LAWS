import assert from 'node:assert/strict';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { launchBrowser } from './lib/browser.mjs';
const url = new URL(process.env.FORM_AUDIT_URL ?? 'http://127.0.0.1:4322/LAWS/');
assert.ok(['localhost', '127.0.0.1', '[::1]'].includes(url.hostname), 'Form QA is restricted to a local test stand');
const { browser, tools } = await launchBrowser();
const out = path.resolve('.cache/premium-audit'); await mkdir(out, { recursive: true });
const axe = await readFile(path.join(tools, 'axe-core/axe.min.js'), 'utf8');
const results = [];
try {
  for (const width of [320, 390, 1440]) {
    const context = await browser.newContext({ viewport: { width, height: width === 320 ? 568 : width === 390 ? 844 : 1000 }, reducedMotion: 'reduce' });
    const page = await context.newPage(); const jsErrors = []; page.on('pageerror', error => jsErrors.push(error.message));
    let behavior = 'error', posts = 0;
    await page.route('**/api/contact', async route => {
      posts++;
      const payload = route.request().postDataJSON(); assert.equal(payload.consent, true); assert.equal(payload.consentVersion, '1.1'); assert.equal(payload.phone, '+7 000 000-00-00');
      assert.equal(new URL(route.request().url()).pathname, `${url.pathname.replace(/\/$/, '')}/api/contact`);
      if (behavior === 'network') return route.abort('failed');
      if (behavior === 'invalid') return route.fulfill({ status: 200, contentType: 'application/json', body: '<bad>' });
      await new Promise(resolve => setTimeout(resolve, 80));
      return route.fulfill({ status: behavior === 'success' ? 200 : 503, contentType: 'application/json', body: JSON.stringify(behavior === 'success' ? { ok: true } : { ok: false, error: 'Тест: приём недоступен.' }) });
    });
    await page.goto(`${url.href}#kontakty`, { waitUntil: 'networkidle' });
    await page.waitForFunction(() => !document.querySelector('[data-submit]').disabled);
    assert.equal(await page.locator('form').getAttribute('method'), 'post');
    assert.equal(await page.locator('form').getAttribute('action'), `${url.pathname.replace(/\/$/, '')}/api/contact`);
    await page.addScriptTag({ content: axe });
    const violations = await page.evaluate(async () => (await window.axe.run(document, { runOnly: { type: 'tag', values: ['wcag2a','wcag2aa','wcag21a','wcag21aa','best-practice'] } })).violations.map(v => ({ id: v.id, nodes: v.nodes.map(node => node.target) })));
    assert.deepEqual(violations, []);
    await page.locator('[data-submit]').click();
    assert.equal(await page.locator('#cf-name').getAttribute('aria-invalid'), 'true'); assert.equal(await page.locator('#cf-phone').getAttribute('aria-invalid'), 'true');
    assert.equal(await page.locator('[name="consent"]').getAttribute('aria-invalid'), 'true'); assert.ok(await page.locator('#cf-name-error').isVisible());
    assert.equal(await page.evaluate(() => document.activeElement.id), 'cf-name'); assert.equal(posts, 0);
    await page.locator('#cf-name').fill('Тест формы'); await page.locator('#cf-phone').fill('+7 000 000-00-00'); await page.locator('#cf-message').fill('Только проверка интерфейса, не настоящее обращение.');
    const consent = page.locator('[name="consent"]');
    const checkboxStyle = await consent.evaluate(el => ({ appearance: getComputedStyle(el).appearance, width: el.getBoundingClientRect().width, height: el.getBoundingClientRect().height }));
    assert.ok(['auto', 'checkbox'].includes(checkboxStyle.appearance)); assert.equal(checkboxStyle.width, 20); assert.equal(checkboxStyle.height, 20);
    await consent.focus(); await page.keyboard.press('Space'); assert.equal(await consent.isChecked(), true);
    await page.evaluate(() => { window.testGoals = []; window.addEventListener('law:goal', event => window.testGoals.push(event.detail)); });
    for (const mode of ['error', 'network', 'invalid']) {
      behavior = mode; await page.locator('[data-submit]').click();
      await page.waitForFunction(() => document.querySelector('[data-status]').classList.contains('form__status--error'));
      assert.equal(await page.locator('#cf-name').inputValue(), 'Тест формы'); assert.equal(await consent.isChecked(), true); assert.ok(!(await page.locator('form').getAttribute('class')).includes('is-sent'));
      await page.waitForFunction(() => !document.querySelector('[data-submit]').disabled);
    }
    behavior = 'success'; const before = posts;
    await page.locator('form').evaluate(form => { form.dispatchEvent(new Event('submit', { bubbles: true, cancelable: true })); form.dispatchEvent(new Event('submit', { bubbles: true, cancelable: true })); });
    await page.waitForFunction(() => document.querySelector('form').classList.contains('is-sent'));
    assert.equal(posts - before, 1); assert.equal(await page.evaluate(() => document.activeElement.hasAttribute('data-success')), true);
    assert.deepEqual(await page.evaluate(() => window.testGoals), [{ name: 'contact_success', path: url.pathname }]);
    assert.equal(await page.locator('.form__grid').isVisible(), false); assert.deepEqual(jsErrors, []);
    assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= document.documentElement.clientWidth + 1));
    results.push({ width, posts, checkboxStyle, errorsPreserveFields: true, successFocused: true, duplicateBlocked: true, violations }); await context.close();
  }
  const context = await browser.newContext({ javaScriptEnabled: false, viewport: { width: 320, height: 568 } });
  const page = await context.newPage(); await page.goto(url.href, { waitUntil: 'networkidle' });
  assert.equal(await page.locator('[data-submit]').isDisabled(), true); assert.equal(await page.locator('form').getAttribute('method'), 'post');
  assert.ok(await page.locator('form noscript a').first().isVisible());
  results.push({ noJavaScript: true, submitDisabled: true, fallbackVisible: true }); await context.close();
} finally { await browser.close(); }
await writeFile(path.join(out, 'form-browser-report.json'), JSON.stringify(results, null, 2));
console.log(JSON.stringify(results, null, 2));
