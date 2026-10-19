import type { APIRoute } from 'astro';
import { site } from '../data/site';
import { withBase } from '../lib/paths';

export const GET: APIRoute = () => {
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
