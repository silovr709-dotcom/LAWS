import type { APIRoute } from 'astro';
import { promises as fs } from 'node:fs';
import path from 'node:path';

export const prerender = false;

/**
 * Обработка формы обращения.
 *
 * Что делает эндпоинт:
 *  - проверяет origin, тип и размер запроса;
 *  - валидирует поля и отсекает ботов (honeypot + минимальное время заполнения);
 *  - ограничивает частоту обращений с одного IP;
 *  - сохраняет обращение в JSONL-файл вне публичной директории;
 *  - при наличии LEADS_WEBHOOK_URL отправляет уведомление во внешний сервис.
 *
 * Чего эндпоинт не делает: не отправляет email самостоятельно и не пишет в CRM.
 * Подключение почты/CRM описано в README.md и docs/DEPLOY.md.
 */

const MAX_BODY_BYTES = 8_000;
const RATE_LIMIT = 5;
const RATE_WINDOW_MS = 60 * 60 * 1000;
const MIN_FILL_MS = 1_500;
const MAX_FILL_MS = 24 * 60 * 60 * 1000;

type LeadPayload = {
  name: string;
  phone: string;
  channel: 'call' | 'sms' | 'email';
  message?: string;
  consent: boolean;
  website?: string;
  startedAt?: number;
};

const rateBuckets = new Map<string, number[]>();

function jsonResponse(data: unknown, status = 200): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      'Content-Type': 'application/json; charset=utf-8',
      'Cache-Control': 'no-store',
      'X-Content-Type-Options': 'nosniff',
    },
  });
}

function clean(value: unknown, maxLength: number): string {
  if (typeof value !== 'string') return '';
  return value
    .replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/g, '')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, maxLength);
}

function isRateLimited(ip: string): boolean {
  const now = Date.now();
  const bucket = (rateBuckets.get(ip) ?? []).filter((time) => now - time < RATE_WINDOW_MS);
  bucket.push(now);
  rateBuckets.set(ip, bucket);

  if (rateBuckets.size > 5_000) {
    for (const [key, times] of rateBuckets) {
      if (times.every((time) => now - time >= RATE_WINDOW_MS)) rateBuckets.delete(key);
    }
  }

  return bucket.length > RATE_LIMIT;
}

function originAllowed(request: Request): boolean {
  const origin = request.headers.get('origin');
  if (!origin) return true;
  try {
    const originHost = new URL(origin).host;
    const requestHost = request.headers.get('host');
    return Boolean(requestHost) && originHost === requestHost;
  } catch {
    return false;
  }
}

async function persistLead(lead: Record<string, unknown>): Promise<void> {
  const dir = process.env.LEADS_DIR ?? path.resolve(process.cwd(), '.data/leads');
  await fs.mkdir(dir, { recursive: true, mode: 0o700 });
  const file = path.join(dir, `${new Date().toISOString().slice(0, 10)}.jsonl`);
  await fs.appendFile(file, `${JSON.stringify(lead)}\n`, { mode: 0o600 });
}

async function notifyWebhook(lead: Record<string, unknown>): Promise<void> {
  const url = process.env.LEADS_WEBHOOK_URL;
  if (!url) return;

  try {
    await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(process.env.LEADS_WEBHOOK_TOKEN
          ? { Authorization: `Bearer ${process.env.LEADS_WEBHOOK_TOKEN}` }
          : {}),
      },
      body: JSON.stringify({ source: 'kochevinov.ru', lead }),
      signal: AbortSignal.timeout(5_000),
    });
  } catch (error) {
    // Уведомление не должно ломать приём обращения: заявка уже сохранена локально.
    console.error('[contact] webhook failed', error instanceof Error ? error.message : error);
  }
}

export const POST: APIRoute = async ({ request, clientAddress }) => {
  if (!originAllowed(request)) {
    return jsonResponse({ ok: false, error: 'Запрос отклонён.' }, 403);
  }

  const contentType = request.headers.get('content-type') ?? '';
  if (!contentType.includes('application/json')) {
    return jsonResponse({ ok: false, error: 'Неподдерживаемый формат запроса.' }, 415);
  }

  const declaredLength = Number(request.headers.get('content-length') ?? '0');
  if (declaredLength > MAX_BODY_BYTES) {
    return jsonResponse({ ok: false, error: 'Сообщение слишком большое.' }, 413);
  }

  const ip = clientAddress || 'unknown';
  if (isRateLimited(ip)) {
    return jsonResponse(
      { ok: false, error: 'Слишком много обращений. Попробуйте позже или позвоните.' },
      429,
    );
  }

  let payload: LeadPayload;
  try {
    const raw = await request.text();
    if (raw.length > MAX_BODY_BYTES) {
      return jsonResponse({ ok: false, error: 'Сообщение слишком большое.' }, 413);
    }
    payload = JSON.parse(raw) as LeadPayload;
  } catch {
    return jsonResponse({ ok: false, error: 'Не удалось прочитать обращение.' }, 400);
  }

  // Honeypot: поле скрыто от людей, боты его заполняют.
  if (typeof payload.website === 'string' && payload.website.trim() !== '') {
    return jsonResponse({ ok: true });
  }

  const elapsed = Date.now() - Number(payload.startedAt ?? 0);
  if (!Number.isFinite(elapsed) || elapsed < MIN_FILL_MS || elapsed > MAX_FILL_MS) {
    return jsonResponse({ ok: false, error: 'Проверьте форму и попробуйте ещё раз.' }, 400);
  }

  const name = clean(payload.name, 60);
  const phone = clean(payload.phone, 30);
  const message = clean(payload.message, 600);
  const channel = ['call', 'sms', 'email'].includes(payload.channel) ? payload.channel : 'call';
  const digits = phone.replace(/\D/g, '');

  const errors: Record<string, string> = {};
  if (name.length < 2) errors.name = 'Укажите имя.';
  if (digits.length < 10 || digits.length > 15) errors.phone = 'Укажите корректный телефон.';
  if (payload.consent !== true) errors.consent = 'Необходимо согласие на обработку данных.';

  if (Object.keys(errors).length > 0) {
    return jsonResponse({ ok: false, error: 'Проверьте заполнение формы.', errors }, 422);
  }

  const lead = {
    receivedAt: new Date().toISOString(),
    name,
    phone,
    channel,
    message,
    consent: true,
    consentVersion: process.env.CONSENT_VERSION ?? '1.0',
    page: request.headers.get('referer') ?? null,
  };

  try {
    await persistLead(lead);
  } catch (error) {
    console.error('[contact] lead persist failed', error instanceof Error ? error.message : error);
    return jsonResponse(
      { ok: false, error: 'Не удалось сохранить обращение. Позвоните по телефону.' },
      500,
    );
  }

  await notifyWebhook(lead);

  return jsonResponse({ ok: true });
};

export const GET: APIRoute = () =>
  jsonResponse({ ok: false, error: 'Метод не поддерживается.' }, 405);
