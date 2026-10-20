/**
 * Персональные OG-картинки 1200×630.
 *
 * Раньше у сайта была одна общая картинка. Теперь для каждой страницы, разбора,
 * образца, направления и ситуации собирается своя: заголовок + рубрика.
 * Файлы коммитятся в public/og/, сборка на GitHub Pages не требует рендера.
 *
 * Запуск: npm run og
 */
import { mkdir, writeFile } from 'node:fs/promises';
import { existsSync, readFileSync, readdirSync } from 'node:fs';
import path from 'node:path';
import { Resvg } from '@resvg/resvg-js';
import sharp from 'sharp';
import * as fontkit from 'fontkit';
import { documents } from '../src/data/documents';
import { services } from '../src/data/services';
import { situations } from '../src/data/situations';
import { memos } from '../src/data/memos';

const W = 1200;
const H = 630;

/**
 * TTFs собраны из OFL-наборов @fontsource (latin + cyrillic) — resvg не читает WOFF2.
 * Как пересобрать — scripts/fonts/README.md.
 */
const fonts = {
  display: 'scripts/fonts/CormorantGaramond-Medium.ttf',
  body: 'scripts/fonts/GolosText-Regular.ttf',
  bodyMedium: 'scripts/fonts/GolosText-Medium.ttf',
};

const missing = Object.values(fonts).filter((file) => !existsSync(file));
if (missing.length) throw new Error(`Нет шрифтов: ${missing.join(', ')}`);

type Font = ReturnType<typeof fontkit.openSync>;
const display: Font = fontkit.openSync(fonts.display);

/** Ширина строки в пикселях для заданного кегля. */
const measure = (font: Font, text: string, size: number) => {
  const run = font.layout(text);
  return (run.advanceWidth / font.unitsPerEm) * size;
};

const escapeXml = (value: string) =>
  value.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

const wrap = (text: string, font: Font, size: number, maxWidth: number): string[] => {
  const words = text.split(/\s+/).filter(Boolean);
  const lines: string[] = [];
  let line = '';
  for (const word of words) {
    const candidate = line ? `${line} ${word}` : word;
    if (measure(font, candidate, size) > maxWidth && line) {
      lines.push(line);
      line = word;
    } else {
      line = candidate;
    }
  }
  if (line) lines.push(line);
  return lines;
};

type Card = { path: string; kicker: string; title: string };

const key = (pagePath: string) =>
  pagePath.replace(/^\/+|\/+$/g, '').replace(/\//g, '-') || 'home';

const svg = ({ kicker, title }: Card) => {
  const maxWidth = 830;
  let size = 78;
  let lines = wrap(title, display, size, maxWidth);
  while (lines.length > 3 && size > 52) {
    size -= 8;
    lines = wrap(title, display, size, maxWidth);
  }
  while (lines.length > 4) {
    // страховка для очень длинных заголовков
    size -= 4;
    lines = wrap(title, display, size, maxWidth);
  }

  const lineHeight = Math.round(size * 1.08);
  const blockHeight = lines.length * lineHeight;
  const startY = Math.round((H - blockHeight) / 2 + size * 0.78 + 6);

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}">
  <rect width="${W}" height="${H}" fill="#35121d" />
  <rect x="0" y="0" width="${W}" height="6" fill="#b69a63" />
  <g opacity=".1" fill="none" stroke="#d3bd95" stroke-width="1.5">
    <circle cx="1010" cy="330" r="230" />
    <circle cx="1010" cy="330" r="300" />
  </g>
  <text x="1080" y="560" text-anchor="end" font-family="Cormorant Garamond" font-size="250" fill="#d3bd95" opacity=".12">ЮК</text>
  <text x="88" y="140" font-family="Golos Text" font-size="22" letter-spacing="4" fill="#d3bd95">${escapeXml(kicker.toUpperCase())}</text>
  <rect x="88" y="162" width="64" height="2" fill="#b69a63" />
  ${lines
    .map(
      (line, index) =>
        `<text x="88" y="${startY + index * lineHeight}" font-family="Cormorant Garamond" font-size="${size}" fill="#f6f0e7">${escapeXml(line)}</text>`,
    )
    .join('\n  ')}
  <rect x="88" y="502" width="${W - 176}" height="1" fill="#f6f0e7" opacity=".18" />
  <text x="88" y="552" font-family="Golos Text" font-size="24" fill="#f6f0e7">Адвокат Юрий Кочевинов</text>
  <text x="88" y="584" font-family="Golos Text" font-size="18" fill="#f6f0e7" opacity=".62">Реестровый номер 51/862 · Тверь и Россия</text>
</svg>`;
};

const render = (card: Card) => {
  const resvg = new Resvg(svg(card), {
    fitTo: { mode: 'width', value: W },
    font: {
      fontFiles: Object.values(fonts),
      loadSystemFonts: false,
      defaultFontFamily: 'Golos Text',
    },
  });
  return resvg.render().asPng();
};

const staticCards: Card[] = [
  { path: '/', kicker: 'Адвокат · Тверь и Россия', title: 'Защита, выстроенная по материалам дела' },
  { path: '/srochno/', kicker: 'Срочно · 48 часов', title: 'Задержали. Что делать в первые часы' },
  { path: '/situacii/', kicker: 'Навигатор', title: 'Найдите свою ситуацию' },
  { path: '/sroki/', kicker: 'Инструменты', title: 'Калькуляторы процессуальных сроков' },
  { path: '/48-chasov/', kicker: 'Счётчик · задержание', title: '48 часов: каждый срок виден' },
  { path: '/memos/', kicker: 'Памятки', title: 'Первые 48 часов, обыск, допрос' },
  { path: '/bezopasnaya-peredacha-dokumentov/', kicker: 'Безопасность', title: 'Как передать документы адвокату' },
  { path: '/kak-my-rabotaem/', kicker: 'Порядок работы', title: 'Этапы и стоимость помощи' },
  { path: '/kak-proverit-advokata/', kicker: 'Проверка', title: 'Как проверить, что перед вами адвокат' },
  { path: '/praktika/', kicker: 'Практика', title: 'Дела по открытым данным' },
  { path: '/ob-advokate/', kicker: 'Адвокат', title: 'Юрий Кочевинов' },
  { path: '/materialy/', kicker: 'Материалы', title: 'Разборы и образцы документов' },
  { path: '/materialy/razbory/', kicker: 'Разборы', title: 'Практические разборы ситуаций' },
  { path: '/materialy/obrazcy/', kicker: 'Образцы', title: 'Шаблоны процессуальных документов' },
  { path: '/pomoshch-blizkomu/', kicker: 'Близким', title: 'Если помощь нужна близкому человеку' },
];

const frontmatter = (file: string) => {
  const source = readFileSync(file, 'utf8');
  return {
    title: source.match(/^title:\s*'(.+?)'$/m)?.[1] ?? path.basename(file, '.md'),
    category: source.match(/^category:\s*'(.+?)'$/m)?.[1] ?? '',
  };
};

const articleCards: Card[] = readdirSync('src/content/articles')
  .filter((file) => file.endsWith('.md'))
  .map((file) => {
    const id = file.replace(/\.md$/, '');
    const meta = frontmatter(path.join('src/content/articles', file));
    return { path: `/materialy/razbory/${id}/`, kicker: meta.category || 'Разбор', title: meta.title };
  });

const caseCards: Card[] = (existsSync('src/content/cases') ? readdirSync('src/content/cases') : [])
  .filter((file) => file.endsWith('.md'))
  .map((file) => {
    const id = file.replace(/\.md$/, '');
    const meta = frontmatter(path.join('src/content/cases', file));
    return { path: `/praktika/${id}/`, kicker: 'Практика', title: meta.title };
  });

const cards: Card[] = [
  ...staticCards,
  ...articleCards,
  ...documents.map((document) => ({
    path: `/materialy/obrazcy/${document.slug}/`,
    kicker: document.group,
    title: document.short,
  })),
  ...services.map((service) => ({
    path: `/napravleniya/${service.slug}/`,
    kicker: `Направление ${service.number}`,
    title: service.title,
  })),
  ...situations.map((situation) => ({
    path: `/situacii/${situation.slug}/`,
    kicker: `Ситуация ${situation.code}`,
    title: situation.title,
  })),
  ...memos.map((memo) => ({
    path: `/memos/${memo.slug}/`,
    kicker: 'Памятка',
    title: memo.title,
  })),
  ...caseCards,
];

await mkdir('public/og', { recursive: true });

let written = 0;
for (const card of cards) {
  const target = path.join('public/og', `${key(card.path)}.png`);
  // Палитра втрое уменьшает вес при сохранении читаемости текста.
  const png = await sharp(render(card)).png({ palette: true, quality: 92, compressionLevel: 9 }).toBuffer();
  await writeFile(target, png);
  written += 1;
}

console.log(`OG: ${written} изображений в public/og/`);
