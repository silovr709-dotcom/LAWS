import { test } from 'node:test';
import assert from 'node:assert/strict';
import { promises as fs } from 'node:fs';
import { documents } from '../src/data/documents';
import { about, navigation } from '../src/data/site';
import { reviews } from '../src/data/reviews';

test('materials combine reviews and document samples in one section', async () => {
  const files = (await fs.readdir('src/content/articles')).filter((file) => file.endsWith('.md'));
  assert.ok(files.length >= 12, 'в разделе должно быть не меньше 12 разборов');
  assert.ok(documents.length >= 20, 'в разделе должно быть не меньше 20 образцов');
  for (const file of files) {
    const source = await fs.readFile(`src/content/articles/${file}`, 'utf8');
    const title = source.match(/^title: '(.*)'$/m)?.[1] ?? '';
    const description = source.match(/^description: '(.*)'$/m)?.[1] ?? '';
    const readingTime = source.match(/^readingTime: '(.*)'$/m)?.[1] ?? '';
    assert.ok(title.length > 12, `${file}: title`);
    assert.ok(title.length <= 120, `${file}: title too long`);
    assert.ok(description.length > 60 && description.length <= 300, `${file}: description`);
    assert.ok(readingTime.length > 0, `${file}: readingTime`);
    assert.doesNotMatch(source, /^draft: true$/m, `${file}: черновик не должен попадать в раздел`);
  }
});

test('navigation keeps a single «Материалы» item instead of two competing sections', () => {
  const labels = navigation.map((item) => item.label);
  assert.equal(new Set(labels).size, labels.length, 'дубли в навигации');
  assert.equal(labels.filter((label) => label === 'Материалы').length, 1);
  assert.ok(!labels.includes('Образцы заявлений'));
  assert.equal(navigation.find((item) => item.label === 'Материалы')?.href, '/materialy/');
  assert.equal(navigation.find((item) => item.label === 'Результаты')?.href, '/praktika/');
});

test('old URLs stay reachable as noindex redirects to /materialy/', async () => {
  const stubs = [
    'src/pages/publikacii/index.astro',
    'src/pages/publikacii/[slug].astro',
    'src/pages/obrazcy-zayavleniy/index.astro',
    'src/pages/obrazcy-zayavleniy/[slug].astro',
  ];
  for (const stub of stubs) {
    const source = await fs.readFile(stub, 'utf8');
    assert.match(source, /http-equiv="refresh"/, `${stub}: нет meta refresh`);
    assert.match(source, /noindex/, `${stub}: редирект должен быть закрыт от индексации`);
    assert.match(source, /materialy\//, `${stub}: нет ссылки на новый раздел`);
  }
  for (const slug of ['zayavlenie-o-prestuplenii', 'isk-o-vzyskanii-alimentov']) {
    await fs.access(`src/pages/materialy/obrazcy/[slug].astro`);
    assert.ok(documents.some((document) => document.slug === slug), slug);
  }
});

test('biography alternates text and photos and reflects the current practice', () => {
  assert.equal(about.story.length, 5, 'ожидается пять блоков «путь»');
  for (const block of about.story) {
    assert.ok(block.title.length > 10, block.title);
    assert.ok(block.paragraphs.length >= 2, block.title);
    assert.ok(block.image < about.gallery.length, `${block.title}: image index`);
  }
  const text = [...about.story.flatMap((block) => block.paragraphs), ...about.timeline.map((item) => item.text)].join(' ');
  assert.match(text, /Кировск/);
  assert.match(text, /Первомайского/);
  assert.match(text, /26 мая 2023/);
  assert.match(text, /АО51\/257/);
  assert.match(text, /Правоохранительные и судебные органы/);
  assert.match(text, /Панфилов и партнёры/);
});

test('reviews are public-source quotes with links and no personal data', () => {
  assert.ok(reviews.length >= 5);
  for (const review of reviews) {
    assert.match(review.sourceUrl, /^https:\/\/vk\.com\/topic-/);
    assert.ok(review.quote.length > 40, review.date);
    assert.doesNotMatch(review.quote, /\+7|@|http/, 'в цитате не должно быть контактов');
  }
});
