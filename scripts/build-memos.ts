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
import { mkdir, writeFile } from 'node:fs/promises';
import { memos, type Memo } from '../src/data/memos';
import { launchBrowser } from './lib/browser.mjs';

const escape = (value: string) =>
  value.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

const page = (memo: Memo) => `<!doctype html>
<html lang="ru"><head><meta charset="utf-8"><title>${escape(memo.title)}</title>
<style>
  @page { size: A4; margin: 17mm 19mm 15mm; }
  * { box-sizing: border-box; }
  body { margin: 0; font-family: Georgia, "Times New Roman", serif; font-size: 10.6pt; line-height: 1.45; color: #1c1a19; }
  .brand { display: flex; justify-content: space-between; align-items: baseline; border-bottom: .8pt solid #7a1f33; padding-bottom: 5pt; margin-bottom: 16pt; font: 8pt Arial, sans-serif; letter-spacing: .09em; text-transform: uppercase; color: #7a1f33; }
  .kicker { font: 8.4pt Arial, sans-serif; letter-spacing: .16em; text-transform: uppercase; color: #8a7048; margin: 0 0 5pt; }
  h1 { font-size: 21pt; line-height: 1.12; margin: 0 0 7pt; color: #541c2b; font-weight: normal; }
  .intro { font-size: 11.2pt; color: #3b3532; margin: 0 0 16pt; }
  h2 { font: 9.4pt Arial, sans-serif; letter-spacing: .1em; text-transform: uppercase; color: #541c2b; margin: 15pt 0 6pt; padding-bottom: 3pt; border-bottom: .6pt solid #d8cbb2; }
  ul { margin: 0; padding-left: 15pt; }
  li { margin-bottom: 4.5pt; }
  .note { margin-top: 18pt; border-left: 2pt solid #d8cbb2; padding: 7pt 0 7pt 9pt; font-size: 8.8pt; color: #4d4744; }
  .footer { margin-top: 16pt; padding-top: 6pt; border-top: .6pt solid #d8cbb2; font: 7.6pt Arial, sans-serif; color: #6b6560; line-height: 1.45; }
  .cta { margin-top: 12pt; font: 9pt Arial, sans-serif; color: #541c2b; }
</style></head>
<body>
  <div class="brand"><span>Адвокат Юрий Кочевинов · реестровый номер 51/862</span><span>Памятка</span></div>
  <p class="kicker">${escape(memo.subtitle)}</p>
  <h1>${escape(memo.title)}</h1>
  <p class="intro">${escape(memo.intro)}</p>
  ${memo.sections.map((section) => `<h2>${escape(section.title)}</h2><ul>${section.items.map((item) => `<li>${escape(item)}</li>`).join('')}</ul>`).join('\n  ')}
  <p class="note">Это ориентир, а не индивидуальная консультация. Процессуальный статус и обстоятельства дела меняют порядок действий.</p>
  <p class="cta">Вопрос по конкретной ситуации: vk.com/advocat_yuriy51</p>
  <p class="footer">${escape(memo.footer)}</p>
</body></html>`;

const { browser } = await launchBrowser();
const context = await browser.newContext();
const tab = await context.newPage();
await mkdir('public/memos', { recursive: true });

for (const memo of memos) {
  await tab.setContent(page(memo), { waitUntil: 'load' });
  const pdf = await tab.pdf({ format: 'A4', printBackground: true });
  await writeFile(`public/memos/${memo.slug}.pdf`, pdf);
  console.log(`public/memos/${memo.slug}.pdf`);
}

await browser.close();
