import { test } from 'node:test';
import assert from 'node:assert/strict';
import { promises as fs } from 'node:fs';
import path from 'node:path';
import { navigation, siteTools, trustPages } from '../src/data/site';
import { memos } from '../src/data/memos';
import { situations } from '../src/data/situations';
import { articleMemos, articleTools, situationMemos, situationTools } from '../src/data/links';

const collectNonFooterSources = async () => {
  const roots = ['src/pages', 'src/components'];
  const files: string[] = [];
  const walk = async (dir: string) => {
    for (const entry of await fs.readdir(dir, { withFileTypes: true })) {
      const full = path.join(dir, entry.name);
      if (entry.isDirectory()) await walk(full);
      else if (entry.name.endsWith('.astro') && entry.name !== 'Footer.astro') files.push(full);
    }
  };
  for (const root of roots) await walk(root);
  return Promise.all(files.map(async (file) => ({ file, content: await fs.readFile(file, 'utf8') })));
};

test('top navigation covers all six core pillars of the site', () => {
  assert.deepEqual(
    navigation.map((item) => item.label),
    ['Направления', 'Ситуации', 'Материалы', 'Инструменты', 'Результаты', 'Обо мне'],
  );
  assert.equal(navigation.find((item) => item.label === 'Инструменты')?.href, '/instrumenty/');
  assert.equal(navigation.find((item) => item.label === 'Ситуации')?.href, '/situacii/');
});

test('no tool, urgent guide or trust page is reachable only from the footer', async () => {
  const sources = await collectNonFooterSources();
  const mustBeWellDistributed = [
    '/instrumenty/',
    '/48-chasov/',
    '/proverka-zayavleniya/',
    '/sroki/',
    '/memos/',
    '/pomoshch-blizkomu/',
    '/kak-my-rabotaem/',
    '/kak-proverit-advokata/',
    '/bezopasnaya-peredacha-dokumentov/',
    '/situacii/',
    '/srochno/',
    '/materialy/',
    '/materialy/razbory/',
    '/materialy/obrazcy/',
    '/poisk/',
  ];

  for (const target of mustBeWellDistributed) {
    const incoming = sources.filter(
      ({ file, content }) =>
        content.includes(target) ||
        (target === '/48-chasov/' && file.endsWith('ToolsPreview.astro')) ||
        (target === '/proverka-zayavleniya/' && file.endsWith('ToolsPreview.astro')),
    );
    assert.ok(
      incoming.length >= 3,
      `Маршрут ${target} должен быть встроен минимум в 3 шаблона/компонента вне подвала (найдено: ${incoming.length})`,
    );
  }

  assert.equal(siteTools.length, 4);
  assert.equal(trustPages.length, 3);
});

test('tool and memo cross-links resolve to valid pages and valid target anchors', async () => {
  const knownArticles = new Set(
    (await fs.readdir('src/content/articles'))
      .filter((file) => file.endsWith('.md'))
      .map((file) => file.replace(/\.md$/, '')),
  );
  const knownSituations = new Set(situations.map((item) => item.slug));
  const knownMemos = new Set(memos.map((item) => item.slug));

  for (const [articleId, slugs] of Object.entries(articleMemos)) {
    assert.ok(knownArticles.has(articleId), `unknown article in articleMemos: ${articleId}`);
    for (const slug of slugs) assert.ok(knownMemos.has(slug), `unknown memo in articleMemos: ${slug}`);
  }

  for (const [situationSlug, slugs] of Object.entries(situationMemos)) {
    assert.ok(knownSituations.has(situationSlug), `unknown situation in situationMemos: ${situationSlug}`);
    for (const slug of slugs) assert.ok(knownMemos.has(slug), `unknown memo in situationMemos: ${slug}`);
  }

  const allLinkedTools = [
    ...Object.entries(articleTools).flatMap(([id, items]) => {
      assert.ok(knownArticles.has(id), `unknown article in articleTools: ${id}`);
      return items;
    }),
    ...Object.entries(situationTools).flatMap(([slug, items]) => {
      assert.ok(knownSituations.has(slug), `unknown situation in situationTools: ${slug}`);
      return items;
    }),
  ];

  const pageSources = new Map<string, string>();
  const loadPage = async (routePath: string) => {
    if (!pageSources.has(routePath)) {
      const clean = routePath.replace(/^\/+|\/+$/g, '');
      const candidates = [
        `src/pages/${clean}.astro`,
        `src/pages/${clean}/index.astro`,
        'src/components/FirstMessage.astro',
      ];
      let combined = '';
      for (const candidate of candidates) {
        try {
          combined += '\n' + (await fs.readFile(candidate, 'utf8'));
        } catch {
          // ignore non-matching path shape
        }
      }
      pageSources.set(routePath, combined);
    }
    return pageSources.get(routePath) ?? '';
  };

  for (const tool of allLinkedTools) {
    const [routePath, hash] = tool.href.split('#');
    const source = await loadPage(routePath);
    assert.ok(source.length > 0, `target page does not exist for ${tool.href}`);
    if (hash) {
      assert.match(source, new RegExp(`id="${hash}"`), `missing id="${hash}" on ${routePath}`);
    }
  }
});
