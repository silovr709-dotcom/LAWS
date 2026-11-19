/**
 * PDF-памятки «Первые 48 часов», «Обыск», «Допрос».
 *
 * Текст берётся из src/data/memos.ts — того же источника, что и страницы сайта,
 * поэтому PDF и веб-версия не расходятся. Готовые файлы коммитятся в public/memos/.
 *
 * Запуск:
 *   npm install --prefix .cache/audit-tools --no-save playwright-core @sparticuz/chromium
 *   npm run memos
 */
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { memos, type Memo } from '../src/data/memos';
import { launchBrowser } from './lib/browser.mjs';

const escape = (value: string) =>
  value.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

/** Логтин в inline data URI — загружается без issues в headless Chromium. */
const embed = async (file: string, mime: string) =>
  `data:${mime};base64,${(await readFile(file)).toString('base64')}`;

const page = (memo: Memo, assets: { logo: string; qr: string }) => `<!doctype html>
<html lang="ru"><head><meta charset="utf-8"><title>${escape(memo.title)}</title>
<style>
  @page { size: A4; margin: 17mm 19mm 15mm; }
  * { box-sizing: border-box; }
  body { margin: 0; font-family: Georgia, "Times New Roman", serif; font-size: 10.6pt; line-height: 1.45; color: #1c1a19; }
  .brand { display: flex; justify-content: space-between; align-items: center; border-bottom: .8pt solid #7a1f33; padding-bottom: 5pt; margin-bottom: 16pt; font: 8pt Arial, sans-serif; letter-spacing: .09em; text-transform: uppercase; color: #7a1f33; gap: 12pt; }
  .brand__logo { height: 26pt; width: auto; max-width: 90pt; flex: none; }
  .brand__text { display: flex; flex-direction: column; gap: 1pt; text-align: right; }
  .kicker { font: 8.4pt Arial, sans-serif; letter-spacing: .16em; text-transform: uppercase; color: #8a7048; margin: 0 0 5pt; }
  h1 { font-size: 21pt; line-height: 1.12; margin: 0 0 7pt; color: #541c2b; font-weight: normal; }
  .intro { font-size: 11.2pt; color: #3b3532; margin: 0 0 12pt; }
  h2 { font: 9.4pt Arial, sans-serif; letter-spacing: .1em; text-transform: uppercase; color: #541c2b; margin: 15pt 0 6pt; padding-bottom: 3pt; border-bottom: .6pt solid #d8cbb2; }
  ul { margin: 0; padding-left: 15pt; }
  li { margin-bottom: 4.5pt; }
  .warning { margin: 12pt 0 0; border: 1.2pt solid #7a1f33; background: #fdf6f6; padding: 8pt 10pt; font-size: 9.2pt; color: #4a1018; }
  .warning strong { font: 8.4pt Arial, sans-serif; letter-spacing: .08em; text-transform: uppercase; color: #541c2b; display: block; margin-bottom: 3pt; }
  .note { margin-top: 18pt; border-left: 2pt solid #d8cbb2; padding: 7pt 0 7pt 9pt; font-size: 8.8pt; color: #4d4744; }
  .cta { margin-top: 12pt; font: 9pt Arial, sans-serif; color: #541c2b; }
  .footer { margin-top: 14pt; padding-top: 8pt; border-top: .6pt solid #d8cbb2; font: 7.6pt Arial, sans-serif; color: #6b6560; line-height: 1.45; display: flex; justify-content: space-between; align-items: flex-end; gap: 14pt; }
  .footer__text { max-width: 250pt; }
  .footer__qr { flex: none; text-align: center; }
  .footer__qr img { width: 54pt; height: 54pt; display: block; margin-bottom: 3pt; }
  .footer__qr span { display: block; font-size: 6.8pt; }
</style></head>
<body>
  <div class="brand">
    <img class="brand__logo" src="${assets.logo}" alt="" />
    <span class="brand__text"><span>Адвокат Юрий Кочевинов</span><span>Реестровый номер 51/862 · Памятка</span></span>
  </div>
  <p class="kicker">${escape(memo.subtitle)}</p>
  <h1>${escape(memo.title)}</h1>
  <p class="intro">${escape(memo.intro)}</p>
  ${memo.sections.map((section) => `<h2>${escape(section.title)}</h2><ul>${section.items.map((item) => `<li>${escape(item)}</li>`).join('')}</ul>`).join('\n  ')}
  <div class="warning"><strong>Важно</strong>${escape(memo.warning)}</div>
  <p class="note">Это ориентир, а не индивидуальная консультация. Процессуальный статус и обстоятельства дела меняют порядок действий.</p>
  <p class="cta">Вопрос по конкретной ситуации: vk.com/advocat_yuriy51</p>
  <div class="footer">
    <p class="footer__text">${escape(memo.footer)}</p>
    <div class="footer__qr">
      <img src="${assets.qr}" alt="QR-код: vk.com/advocat_yuriy51" />
      <span>Связь через VK</span>
    </div>
  </div>
</body></html>`;

const { browser } = await launchBrowser();
const context = await browser.newContext();
const tab = await context.newPage();
await mkdir('public/memos', { recursive: true });

const assets = {
  logo: await embed('public/logo-dark.png', 'image/png'),
  qr: await embed('public/memos/qr-vk.png', 'image/png'),
};

for (const memo of memos) {
  await tab.setContent(page(memo, assets), { waitUntil: 'load' });
  const pdf = await tab.pdf({ format: 'A4', printBackground: true });
  await writeFile(`public/memos/${memo.slug}.pdf`, pdf);
  console.log(`public/memos/${memo.slug}.pdf`);
}

await browser.close();
