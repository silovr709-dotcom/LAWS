/**
 * Единая серия иллюстраций к разборам и ситуациям.
 * Кадры постановочные, без людей, документов с читаемым текстом и символики ведомств.
 * Ключ — slug разбора; файлы лежат в /public/media/editorial/.
 */
export type EditorialPhoto = {
  name: string;
  alt: string;
};

export const articlePhotos: Record<string, EditorialPhoto> = {
  'dosledstvennaya-proverka': {
    name: 'dosledstvennaya-proverka',
    alt: 'Папка с бумагами, перевязанная лентой, лупа и авторучка на письменном столе',
  },
  'obysk-v-pomeshchenii': {
    name: 'obysk-v-pomeshchenii',
    alt: 'Приоткрытая дверь квартиры, ключи в замке и полоса утреннего света в прихожей',
  },
  'zaderzhanie-pervye-48-chasov': {
    name: 'zaderzhanie-pervye-48-chasov',
    alt: 'Часы на сложенном пальто, оставленном на стуле в пустом коридоре',
  },
  'vyzov-na-dopros': {
    name: 'vyzov-na-dopros',
    alt: 'Пустой стул и стопка листов на столе в светлой комнате',
  },
  'mera-presecheniya': {
    name: 'mera-presecheniya',
    alt: 'Пустые скамьи и деревянная балюстрада в зале суда',
  },
  'apellyatsiya-i-kassatsiya': {
    name: 'apellyatsiya-i-kassatsiya',
    alt: 'Стопки переплетённых томов с закладками на столе под лампой',
  },
  pristavy: {
    name: 'pristavy',
    alt: 'Закрытый конверт с печатью, связка ключей и записная книжка на светлом столе',
  },
  alimenty: {
    name: 'alimenty',
    alt: 'Деревянная лошадка, вязаный плед и папка с документами у окна',
  },
  'poryadok-obshcheniya-s-rebenkom': {
    name: 'poryadok-obshcheniya-s-rebenkom',
    alt: 'Пустые качели в вечернем парке',
  },
  'vozmeshchenie-vreda-posle-dtp': {
    name: 'vozmeshchenie-vreda-posle-dtp',
    alt: 'Ключи от машины, карта и кожаная папка на сиденье автомобиля',
  },
  'zhaloba-125-upk': {
    name: 'zhaloba-125-upk',
    alt: 'Конверт, штамп и бланки на письменном столе',
  },
  'oznakomlenie-s-materialami-dela': {
    name: 'oznakomlenie-s-materialami-dela',
    alt: 'Стопки томов дела под лампой в читальном зале',
  },
  'disciplinarnoe-vzyskanie': {
    name: 'disciplinarnoe-vzyskanie',
    alt: 'Кожаная папка, авторучка и сложенная форменная куртка на столе',
  },
};

/** Направления работы: те же кадры, что у профильных разборов. */
export const servicePhotos: Record<string, EditorialPhoto> = {
  'dosledstvennaya-proverka': articlePhotos['dosledstvennaya-proverka'],
  'ekonomicheskie-prestupleniya': {
    name: 'ekonomicheskie-prestupleniya',
    alt: 'Открытая конторская книга с графами, счётная машинка и авторучка на столе',
  },
  'dolzhnostnye-prestupleniya': {
    name: 'dolzhnostnye-prestupleniya',
    alt: 'Кожаный портфель на стуле и папка с бумагами на столе под лампой',
  },
  'zashchita-vrachey': {
    name: 'zashchita-vrachey',
    alt: 'Стетоскоп, стопка медицинских карт и авторучка на светлом столе',
  },
  'predstavitelstvo-poterpevshih': {
    name: 'predstavitelstvo-poterpevshih',
    alt: 'Пустое кресло в зале суда с папкой и ручкой на сиденье',
  },
};

/** Обложка раздела «Разборы». */
export const pagePhotos = {
  razbory: {
    name: 'materialy',
    alt: 'Раскрытые книги, листы бумаги и лупа на письменном столе у окна',
  },
} satisfies Record<string, EditorialPhoto>;

/** Ситуации показывают кадр разбора по той же теме. */
export const situationPhotos: Record<string, string> = {
  zaderzhali: 'zaderzhanie-pervye-48-chasov',
  obysk: 'obysk-v-pomeshchenii',
  dopros: 'vyzov-na-dopros',
  proverka: 'dosledstvennaya-proverka',
  prigovor: 'apellyatsiya-i-kassatsiya',
  dtp: 'vozmeshchenie-vreda-posle-dtp',
  pristavy: 'pristavy',
  semya: 'poryadok-obshcheniya-s-rebenkom',
};
