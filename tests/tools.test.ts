import { test } from 'node:test';
import assert from 'node:assert/strict';
import { promises as fs } from 'node:fs';
import sharp from 'sharp';
import {
  appealDeadline,
  bailiffAppealDeadline,
  checkupDeadline,
  detentionDeadline,
  detentionTimeline,
  alimonyAmount,
  alimonyShare,
  shiftToWorkingDay,
} from '../src/lib/deadlines';
import { situations } from '../src/data/situations';
import { memos } from '../src/data/memos';
import { documents } from '../src/data/documents';
import { services } from '../src/data/services';
import { articleDocuments, articleSituations, serviceDocuments } from '../src/data/links';

const articleIds = async () =>
  new Set((await fs.readdir('src/content/articles')).filter((file) => file.endsWith('.md')).map((file) => file.replace(/\.md$/, '')));

test('detention timeline marks five checkpoints and the nearest one', () => {
  const start = new Date(2026, 9, 20, 9, 0);
  const tenHours = detentionTimeline(start, new Date(2026, 9, 20, 19, 0));
  assert.equal(tenHours.milestones.length, 5);
  assert.deepEqual(tenHours.milestones.map((item) => item.hours), [3, 12, 24, 48, 72]);
  assert.equal(tenHours.expired, false);
  assert.deepEqual(tenHours.milestones.map((item) => item.passed), [true, false, false, false, false]);
  assert.deepEqual(tenHours.milestones.map((item) => item.next), [false, true, false, false, false]);
  assert.equal(tenHours.milestones[1].at.getHours(), 21);
  assert.equal(tenHours.remaining, 38 * 60 * 60 * 1000);
  assert.equal(tenHours.elapsed, 10 * 60 * 60 * 1000);
});

test('detention timeline stops highlighting a next step after 48 hours', () => {
  const start = new Date(2026, 9, 18, 12, 0);
  const expired = detentionTimeline(start, new Date(2026, 9, 20, 19, 47));
  assert.equal(expired.expired, true);
  assert.equal(expired.milestones.filter((item) => item.passed).length, 4);
  assert.equal(expired.milestones.some((item) => item.next), false);
  assert.ok(expired.remaining < 0);
});

test('48 hours are added exactly, without timezone drift', () => {
  const start = new Date(2026, 9, 20, 22, 30);
  const { release } = detentionDeadline(start);
  assert.equal(release.getTime() - start.getTime(), 48 * 60 * 60 * 1000);
  assert.equal(release.getDate(), 22);
});

test('appeal deadline is 10 days and moves off a weekend', () => {
  // 24 октября 2026 — суббота; 10 суток истекают 3 ноября, но 3 ноября — вторник, поэтому без переноса.
  const weekday = appealDeadline(new Date(2026, 9, 24));
  assert.equal(weekday.date.getDate(), 3);
  assert.equal(weekday.date.getMonth(), 10);
  assert.equal(weekday.shifted, false);

  // 25 октября 2026 (воскресенье) + 10 суток = 4 ноября (среда).
  const sunday = appealDeadline(new Date(2026, 9, 25));
  assert.equal(sunday.date.getDate(), 4);
});

test('appeal for a person in custody counts from the copy of the judgment', () => {
  const result = appealDeadline(new Date(2026, 9, 1), {
    inCustody: true,
    copyServed: new Date(2026, 9, 12),
  });
  assert.equal(result.date.getDate(), 22);
  assert.equal(result.basis, 'со дня вручения копии приговора');
});

test('checkup deadlines: 3, 10 and 30 days with weekend shifts', () => {
  const registered = new Date(2026, 9, 19); // понедельник
  assert.equal(checkupDeadline(registered, 3).date.getDate(), 22);
  assert.equal(checkupDeadline(registered, 10).date.getDate(), 29);
  const month = checkupDeadline(registered, 30).date;
  assert.equal(month.getMonth(), 10);
  assert.equal(month.getDate(), 18);
});

test('bailiff appeal and working-day shift', () => {
  const learned = new Date(2026, 9, 21); // среда; +10 дней = суббота 31 октября
  const { date, shifted } = bailiffAppealDeadline(learned);
  assert.equal(date.getDate(), 2);
  assert.equal(date.getMonth(), 10);
  assert.equal(shifted, true);

  const sunday = shiftToWorkingDay(new Date(2026, 9, 25));
  assert.equal(sunday.date.getDay(), 1);
  assert.equal(sunday.shifted, true);
});

test('alimony shares follow article 81 of the Family Code', () => {
  assert.equal(alimonyShare(1), 0.25);
  assert.equal(alimonyShare(2), 1 / 3);
  assert.equal(alimonyShare(3), 0.5);
  assert.equal(alimonyAmount(60000, 1), 15000);
  assert.equal(alimonyAmount(60000, 2), 20000);
  assert.equal(alimonyAmount(0, 2), 0);
});

test('situation navigator covers eight situations with real links', async () => {
  assert.equal(situations.length, 8);
  assert.equal(new Set(situations.map((item) => item.slug)).size, 8);
  const knownDocs = new Set(documents.map((document) => document.slug));
  const knownArticles = await articleIds();
  const knownServices = new Set(services.map((service) => service.slug));
  for (const situation of situations) {
    assert.ok(situation.steps.length >= 4, `${situation.slug}: too few steps`);
    assert.ok(situation.rights.length >= 3, `${situation.slug}: too few rights`);
    assert.ok(situation.avoid.length >= 3, `${situation.slug}: too few warnings`);
    for (const slug of situation.docs) assert.ok(knownDocs.has(slug), `${situation.slug}: unknown document ${slug}`);
    for (const id of situation.articles) assert.ok(knownArticles.has(id), `${situation.slug}: unknown article ${id}`);
    if (situation.service) assert.ok(knownServices.has(situation.service), `${situation.slug}: unknown service`);
  }
});

test('cross-links point to existing documents, articles and services', async () => {
  const knownDocs = new Set(documents.map((document) => document.slug));
  const knownArticles = await articleIds();
  const knownServices = new Set(services.map((service) => service.slug));
  for (const [article, docs] of Object.entries(articleDocuments)) {
    assert.ok(knownArticles.has(article), `unknown article in links: ${article}`);
    for (const slug of docs) assert.ok(knownDocs.has(slug), `unknown document in links: ${slug}`);
  }
  for (const [service, docs] of Object.entries(serviceDocuments)) {
    assert.ok(knownServices.has(service), `unknown service in links: ${service}`);
    for (const slug of docs) assert.ok(knownDocs.has(slug), `unknown document in links: ${slug}`);
  }
  for (const [article, slugs] of Object.entries(articleSituations)) {
    assert.ok(knownArticles.has(article), `unknown article in situations: ${article}`);
    for (const slug of slugs) assert.ok(situations.some((item) => item.slug === slug), `unknown situation: ${slug}`);
  }
});

test('every memo has a printable page and a PDF', async () => {
  assert.equal(memos.length, 3);
  for (const memo of memos) {
    assert.ok(memo.sections.length >= 3, `${memo.slug}: too few sections`);
    assert.ok(memo.sections.every((section) => section.items.length >= 3), `${memo.slug}: empty section`);
    const pdf = await fs.readFile(`public/memos/${memo.slug}.pdf`);
    assert.ok(pdf.subarray(0, 4).toString() === '%PDF', `${memo.slug}: not a PDF`);
    assert.ok(pdf.byteLength > 8000, `${memo.slug}: PDF looks empty`);
  }
});

test('personal OG cards exist for key pages and stay 1200 × 630', async () => {
  const files = (await fs.readdir('public/og')).filter((file) => file.endsWith('.png'));
  assert.ok(files.length >= 60, `too few OG cards: ${files.length}`);
  for (const name of [
    'home.png',
    'srochno.png',
    'situacii.png',
    'situacii-obysk.png',
    'sroki.png',
    'memos.png',
    'materialy-razbory-obysk-v-pomeshchenii.png',
    'materialy-obrazcy-zhaloba-125-upk.png',
    'napravleniya-dosledstvennaya-proverka.png',
  ]) {
    assert.ok(files.includes(name), `missing OG card: ${name}`);
  }
  for (const name of files) {
    const meta = await sharp(`public/og/${name}`).metadata();
    assert.equal(meta.width, 1200, `${name}: wrong width`);
    assert.equal(meta.height, 630, `${name}: wrong height`);
  }
});
