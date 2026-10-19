import { defineConfig } from 'astro/config';
import node from '@astrojs/node';
import sitemap from '@astrojs/sitemap';
import fs from 'node:fs';
import path from 'node:path';

/** Есть ли опубликованные дела: если нет — /praktika/ закрыта от индексации. */
function hasPublishedCases() {
  const dir = path.resolve('src/content/cases');
  if (!fs.existsSync(dir)) return false;
  return fs
    .readdirSync(dir)
    .filter((file) => file.endsWith('.md'))
    .some((file) => !/^draft:\s*true/m.test(fs.readFileSync(path.join(dir, file), 'utf8')));
}

const SITE = process.env.PUBLIC_SITE_URL ?? 'https://kochevinov.ru';

export default defineConfig({
  site: SITE,
  output: 'static',
  adapter: node({ mode: 'standalone' }),
  integrations: [
    sitemap({
      // Служебные и noindex-страницы в карту сайта не попадают.
      filter: (page) =>
        !page.includes('/api/') &&
        !page.includes('/soglasie-na-obrabotku-personalnyh-dannyh/') &&
        !page.endsWith('/404/') &&
        (hasPublishedCases() || !page.includes('/praktika/')),
    }),
  ],
  build: { inlineStylesheets: 'auto' },
  devToolbar: { enabled: false },
  vite: {
    server: {
      // Разрешает превью-домены песочницы и локальные хосты.
      allowedHosts: ['.e2b.app', '.e2b.dev', 'localhost', '127.0.0.1'],
    },
    preview: {
      allowedHosts: ['.e2b.app', '.e2b.dev', 'localhost', '127.0.0.1'],
    },
  },
});
