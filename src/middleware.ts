import { defineMiddleware } from 'astro:middleware';
import { stripBase } from './lib/paths';

export const onRequest = defineMiddleware(async (context, next) => {
  const response = await next();

  response.headers.set('X-Content-Type-Options', 'nosniff');
  response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
  response.headers.set('Permissions-Policy', 'geolocation=(), microphone=(), camera=()');
  response.headers.set('X-Permitted-Cross-Domain-Policies', 'none');

  if (stripBase(context.url.pathname).startsWith('/api/')) {
    response.headers.set('Cache-Control', 'no-store');
  }

  return response;
});
