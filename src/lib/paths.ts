/**
 * Префикс базового пути.
 *
 * На GitHub Pages проект живёт в подкаталоге (/LAWS/), на собственном домене — в корне.
 * Значение приходит из `base` в astro.config.mjs (переменная окружения BASE_PATH).
 * Все внутренние ссылки и пути к файлам из public/ прогоняются через withBase().
 */
export const BASE: string = import.meta.env.BASE_URL.replace(/\/+$/, '');

export function withBase(path: string): string {
  if (!path) return path;
  // внешние ссылки, mailto, tel, якоря и data-URL не трогаем
  if (!path.startsWith('/') || path.startsWith('//')) return path;
  if (!BASE) return path;
  // защита от двойного префикса
  if (path === BASE || path.startsWith(`${BASE}/`)) return path;
  return `${BASE}${path}`;
}

/** Абсолютный адрес страницы для canonical, OG и JSON-LD. */
export function canonicalUrl(siteUrl: string, pathname: string): string {
  const clean = pathname.replace(/\/index\.html$/, '/').split('?')[0];
  return new URL(withBase(clean), siteUrl).href;
}

/** Убирает базовый префикс, чтобы сравнивать путь с навигацией. */
export function stripBase(path: string): string {
  if (!BASE) return path;
  if (path === BASE) return '/';
  return path.startsWith(`${BASE}/`) ? path.slice(BASE.length) : path;
}
