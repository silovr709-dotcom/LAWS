import { test } from 'node:test';
import assert from 'node:assert/strict';
import { promises as fs } from 'node:fs';
import { documents, documentGroupsWithCount } from '../src/data/documents';

test('document samples have unique slugs, real norms and a filled template', () => {
  assert.ok(documents.length >= 20, 'раздел должен покрывать основные документы');
  assert.equal(new Set(documents.map((item) => item.slug)).size, documents.length);
  const slugPattern = /^[a-z0-9-]+$/;
  for (const document of documents) {
    assert.match(document.slug, slugPattern, `slug: ${document.slug}`);
    assert.ok(document.title.length > 8, `title: ${document.slug}`);
    assert.ok(document.summary.length > 40, `summary: ${document.slug}`);
    assert.ok(
      /ст\.|УПК|ГПК|ГК РФ|СК РФ|Закон[а-я]* РФ|ФЗ/.test(document.basis),
      `правовая основа должна ссылаться на нормы: ${document.slug}`,
    );
    assert.ok(document.addressee.length > 10, `addressee: ${document.slug}`);
    assert.ok(document.header.length >= 3, `header: ${document.slug}`);
    assert.ok(document.blocks.length >= 3, `blocks: ${document.slug}`);
    assert.ok(document.appendix.length >= 1, `appendix: ${document.slug}`);
    const text = document.blocks.map((block) => ('p' in block ? block.p : 'h' in block ? block.h : 'ul' in block ? block.ul.join(' ') : block.note)).join(' ');
    assert.ok(!/гарантиру|100 ?%|выиграем|обеспечим результат/i.test(text), `обещание результата: ${document.slug}`);
  }
});

test('every document group is populated and rendered in a stable order', () => {
  assert.equal(documentGroupsWithCount.length, 4);
  assert.equal(
    documentGroupsWithCount.reduce((sum, entry) => sum + entry.items.length, 0),
    documents.length,
  );
  for (const entry of documentGroupsWithCount) assert.ok(entry.items.length > 0, entry.group);
});

test('each sample has a downloadable PDF that is a real document', async () => {
  for (const document of documents) {
    const file = `public/documents/${document.slug}.pdf`;
    const buffer = await fs.readFile(file);
    assert.equal(buffer.subarray(0, 5).toString(), '%PDF-', `${file}: not a PDF`);
    assert.ok(buffer.byteLength > 8_000, `${file}: suspiciously small`);
    const text = buffer.toString('latin1');
    assert.ok(text.includes('/Type /Page'), `${file}: no page objects`);
  }
});

test('published case entries declare how the participation was verified', async () => {
  const { getCollection } = await import('astro:content').catch(() => ({ getCollection: null }));
  // Коллекция читается через Astro; здесь проверяем сами исходники, чтобы тест работал вне сборки.
  const dir = 'src/content/cases';
  const files = (await fs.readdir(dir)).filter((file) => file.endsWith('.md'));
  assert.ok(files.length > 0, 'ожидается хотя бы одно опубликованное дело');
  for (const file of files) {
    const source = await fs.readFile(`${dir}/${file}`, 'utf8');
    assert.match(source, /^verification: '(document|open-source)'$/m, `${file}: verification`);
    if (/verification: 'open-source'/.test(source)) {
      assert.match(source, /^sourceUrl: 'https?:/m, `${file}: open-source case needs a source link`);
      assert.match(source, /^sourceLabel: /m, `${file}: open-source case needs a source label`);
    }
    assert.match(source, /^anonymized: true$/m, `${file}: anonymized`);
    assert.match(source, /^publicationBasis: /m, `${file}: publicationBasis`);
    const narrative = source
      .split('\n')
      .filter((line) => !/^(sourceUrl|sourceLabel|publicationBasis|publishedAt):/.test(line))
      .join('\n');
    assert.doesNotMatch(narrative, /\d{1,2}\.\d{2}\.\d{4}|№\s*\d/, `${file}: looks like a case number or exact date`);
  }
  assert.equal(getCollection, null);
});
