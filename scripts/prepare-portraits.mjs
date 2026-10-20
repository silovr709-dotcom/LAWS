import sharp from 'sharp';
import { mkdir, stat, writeFile } from 'node:fs/promises';
import { openSync } from 'fontkit';

// Only AI-generated artwork goes here. The owner's identity-reference photographs never enter public/.
const source = process.argv[2] ?? 'assets/generated-portraits';
await mkdir('public/images', { recursive: true });
await mkdir('public/og', { recursive: true });
for (const [name, ratio] of [['hero', 4 / 5], ['about', 3 / 4]]) {
  const input = `${source}/yuriy-${name}.png`;
  for (const width of [320, 640, 960]) {
    const image = sharp(input).rotate().resize(width, Math.round(width / ratio), { fit: 'cover', position: 'attention' });
    await image.clone().webp({ quality: 84, effort: 5 }).toFile(`public/images/yuriy-${name}-${width}.webp`);
    await image.clone().avif({ quality: 54, effort: 5 }).toFile(`public/images/yuriy-${name}-${width}.avif`);
  }
}
const metadata = await sharp(`${source}/yuriy-hero.png`).metadata();
const cropSize = Math.round(metadata.width * .58);
await sharp(`${source}/yuriy-hero.png`).extract({ left: Math.round(metadata.width * .23), top: Math.round(metadata.height * .09), width: cropSize, height: cropSize }).resize(192, 192).webp({ quality: 86 }).toFile('public/images/yuriy-avatar.webp');

// Text outlines make both OG formats reproducible, without relying on system fonts or remote requests.
const loadFamily = (name) => ['cyrillic', 'latin'].map((subset) => openSync(`node_modules/@fontsource/${name}/files/${name}-${subset}-400-normal.woff`));
const serif = loadFamily('cormorant-garamond');
const sans = loadFamily('golos-text');
function lettering(text, x, y, size, color, family = sans, spacing = 0) {
  const runs = [];
  for (const char of text) {
    const font = family.find((entry) => entry.hasGlyphForCodePoint(char.codePointAt(0)));
    if (!font) throw new Error(`Missing OG glyph: ${char}`);
    const previous = runs.at(-1);
    if (previous?.font === font) previous.text += char;
    else runs.push({ font, text: char });
  }
  let markup = '';
  for (const run of runs) {
    const scale = size / run.font.unitsPerEm;
    const layout = run.font.layout(run.text);
    for (let i = 0; i < layout.glyphs.length; i++) {
      const position = layout.positions[i];
      markup += `<path d="${layout.glyphs[i].path.toSVG()}" transform="translate(${x + position.xOffset * scale} ${y - position.yOffset * scale}) scale(${scale} ${-scale})" fill="${color}"/>`;
      x += position.xAdvance * scale + spacing;
    }
  }
  return markup;
}
const portrait = await sharp(`${source}/yuriy-hero.png`).resize(455, 630, { fit: 'cover', position: 'attention' }).png().toBuffer();
const svg = `<svg width="1200" height="630" viewBox="0 0 1200 630" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink"><title>Адвокат Юрий Кочевинов · Тверь и Россия</title><desc>ИИ-портрет по фотографиям адвоката. Не документальная съёмка.</desc><rect width="1200" height="630" fill="#35121d"/><path d="M65 81h100" stroke="#d3bd95"/><image xlink:href="data:image/png;base64,${portrait.toString('base64')}" x="745" y="0" width="455" height="630"/>${lettering('АДВОКАТ · ТВЕРЬ',65,135,19,'#d3bd95',sans,3)}${lettering('Юрий',61,241,88,'#f6f0e7',serif)}${lettering('Кочевинов',61,323,88,'#f6f0e7',serif)}${lettering('Уголовно-правовая защита',65,398,26,'#f6f0e7')}${lettering('Тверь. Работа по всей России.',65,442,21,'#d3bd95')}${lettering('Реестровый номер 51/862',65,554,17,'#d3bd95')}<path d="M65 583h600" stroke="#74515a"/><rect x="763" y="582" width="140" height="30" fill="#250b13" fill-opacity=".88"/>${lettering('ИИ-портрет',776,603,14,'#f6f0e7')}</svg>`;
await writeFile('public/og/og-default.svg', svg);
await sharp(Buffer.from(svg)).png({ compressionLevel: 9, palette: true }).toFile('public/og/og-default.png');
for (const file of ['public/images/yuriy-hero-960.avif', 'public/images/yuriy-about-960.avif', 'public/og/og-default.png']) console.log(file, Math.round((await stat(file)).size / 1024), 'KB');
