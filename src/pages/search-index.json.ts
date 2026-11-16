import type { APIRoute } from 'astro';
import { getSearchEntries } from '../lib/search-items';

export const GET: APIRoute = async () => {
  const payload = await getSearchEntries();

  return new Response(JSON.stringify({ generatedAt: new Date().toISOString().slice(0, 10), items: payload }), {
    headers: {
      'Content-Type': 'application/json; charset=utf-8',
      'Cache-Control': 'public, max-age=3600',
    },
  });
};
