import type { APIRoute } from 'astro';
import { getCollection } from 'astro:content';
import { documents } from '../data/documents';
import { services } from '../data/services';
import { situations } from '../data/situations';
import { memos } from '../data/memos';
import { withBase } from '../lib/paths';

export type SearchEntry = {
  title: string;
  description: string;
  url: string;
  type: 'Разбор' | 'Образец' | 'Направление' | 'Ситуация' | 'Памятка' | 'Страница';
  text: string;
};

/** Убирает markdown-разметку, чтобы искать по смыслу, а не по символам. */
const plain = (value: string) =>
  value
    .replace(/```[\s\S]*?```/g, ' ')
    .replace(/!\[[^\]]*\]\([^)]*\)/g, ' ')
    .replace(/\[([^\]]+)\]\([^)]*\)/g, '$1')
    .replace(/^#{1,6}\s+/gm, '')
    .replace(/[*_`>]/g, '')
    .replace(/\s+/g, ' ')
    .trim();

const staticPages: SearchEntry[] = [
  {
    title: 'Задержали. Что делать в первые часы',
    description: 'Три действия, формулировки и срок 48 часов.',
    url: '/srochno/',
    type: 'Страница',
    text: 'задержание обыск допрос 48 часов защитник протокол срочно',
  },
  {
    title: 'Калькуляторы процессуальных сроков',
    description: '48 часов, апелляция, проверка, приставы, алименты.',
    url: '/sroki/',
    type: 'Страница',
    text: 'сроки калькулятор апелляция 10 суток проверка 3 10 30 приставы удержания алименты',
  },
  {
    title: 'Памятки: 48 часов, обыск, допрос',
    description: 'Короткие памятки для печати и PDF.',
    url: '/memos/',
    type: 'Страница',
    text: 'памятка pdf распечатать задержание обыск допрос',
  },
  {
    title: 'Как проверить, что перед вами адвокат',
    description: 'Реестр палаты, удостоверение, ордер, соглашение, квитанция.',
    url: '/kak-proverit-advokata/',
    type: 'Страница',
    text: 'реестр адвокатов палата удостоверение ордер соглашение реестровый номер 51/862',
  },
  {
    title: 'Как мы работаем и сколько это стоит',
    description: 'Этапы работы и факторы стоимости без прайса.',
    url: '/kak-my-rabotaem/',
    type: 'Страница',
    text: 'стоимость оплата соглашение этапы работа гонорар консультация',
  },
  {
    title: 'Как безопасно передать документы',
    description: 'Что можно писать в первом сообщении и как передать копии.',
    url: '/bezopasnaya-peredacha-dokumentov/',
    type: 'Страница',
    text: 'документы передача безопасность паспорт сканы мессенджер конфиденциальность',
  },
  {
    title: 'Материалы: разборы и образцы',
    description: 'Все разборы ситуаций и шаблоны документов.',
    url: '/materialy/',
    type: 'Страница',
    text: 'материалы разборы образцы документы заявления жалобы иски ходатайства',
  },
  {
    title: 'Практика и результаты',
    description: 'Дела по открытым данным.',
    url: '/praktika/',
    type: 'Страница',
    text: 'практика дела результаты суд приговор постановление',
  },
  {
    title: 'Об адвокате',
    description: 'Биография, опыт, принципы работы.',
    url: '/ob-advokate/',
    type: 'Страница',
    text: 'кочевинов адвокат биография прокуратура опыт тверь мурманск',
  },
];

export const GET: APIRoute = async () => {
  const articles = await getCollection('articles', ({ data }) => !data.draft);

  const entries: SearchEntry[] = [
    ...articles.map((article) => ({
      title: article.data.title,
      description: article.data.description,
      url: `/materialy/razbory/${article.id}/`,
      type: 'Разбор' as const,
      text: plain(article.body ?? '') + ' ' + article.data.category,
    })),
    ...documents.map((document) => ({
      title: document.title,
      description: document.summary,
      url: `/materialy/obrazcy/${document.slug}/`,
      type: 'Образец' as const,
      text: [
        document.short,
        document.group,
        document.basis,
        document.addressee,
        document.deadline,
        ...document.blocks.map((block) => ('h' in block ? block.h : 'p' in block ? block.p : 'ul' in block ? block.ul.join(' ') : block.note)),
      ].join(' '),
    })),
    ...services.map((service) => ({
      title: service.title,
      description: service.lead,
      url: `/napravleniya/${service.slug}/`,
      type: 'Направление' as const,
      text: [service.focus, ...service.scenarios, ...service.work.map((item) => `${item.title} ${item.text}`)].join(' '),
    })),
    ...situations.map((situation) => ({
      title: situation.title,
      description: situation.lead,
      url: `/situacii/${situation.slug}/`,
      type: 'Ситуация' as const,
      text: [situation.urgency, ...situation.steps, ...situation.rights, ...situation.avoid].join(' '),
    })),
    ...memos.map((memo) => ({
      title: memo.title,
      description: memo.subtitle,
      url: `/memos/${memo.slug}/`,
      type: 'Памятка' as const,
      text: [memo.intro, ...memo.sections.flatMap((section) => [section.title, ...section.items])].join(' '),
    })),
    ...staticPages,
  ];

  const payload = entries.map((entry) => ({
    ...entry,
    text: plain(entry.text).slice(0, 4000),
    url: withBase(entry.url),
  }));

  return new Response(JSON.stringify({ generatedAt: new Date().toISOString().slice(0, 10), items: payload }), {
    headers: {
      'Content-Type': 'application/json; charset=utf-8',
      'Cache-Control': 'public, max-age=3600',
    },
  });
};
