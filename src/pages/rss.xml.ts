import type { APIRoute } from 'astro';
import { getCollection } from 'astro:content';
import { site } from '../data/site';
import { canonicalUrl } from '../lib/paths';

const escapeXml = (value: string) =>
  value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');

export const GET: APIRoute = async () => {
  const articles = (await getCollection('articles', ({ data }) => !data.draft)).sort(
    (a, b) => b.data.publishedAt.getTime() - a.data.publishedAt.getTime(),
  );

  const items = articles
    .map((article) => {
      const url = canonicalUrl(site.url, `/materialy/razbory/${article.id}/`);
      return [
        '    <item>',
        `      <title>${escapeXml(article.data.title)}</title>`,
        `      <link>${escapeXml(url)}</link>`,
        `      <guid isPermaLink="true">${escapeXml(url)}</guid>`,
        `      <description>${escapeXml(article.data.description)}</description>`,
        `      <category>${escapeXml(article.data.category)}</category>`,
        `      <pubDate>${article.data.publishedAt.toUTCString()}</pubDate>`,
        '    </item>',
      ].join('\n');
    })
    .join('\n');

  const body = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">
  <channel>
    <title>Разборы и материалы — адвокат ${escapeXml(site.name)}</title>
    <link>${escapeXml(canonicalUrl(site.url, '/materialy/razbory/'))}</link>
    <description>Практические разборы ситуаций: права, сроки, порядок действий и документы.</description>
    <language>ru</language>
    <lastBuildDate>${new Date().toUTCString()}</lastBuildDate>
    <atom:link href="${escapeXml(canonicalUrl(site.url, '/rss.xml'))}" rel="self" type="application/rss+xml" />
${items}
  </channel>
</rss>
`;

  return new Response(body, {
    headers: {
      'Content-Type': 'application/rss+xml; charset=utf-8',
      'Cache-Control': 'public, max-age=3600',
    },
  });
};
