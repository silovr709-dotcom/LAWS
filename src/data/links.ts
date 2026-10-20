/**
 * Перелинковка: разбор ↔ образец документа ↔ направление помощи ↔ ситуация.
 *
 * Хранится отдельно от контента, чтобы связь можно было проверить тестом:
 * каждый slug здесь должен существовать в src/data/documents.ts,
 * а каждый id — в src/content/articles.
 */

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
