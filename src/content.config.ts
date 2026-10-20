import { defineCollection } from 'astro:content';
import { z } from 'astro/zod';
import { glob } from 'astro/loaders';

/**
 * Публикации. Добавление: создайте .md файл в src/content/articles.
 * Дата в frontmatter — ISO (YYYY-MM-DD).
 */
const articles = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/articles' }),
  schema: z.object({
    title: z.string().max(120),
    description: z.string().max(300),
    publishedAt: z.coerce.date(),
    updatedAt: z.coerce.date().optional(),
    category: z.string(),
    readingTime: z.string(),
    sources: z
      .array(
        z.object({
          label: z.string(),
          url: z.url(),
        }),
      )
      .default([]),
    draft: z.boolean().default(false),
  }),
});

/**
 * Судебная практика. По умолчанию коллекция пуста — и это отображается честно.
 *
 * Перед публикацией каждого дела:
 *  1) подтвердите участие адвоката (не только совпадение фамилии);
 *  2) проверьте допустимость публикации (адвокатская тайна, данные участников);
 *  3) обезличьте текст и укажите основание публикации.
 * Подробнее: docs/PRACTICE-PUBLISHING.md
 */
const cases = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/cases' }),
  schema: z.object({
    title: z.string().max(140),
    category: z.string(),
    court: z.string(),
    instance: z.enum(['первая инстанция', 'апелляция', 'кассация']),
    year: z.number().int().min(2000).max(2100),
    role: z.enum(['защитник', 'представитель потерпевшего', 'представитель']),
    result: z.enum([
      'оправдание',
      'прекращение дела',
      'переквалификация',
      'смягчение наказания',
      'судебный акт оставлен без изменения',
      'судебный акт отменён',
      'иное',
    ]),
    summary: z.string().max(400),
    legalIssue: z.string().max(600),
    actions: z.array(z.string()).default([]),
    outcome: z.string().max(600),
    sourceUrl: z.url().optional(),
    sourceLabel: z.string().optional(),
    publicationBasis: z.string(),
    /**
     * Как подтверждено участие адвоката:
     *  - 'document' — есть процессуальный документ (ордер, протокол, судебный акт);
     *  - 'open-source' — сведения взяты из открытого отзыва доверителя или публикации
     *    адвоката. В интерфейсе такое дело помечается явно.
     */
    verification: z.enum(['document', 'open-source']).default('open-source'),
    anonymized: z.literal(true),
    publishedAt: z.coerce.date(),
    draft: z.boolean().default(true),
  }),
});

export const collections = { articles, cases };
