import { defineMiddleware } from 'astro:middleware';

export const onRequest = defineMiddleware(async (context, next) => {
  const response = await next();

  response.headers.set('X-Content-Type-Options', 'nosniff');
  response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
  response.headers.set('Permissions-Policy', 'geolocation=(), microphone=(), camera=()');
  response.headers.set('X-Permitted-Cross-Domain-Policies', 'none');

  if (context.url.pathname.startsWith('/api/')) {
    response.headers.set('Cache-Control', 'no-store');
  }

  // Dev-режим: HTML не кэшировать — иначе в превью может остаться
  // старая версия страницы после правок (браузер кэширует по умолчанию).
  if (
    import.meta.env.DEV &&
    (context.url.pathname === '/' ||
      context.url.pathname.endsWith('/') ||
      context.url.pathname.endsWith('.html'))
  ) {
    response.headers.set('Cache-Control', 'no-store');
  }

  return response;
});
