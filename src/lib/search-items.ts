import { getCollection } from 'astro:content';
import { documents } from '../data/documents';
import { services } from '../data/services';
import { situations } from '../data/situations';
import { memos } from '../data/memos';
import { withBase } from './paths';

export type SearchEntry = {
  title: string;
  description: string;
  url: string;
  type: 'Разбор' | 'Образец' | 'Направление' | 'Ситуация' | 'Памятка' | 'Инструмент' | 'Страница';
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
    title: 'Инструменты и памятки: сроки, 48 часов, проверка черновика',
    description: 'Все интерактивные расчёты, проверка документа и памятки без передачи данных на сервер.',
    url: '/instrumenty/',
    type: 'Инструмент',
    text: 'инструменты онлайн калькуляторы счётчик 48 часов проверка черновика первое сообщение памятки pdf',
  },
  {
    title: 'Счётчик 48 часов после задержания',
    description: 'Живой отсчёт сроков: 3, 12, 24, 48 и 72 часа.',
    url: '/48-chasov/',
    type: 'Инструмент',
    text: 'таймер счётчик отсчёт задержание 48 часов 3 часа 12 часов 24 часа 72 часа освобождение протокол допрос прокурор уведомление родственников сроки',
  },
  {
    title: 'Проверка черновика заявления или жалобы',
    description: 'Формальные признаки документа: адресат, нормы, просьба, приложения.',
    url: '/proverka-zayavleniya/',
    type: 'Инструмент',
    text: 'проверка черновик заявление жалоба ходатайство документ адресат просительная часть приложения подпись оформление ошибки',
  },
  {
    title: 'Калькуляторы процессуальных сроков',
    description: '48 часов, апелляция, проверка, приставы, удержания, алименты.',
    url: '/sroki/',
    type: 'Инструмент',
    text: 'сроки калькулятор апелляция 10 суток проверка 3 10 30 приставы удержания алименты',
  },
  {
    title: 'Задержали. Что делать в первые часы',
    description: 'Три действия, формулировки и срок 48 часов.',
    url: '/srochno/',
    type: 'Страница',
    text: 'задержание обыск допрос 48 часов защитник протокол срочно',
  },
  {
    title: 'Если помощь нужна близкому человеку',
    description: 'Что выяснить родственникам при задержании или обыске и как связаться с адвокатом.',
    url: '/pomoshch-blizkomu/',
    type: 'Страница',
    text: 'помощь близкому родственнику мужу сыну жене задержали куда доставили соглашение в интересах другого лица',
  },
  {
    title: 'Навигатор по жизненным ситуациям',
    description: 'Восемь пошаговых сценариев: задержание, обыск, допрос, проверка, приговор, ДТП, приставы, семья.',
    url: '/situacii/',
    type: 'Страница',
    text: 'ситуации навигатор что делать задержали обыск допрос проверка приговор дтп приставы',
  },
  {
    title: 'Памятки: 48 часов, обыск, допрос',
    description: 'Короткие одностраничные памятки для печати и скачивания в PDF.',
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
    title: 'Как мы работаем и из чего складывается стоимость',
    description: 'Этапы работы и факторы стоимости без прайс-листа.',
    url: '/kak-my-rabotaem/',
    type: 'Страница',
    text: 'стоимость оплата соглашение этапы работа гонорар консультация',
  },
  {
    title: 'Как безопасно передать документы и собрать первое сообщение',
    description: 'Что писать в первом обращении, конструктор сообщения и правила передачи копий.',
    url: '/bezopasnaya-peredacha-dokumentov/',
    type: 'Инструмент',
    text: 'документы передача безопасность паспорт сканы мессенджер конфиденциальность конструктор первого сообщения',
  },
  {
    title: 'Материалы: разборы, образцы и памятки',
    description: 'Все разборы ситуаций, шаблоны процессуальных документов и памятки.',
    url: '/materialy/',
    type: 'Страница',
    text: 'материалы разборы образцы документы заявления жалобы иски ходатайства',
  },
  {
    title: 'Практика и результаты',
    description: 'Дела по открытым данным и отзывы доверителей.',
    url: '/praktika/',
    type: 'Страница',
    text: 'практика дела результаты суд приговор постановление отзывы',
  },
  {
    title: 'Об адвокате',
    description: 'Биография, опыт, принципы работы и география поручений.',
    url: '/ob-advokate/',
    type: 'Страница',
    text: 'кочевинов адвокат биография прокуратура опыт тверь мурманск',
  },
];

export async function getSearchEntries(): Promise<SearchEntry[]> {
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
        ...document.blocks.map((block) =>
          'h' in block ? block.h : 'p' in block ? block.p : 'ul' in block ? block.ul.join(' ') : block.note,
        ),
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

  return entries.map((entry) => ({
    ...entry,
    text: plain(entry.text).slice(0, 4000),
    url: withBase(entry.url),
  }));
}
