import type { APIRoute } from 'astro';
import { site } from '../data/site';
import { canonicalUrl, withBase } from '../lib/paths';
import { siteNoindex } from '../lib/indexing';

export const GET: APIRoute = () => {
  // Временные размещения не индексируются: сайт должен попадать в поиск с постоянного домена.
  if (siteNoindex) {
    return new Response('User-agent: *\nDisallow: /\n', {
      headers: { 'Content-Type': 'text/plain; charset=utf-8' },
    });
  }

  const body = [
    'User-agent: *',
    'Allow: /',
    `Disallow: ${withBase('/api/')}`,
    `Disallow: ${withBase('/soglasie-na-obrabotku-personalnyh-dannyh/')}`,
    '',
    `Sitemap: ${canonicalUrl(site.url, '/sitemap-index.xml')}`,
    '',
  ].join('\n');

  return new Response(body, {
    headers: {
      'Content-Type': 'text/plain; charset=utf-8',
      'Cache-Control': 'public, max-age=3600',
    },
  });
};
