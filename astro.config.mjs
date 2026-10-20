import { defineConfig } from 'astro/config';
import node from '@astrojs/node';
import sitemap from '@astrojs/sitemap';
import fs from 'node:fs';
import path from 'node:path';

/** Есть ли опубликованные дела: если нет — /praktika/ закрыта от индексации. */
function hasPublishedCases() {
  const dir = path.resolve('src/content/cases');
  if (!fs.existsSync(dir)) return false;
  return fs.readdirSync(dir, { recursive: true, withFileTypes: true })
    .filter((entry) => entry.isFile() && entry.name.endsWith('.md'))
    .some((entry) => {
      const text = fs.readFileSync(path.join(entry.parentPath, entry.name), 'utf8');
      const frontmatter = text.match(/^---\r?\n([\s\S]*?)\r?\n---/)?.[1] ?? '';
      // The content schema defaults to draft:true. Only an explicit false is publishable.
      return /^draft:\s*false(?:\s+#.*)?\s*$/m.test(frontmatter);
    });
}

const SITE = process.env.PUBLIC_SITE_URL ?? 'https://kochevinov.ru';
/**
 * Базовый путь. На GitHub Pages проект живёт в подкаталоге: BASE_PATH=/LAWS.
 * На собственном домене переменная не задаётся — сайт публикуется в корне.
 */
const BASE = process.env.BASE_PATH ?? '/';

export default defineConfig({
  site: SITE,
  base: BASE,
  output: 'static',
  security: {
    // Astro's Node adapter validates Host/forwarded hosts independently of Vite's allowlist.
    allowedDomains: [
      { hostname: new URL(SITE).hostname },
      { hostname: 'localhost' },
      { hostname: '127.0.0.1' },
      { hostname: '**.e2b.app' },
      { hostname: '**.e2b.dev' },
    ],
  },
  adapter: node({ mode: 'standalone' }),
  integrations: [
    sitemap({
      // Служебные и noindex-страницы в карту сайта не попадают.
      filter: (page) =>
        !page.includes('/api/') &&
        !page.includes('/soglasie-na-obrabotku-personalnyh-dannyh/') &&
        // Старые адреса разделов: страницы-редиректы на /materialy/ закрыты от индексации.
        !page.includes('/publikacii/') &&
        !page.includes('/obrazcy-zayavleniy/') &&
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
