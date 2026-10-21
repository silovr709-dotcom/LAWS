/**
 * Перелинковка: разбор ↔ образец документа ↔ направление помощи ↔ ситуация ↔ инструмент / памятка.
 *
 * Хранится отдельно от контента, чтобы связь можно было проверить тестом:
 * каждый slug здесь должен существовать в соответствующих данных или контенте.
 */

export type LinkedTool = {
  title: string;
  note: string;
  href: string;
};

/** Разбор → образцы, которые к нему логично приложить. */
export const articleDocuments: Record<string, string[]> = {
  'zaderzhanie-pervye-48-chasov': ['hodataystvo-o-dopuske-zashchitnika', 'zhaloba-na-deystviya-politsii'],
  'obysk-v-pomeshchenii': ['zhaloba-125-upk', 'zhaloba-na-deystviya-politsii'],
  'mera-presecheniya': ['hodataystvo-ob-otlozhenii-zasedaniya', 'zhaloba-125-upk'],
  'vyzov-na-dopros': ['hodataystvo-o-dopuske-zashchitnika', 'hodataystvo-o-vyzove-svideteley'],
  'dosledstvennaya-proverka': ['hodataystvo-ob-oznakomlenii-s-materialami-proverki', 'zayavlenie-o-prestuplenii'],
  'zhaloba-125-upk': ['zhaloba-125-upk', 'zhaloba-na-deystviya-politsii'],
  'oznakomlenie-s-materialami-dela': ['hodataystvo-ob-oznakomlenii-s-protokolom', 'hodataystvo-ob-istrebovanii-dokazatelstv'],
  'apellyatsiya-i-kassatsiya': ['apellyatsionnaya-zhaloba-na-prigovor', 'zayavlenie-o-peresmotre-po-novym-obstoyatelstvam'],
  'alimenty': ['isk-o-vzyskanii-alimentov', 'zayavlenie-ob-obespechenii-iska'],
  'poryadok-obshcheniya-s-rebenkom': ['isk-ob-opredelenii-poryadka-obshcheniya-s-rebenkom', 'isk-o-rastorzhenii-braka'],
  'vozmeshchenie-vreda-posle-dtp': ['isk-o-vozmeshchenii-vreda-dtp', 'isk-o-vozmeshchenii-vreda-zdorovyu'],
  'pristavy': ['zhaloba-na-postanovlenie-pristava', 'zayavlenie-o-vosstanovlenii-sroka'],
  'disciplinarnoe-vzyskanie': ['vozrazheniya-po-isku', 'zayavlenie-o-vosstanovlenii-sroka'],
};

/** Направление → образцы, которые чаще всего нужны в этой работе. */
export const serviceDocuments: Record<string, string[]> = {
  'dosledstvennaya-proverka': [
    'hodataystvo-ob-oznakomlenii-s-materialami-proverki',
    'zhaloba-na-deystviya-politsii',
    'zhaloba-125-upk',
  ],
  'ekonomicheskie-prestupleniya': ['zhaloba-125-upk', 'hodataystvo-ob-istrebovanii-dokazatelstv'],
  'dolzhnostnye-prestupleniya': ['hodataystvo-o-dopuske-zashchitnika', 'zhaloba-125-upk'],
  'zashchita-vrachey': ['hodataystvo-o-naznachenii-ekspertizy', 'hodataystvo-ob-istrebovanii-dokazatelstv'],
  'predstavitelstvo-poterpevshih': ['zayavlenie-o-prestuplenii', 'isk-o-vozmeshchenii-vreda-zdorovyu'],
  'apellyatsiya-i-kassatsiya': ['apellyatsionnaya-zhaloba-na-prigovor', 'zayavlenie-o-peresmotre-po-novym-obstoyatelstvam'],
};

/** Ситуация навигатора → slug ситуации, связанной с разбором. */
export const articleSituations: Record<string, string[]> = {
  'zaderzhanie-pervye-48-chasov': ['zaderzhali'],
  'obysk-v-pomeshchenii': ['obysk'],
  'vyzov-na-dopros': ['dopros'],
  'dosledstvennaya-proverka': ['proverka'],
  'apellyatsiya-i-kassatsiya': ['prigovor'],
  'vozmeshchenie-vreda-posle-dtp': ['dtp'],
  'pristavy': ['pristavy'],
  'alimenty': ['semya'],
  'poryadok-obshcheniya-s-rebenkom': ['semya'],
  'mera-presecheniya': ['zaderzhali'],
};

/** Разбор → памятки на одну страницу (slug в src/data/memos.ts). */
export const articleMemos: Record<string, string[]> = {
  'zaderzhanie-pervye-48-chasov': ['pervye-48-chasov'],
  'mera-presecheniya': ['pervye-48-chasov'],
  'obysk-v-pomeshchenii': ['obysk'],
  'vyzov-na-dopros': ['dopros'],
};

/** Ситуация → памятки на одну страницу (slug в src/data/memos.ts). */
export const situationMemos: Record<string, string[]> = {
  zaderzhali: ['pervye-48-chasov'],
  obysk: ['obysk'],
  dopros: ['dopros'],
};

/** Разбор → прикладные инструменты для расчёта сроков и проверки текста. */
export const articleTools: Record<string, LinkedTool[]> = {
  'zaderzhanie-pervye-48-chasov': [
    { title: 'Счётчик 48 часов', note: 'Пять контрольных точек после фактического задержания', href: '/48-chasov/' },
    { title: 'Если задержали близкого', note: 'Что выяснить и как передать сведения адвокату', href: '/pomoshch-blizkomu/' },
  ],
  'mera-presecheniya': [
    { title: 'Счётчик 48 часов', note: 'Отсчёт срока до избрания меры пресечения и продления на 72 часа', href: '/48-chasov/' },
    { title: 'Калькуляторы сроков', note: 'Срок апелляционного обжалования постановления суда', href: '/sroki/#apellyatsiya' },
  ],
  'obysk-v-pomeshchenii': [
    { title: 'Проверка черновика жалобы', note: 'Проверить реквизиты жалобы в порядке ст. 125 УПК РФ', href: '/proverka-zayavleniya/' },
    { title: 'Безопасная передача копий', note: 'Как передать копию протокола обыска адвокату', href: '/bezopasnaya-peredacha-dokumentov/' },
  ],
  'vyzov-na-dopros': [
    { title: 'Первое сообщение адвокату', note: 'Собрать текст обращения по повестке без лишних данных', href: '/bezopasnaya-peredacha-dokumentov/#pervoe-soobshchenie' },
    { title: 'Проверка черновика ходатайства', note: 'Проверить реквизиты ходатайства до подачи', href: '/proverka-zayavleniya/' },
  ],
  'dosledstvennaya-proverka': [
    { title: 'Калькулятор сроков ст. 144 УПК РФ', note: 'Расчёт 3, 10 и 30 суток со дня регистрации заявления', href: '/sroki/#proverka' },
    { title: 'Проверка черновика', note: 'Проверить заявление или жалобу перед подачей', href: '/proverka-zayavleniya/' },
  ],
  'zhaloba-125-upk': [
    { title: 'Проверка черновика жалобы', note: 'Проверить адресата, нормы права, просительную часть и приложения', href: '/proverka-zayavleniya/' },
    { title: 'Калькуляторы сроков', note: 'Контрольные процессуальные сроки по УПК РФ', href: '/sroki/' },
  ],
  'oznakomlenie-s-materialami-dela': [
    { title: 'Проверка черновика ходатайства', note: 'Проверить текст ходатайства перед подачей следователю или в суд', href: '/proverka-zayavleniya/' },
    { title: 'Калькуляторы сроков', note: 'Сроки подачи замечаний и обжалования', href: '/sroki/' },
  ],
  'apellyatsiya-i-kassatsiya': [
    { title: 'Калькулятор 10 суток на апелляцию', note: 'С учётом выходных и вручения копии под стражей', href: '/sroki/#apellyatsiya' },
    { title: 'Проверка черновика жалобы', note: 'Формальная проверка апелляционной жалобы до подачи', href: '/proverka-zayavleniya/' },
  ],
  alimenty: [
    { title: 'Калькулятор алиментов в долях', note: 'Расчёт по ст. 81 СК РФ и удержаний из дохода', href: '/sroki/#alimenty' },
    { title: 'Проверка черновика иска', note: 'Проверить реквизиты искового заявления', href: '/proverka-zayavleniya/' },
  ],
  'poryadok-obshcheniya-s-rebenkom': [
    { title: 'Проверка черновика иска', note: 'Проверить реквизиты заявления, приложения и подпись', href: '/proverka-zayavleniya/' },
    { title: 'Безопасная передача документов', note: 'Как подготовить список документов без пересылки лишнего', href: '/bezopasnaya-peredacha-dokumentov/' },
  ],
  'vozmeshchenie-vreda-posle-dtp': [
    { title: 'Проверка черновика иска', note: 'Проверить структуру иска и перечень приложений', href: '/proverka-zayavleniya/' },
    { title: 'Калькуляторы сроков', note: 'Процессуальные сроки обжалования и исполнения', href: '/sroki/' },
  ],
  pristavy: [
    { title: 'Срок жалобы приставу и удержания', note: '10 рабочих дней на жалобу и предел списаний из зарплаты', href: '/sroki/#pristavy' },
    { title: 'Проверка черновика жалобы', note: 'Проверить реквизиты жалобы старшему судебному приставу', href: '/proverka-zayavleniya/' },
  ],
  'disciplinarnoe-vzyskanie': [
    { title: 'Проверка черновика возражений', note: 'Проверить структуру документа перед подачей', href: '/proverka-zayavleniya/' },
    { title: 'Калькуляторы сроков', note: 'Перенос процессуального срока с выходного дня', href: '/sroki/' },
  ],
};

/** Ситуация → прикладные инструменты для конкретной жизненной ситуации. */
export const situationTools: Record<string, LinkedTool[]> = {
  zaderzhali: [
    { title: 'Счётчик 48 часов', note: 'Живой отсчёт пяти контрольных сроков после задержания', href: '/48-chasov/' },
    { title: 'Если задержали близкого', note: 'Что уточнить родственникам и как написать адвокату', href: '/pomoshch-blizkomu/' },
  ],
  obysk: [
    { title: 'Проверка черновика жалобы', note: 'Проверить жалобу в порядке ст. 125 УПК РФ на действия при обыске', href: '/proverka-zayavleniya/' },
    { title: 'Если помощь нужна близкому', note: 'Порядок действий семьи при следственных действиях', href: '/pomoshch-blizkomu/' },
  ],
  dopros: [
    { title: 'Собрать первое сообщение', note: 'Описать вызов на допрос и дату без пересылки повестки', href: '/bezopasnaya-peredacha-dokumentov/#pervoe-soobshchenie' },
    { title: 'Проверка черновика ходатайства', note: 'Проверить ходатайство до визита к следователю', href: '/proverka-zayavleniya/' },
  ],
  proverka: [
    { title: 'Калькулятор сроков ст. 144 УПК РФ', note: '3, 10 и 30 суток со дня регистрации сообщения', href: '/sroki/#proverka' },
    { title: 'Проверка черновика заявления', note: 'Проверить текст заявления или объяснений', href: '/proverka-zayavleniya/' },
  ],
  prigovor: [
    { title: 'Калькулятор 10 суток на апелляцию', note: 'Точная дата окончания срока с учётом выходных и стражи', href: '/sroki/#apellyatsiya' },
    { title: 'Проверка апелляционной жалобы', note: 'Проверить формальные реквизиты черновика', href: '/proverka-zayavleniya/' },
  ],
  dtp: [
    { title: 'Проверка черновика заявления или иска', note: 'Проверить реквизиты и приложения до подачи', href: '/proverka-zayavleniya/' },
    { title: 'Калькуляторы сроков', note: 'Сроки проверки, апелляции и исполнительного производства', href: '/sroki/' },
  ],
  pristavy: [
    { title: 'Калькулятор жалобы приставу и удержаний', note: '10 рабочих дней на жалобу и доля удержаний из дохода', href: '/sroki/#pristavy' },
    { title: 'Проверка черновика жалобы', note: 'Проверить реквизиты жалобы в ФССП', href: '/proverka-zayavleniya/' },
  ],
  semya: [
    { title: 'Калькулятор алиментов по ст. 81 СК РФ', note: 'Доля дохода на 1, 2 или 3 и более детей', href: '/sroki/#alimenty' },
    { title: 'Проверка черновика иска', note: 'Проверить структуру искового заявления и приложения', href: '/proverka-zayavleniya/' },
  ],
};
