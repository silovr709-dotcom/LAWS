import type { APIRoute } from 'astro';
import { site } from '../data/site';
import { withBase } from '../lib/paths';

export const GET: APIRoute = () => {
  // Временные размещения не индексируются: сайт должен попадать в поиск с постоянного домена.
  if (import.meta.env.PUBLIC_NOINDEX === 'true') {
    return new Response('User-agent: *\nDisallow: /\n', {
      headers: { 'Content-Type': 'text/plain; charset=utf-8' },
    });
  }

  const body = [
    'User-agent: *',
    'Allow: /',
    'Disallow: /api/',
    'Disallow: /soglasie-na-obrabotku-personalnyh-dannyh/',
    '',
    `Sitemap: ${site.url}${withBase('/sitemap-index.xml')}`,
    '',
  ].join('\n');

  return new Response(body, {
    headers: {
      'Content-Type': 'text/plain; charset=utf-8',
      'Cache-Control': 'public, max-age=3600',
    },
  });
};
