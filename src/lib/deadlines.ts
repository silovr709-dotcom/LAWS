/**
 * Расчёт процессуальных сроков для страницы «Сроки».
 *
 * Функции чистые: никаких обращений к сети, времени или часовому поясу браузера.
 * Все даты считаются в локальном времени и возвращаются как новые объекты Date.
 *
 * ВАЖНО: это ориентир, а не юридическое заключение. Срок может исчисляться
 * с иного момента (например, со дня вручения копии акта) и переноситься,
 * если последний день — нерабочий.
 */

export function addHours(date: Date, hours: number): Date {
  return new Date(date.getTime() + hours * 60 * 60 * 1000);
}

export function addDays(date: Date, days: number): Date {
  const next = new Date(date.getTime());
  next.setDate(next.getDate() + days);
  return next;
}

export function isWorkingDay(date: Date): boolean {
  const day = date.getDay();
  return day !== 0 && day !== 6;
}

/** Если последний день срока — выходной, срок переносится на следующий рабочий день. */
export function shiftToWorkingDay(date: Date): { date: Date; shifted: boolean } {
  let next = new Date(date.getTime());
  let shifted = false;
  while (!isWorkingDay(next)) {
    next = addDays(next, 1);
    shifted = true;
  }
  return { date: next, shifted };
}

/** Задержание: 48 часов с момента фактического задержания (ст. 94 УПК РФ). */
export function detentionDeadline(start: Date): {
  release: Date;
  court: Date;
} {
  const release = addHours(start, 48);
  return { release, court: release };
}

/**
 * Апелляция на приговор: 10 суток со дня провозглашения, а для осуждённого,
 * содержащегося под стражей, — со дня вручения копии приговора (ст. 389.4 УПК РФ).
 */
export function appealDeadline(
  pronounced: Date,
  options: { inCustody?: boolean; copyServed?: Date | null } = {},
): { date: Date; shifted: boolean; basis: string } {
  const start = options.inCustody && options.copyServed ? options.copyServed : pronounced;
  const raw = addDays(start, 10);
  const { date, shifted } = shiftToWorkingDay(raw);
  return {
    date,
    shifted,
    basis: options.inCustody && options.copyServed ? 'со дня вручения копии приговора' : 'со дня провозглашения приговора',
  };
}

/**
 * Доследственная проверка: 3 суток со дня регистрации сообщения, продление
 * руководителем следственного органа до 10 суток, в исключительных случаях — до 30
 * (ч. 1 и ч. 3 ст. 144 УПК РФ).
 */
export function checkupDeadline(
  registered: Date,
  extension: 3 | 10 | 30 = 3,
): { date: Date; shifted: boolean } {
  return shiftToWorkingDay(addDays(registered, extension));
}

/** Жалоба на постановление пристава: 10 дней со дня, когда стало известно о нарушении. */
export function bailiffAppealDeadline(learned: Date): { date: Date; shifted: boolean } {
  return shiftToWorkingDay(addDays(learned, 10));
}

/** Доли дохода на алименты по ст. 81 СК РФ. */
export function alimonyShare(children: number): number {
  if (children <= 0) return 0;
  if (children === 1) return 1 / 4;
  if (children === 2) return 1 / 3;
  return 1 / 2;
}

export function alimonyAmount(monthlyIncome: number, children: number): number {
  if (!Number.isFinite(monthlyIncome) || monthlyIncome <= 0) return 0;
  return Math.round(monthlyIncome * alimonyShare(children));
}

/**
 * Шкала контрольных точек после задержания.
 *
 * Часы считаются от момента фактического задержания. Исключение — протокол
 * задержания и один телефонный разговор: три часа на них считаются с момента
 * доставления (ч. 1 ст. 92, ч. 1 ст. 96 УПК РФ), а доставление может быть позже.
 * Поэтому отметка «3 ч» здесь — ориентир от задержания, а не точный срок.
 */
export const DETENTION_HOURS = [3, 12, 24, 48, 72] as const;

export type DetentionMilestone = {
  hours: number;
  /** Момент, когда срок истекает. */
  at: Date;
  /** Сколько осталось до истечения; отрицательное значение — срок прошёл. */
  remaining: number;
  passed: boolean;
  /** Ближайшая точка впереди. После 48 часов не отмечается: продление — только по решению суда. */
  next: boolean;
};

export type DetentionTimeline = {
  release: Date;
  /** Прошло с момента задержания. */
  elapsed: number;
  /** Осталось до 48 часов; отрицательное значение — срок истёк. */
  remaining: number;
  expired: boolean;
  milestones: DetentionMilestone[];
};

export function detentionTimeline(start: Date, now: Date): DetentionTimeline {
  const release = addHours(start, 48);
  const elapsed = now.getTime() - start.getTime();
  const remaining = release.getTime() - now.getTime();
  const expired = remaining <= 0;
  let marked = false;
  const milestones = DETENTION_HOURS.map((hours) => {
    const at = addHours(start, hours);
    const left = at.getTime() - now.getTime();
    const next = !expired && left > 0 && !marked;
    if (next) marked = true;
    return { hours, at, remaining: left, passed: left <= 0, next };
  });
  return { release, elapsed, remaining, expired, milestones };
}
