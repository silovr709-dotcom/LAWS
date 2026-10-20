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
    alt: 'Записная книжка в переплёте, наручные часы и конверт с сургучной печатью на столе',
  },
  'apellyatsiya-i-kassatsiya': {
    name: 'apellyatsiya-i-kassatsiya',
    alt: 'Стопки переплетённых томов с закладками на столе под лампой',
  },
  pristavy: {
    name: 'pristavy',
    alt: 'Навесной замок с биркой на дверце шкафа и стопка папок рядом на столе',
  },
  alimenty: {
    name: 'alimenty',
    alt: 'Деревянная лошадка, вязаный плед и папка с документами у окна',
  },
  'poryadok-obshcheniya-s-rebenkom': {
    name: 'poryadok-obshcheniya-s-rebenkom',
    alt: 'Детский рисунок цветными карандашами, деревянная машинка и две чашки у окна',
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
    alt: 'Открытая папка дела с листами и разделителями, лупа и карандаш на столе',
  },
  'disciplinarnoe-vzyskanie': {
    name: 'disciplinarnoe-vzyskanie',
    alt: 'Толстый сборник документов, сложенная светлая рубашка на стуле и очки на столе',
  },
};

/** Направления работы: те же кадры, что у профильных разборов. */
export const servicePhotos: Record<string, EditorialPhoto> = {
  'dosledstvennaya-proverka': articlePhotos['dosledstvennaya-proverka'],
  'ekonomicheskie-prestupleniya': {
    name: 'ekonomicheskie-prestupleniya',
    alt: 'Стопка бланков отчётности, кожаная папка, авторучка и очки на столе',
  },
  'dolzhnostnye-prestupleniya': {
    name: 'dolzhnostnye-prestupleniya',
    alt: 'Кожаный портфель на стуле и папка с документами, перевязанная лентой, на столе',
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
    alt: 'Стопка переплетённых томов, очки и авторучка на длинном столе читального зала',
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
