/**
 * Генерация PDF для раздела «Образцы заявлений».
 *
 * PDF собираются типографским способом из тех же данных, что и страницы сайта
 * (src/data/documents.ts), поэтому текст на сайте и в файле не расходятся.
 * Готовые файлы коммитятся в public/documents/, чтобы сборка на GitHub Pages
 * не требовала браузера.
 *
 * Запуск (нужны опциональные инструменты из docs/QA.md):
 *   npm install --prefix .cache/audit-tools --no-save playwright-core @sparticuz/chromium
 *   npm run documents
 */
import { mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { documents, type LegalDocument } from '../src/data/documents';
import { launchBrowser } from './lib/browser.mjs';

const escape = (value: string) =>
  value.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

const blockMarkup = (document: LegalDocument) =>
  document.blocks
    .map((block) => {
      if ('h' in block) return `<h2>${escape(block.h)}</h2>`;
      if ('p' in block) return `<p>${escape(block.p)}</p>`;
      if ('ul' in block) return `<ul>${block.ul.map((item) => `<li>${escape(item)}</li>`).join('')}</ul>`;
      return `<p class="note">${escape(block.note)}</p>`;
    })
    .join('\n');

const page = (document: LegalDocument) => `<!doctype html>
<html lang="ru"><head><meta charset="utf-8"><title>${escape(document.title)}</title>
<style>
  @page { size: A4; margin: 18mm 20mm 16mm; }
  * { box-sizing: border-box; }
  body { margin: 0; font-family: "PT Serif", Georgia, "Times New Roman", serif; font-size: 11pt; line-height: 1.5; color: #1a1a1a; overflow-wrap: anywhere; }
  .brand { display: flex; justify-content: space-between; align-items: baseline; border-bottom: .8pt solid #7a1f33; padding-bottom: 5pt; margin-bottom: 14pt; font-size: 8.5pt; letter-spacing: .08em; text-transform: uppercase; color: #7a1f33; font-family: Arial, sans-serif; }
  .header { margin-bottom: 14pt; font-size: 10.5pt; line-height: 1.5; }
  .header div { overflow-wrap: anywhere; }
  h1 { font-size: 14pt; text-align: center; margin: 16pt 0 2pt; letter-spacing: .04em; font-family: Arial, sans-serif; }
  .subhead { text-align: center; font-size: 10.5pt; margin: 0 0 14pt; }
  h2 { font-size: 11pt; margin: 13pt 0 4pt; font-family: Arial, sans-serif; }
  p { margin: 0 0 7pt; text-align: left; }
  ul { margin: 0 0 8pt; padding-left: 16pt; }
  li { margin-bottom: 3pt; text-align: left; overflow-wrap: anywhere; }
  .note { font-size: 9.5pt; color: #4a4a4a; border-left: 2pt solid #d8cbb2; padding-left: 8pt; text-align: left; }
  .appendix { margin-top: 12pt; }
  .appendix ol { margin: 0; padding-left: 18pt; font-size: 10.5pt; }
  .closing { margin-top: 22pt; display: flex; justify-content: space-between; font-size: 10.5pt; }
  .closing span { white-space: pre-line; overflow-wrap: anywhere; }
  .brand span { white-space: nowrap; }
  .rule { margin-top: 26pt; padding-top: 6pt; border-top: .6pt solid #d8cbb2; font-family: Arial, sans-serif; font-size: 7.6pt; color: #6b6b6b; line-height: 1.4; }
</style></head>
<body>
  <div class="brand"><span>Адвокат Юрий Кочевинов · реестровый номер 51/862</span><span>Образец документа</span></div>
  <div class="header">${document.header.map((line) => `<div>${escape(line)}</div>`).join('')}</div>
  <h1>${escape(document.heading)}</h1>
  <p class="subhead">${escape(document.subheading)}</p>
  ${blockMarkup(document)}
  <div class="appendix"><h2>Приложение</h2><ol>${document.appendix.map((item) => `<li>${escape(item)}</li>`).join('')}</ol></div>
  <div class="closing"><span>${escape(document.closing)}</span><span>«____» ____________ 20____ г.</span></div>
  <div class="rule">
    Образец носит информационный характер, не является юридической консультацией и требует адаптации
    к обстоятельствам дела. Правовая основа: ${escape(document.basis)}.
    Адвокат Юрий Анатольевич Кочевинов · vk.com/advocat_yuriy51
  </div>
</body></html>`;

const outDir = 'public/documents';
await mkdir(outDir, { recursive: true });
const { browser } = await launchBrowser();
try {
  const context = await browser.newContext();
  for (const document of documents) {
    const target = path.resolve(outDir, `${document.slug}.pdf`);
    await writeFile(path.join('.cache', `document-${document.slug}.html`), page(document));
    const tab = await context.newPage();
    await tab.setContent(page(document), { waitUntil: 'load' });
    await tab.pdf({ path: target, format: 'A4', printBackground: true });
    await tab.close();
    console.log(`${target}`);
  }
  await context.close();
} finally {
  await browser.close();
}
