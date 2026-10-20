import sharp from 'sharp';
import { mkdir, readdir, stat } from 'node:fs/promises';
import path from 'node:path';

// Иллюстрации к разборам и ситуациям: единая серия, 3:2, без текста в кадре.
// Источники лежат вне репозитория (.cache), в public попадают только оптимизированные файлы.
const source = process.argv[2] ?? '.cache/editorial/src';
// Необязательный список имён: node scripts/build-editorial.mjs .cache/editorial/src pristavy
const only = process.argv.slice(3);
const target = 'public/media/editorial';
await mkdir(target, { recursive: true });

const widths = [320, 640, 960, 1280];
const ratio = 3 / 2;
let total = 0;

for (const entry of (await readdir(source)).filter((file) => file.endsWith('.png') && (only.length === 0 || only.includes(path.basename(file, '.png')))).sort()) {
  const name = path.basename(entry, '.png');
  const input = path.join(source, entry);
  for (const width of widths) {
    const height = Math.round(width / ratio);
    const pipeline = sharp(input)
      .rotate()
      .resize(width, height, { fit: 'cover', position: 'attention' })
      // Мягкая унификация серии: чуть ниже насыщенность, чуть светлее тени.
      .modulate({ brightness: 1.04, saturation: 0.88 })
      .sharpen({ sigma: 0.6 });
    await pipeline.clone().avif({ quality: 52, effort: 6 }).toFile(`${target}/${name}-${width}.avif`);
    await pipeline.clone().webp({ quality: 82, effort: 5 }).toFile(`${target}/${name}-${width}.webp`);
  }
  const size = (await stat(`${target}/${name}-1280.avif`)).size;
  total += size;
  console.log(name, Math.round(size / 1024), 'KB');
}
console.log('total 1280 avif', Math.round(total / 1024), 'KB');
