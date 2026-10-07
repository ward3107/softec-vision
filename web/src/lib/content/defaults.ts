import en from '../../../messages/en.json';
import he from '../../../messages/he.json';
import { CONTENT_BLOCKS, type ContentBlockData, type ContentBlockKey } from './blocks';

export const BLOCK_TITLES: Record<ContentBlockKey, string> = {
  'home.hero': 'פתיחת העמוד', 'home.capabilities': 'יכולות', 'home.families': 'משפחות מוצרים',
  'home.process': 'תהליך העבודה', 'home.custom': 'ייצור בהתאמה אישית', 'home.about': 'למה Softec Vision',
  'home.faq': 'שאלות נפוצות', 'home.contact': 'יצירת קשר'
};

function defaults(messages: typeof he | typeof en, key: ContentBlockKey): ContentBlockData {
  const sources = {
    'home.hero': { ...messages.hero, image: '/products/RAV-500-transparent.webp', imageAlt: `${messages.hero.model} (RAV-500)`,
      proof1: messages.hero.proof[0], proof2: messages.hero.proof[1], proof3: messages.hero.proof[2] },
    'home.capabilities': messages.capabilities, 'home.families': messages.catalog, 'home.process': messages.process,
    'home.custom': messages.custom, 'home.about': messages.about, 'home.faq': messages.faq, 'home.contact': messages.contact
  };
  const source = sources[key] as unknown as Record<string, unknown>;
  return Object.fromEntries(CONTENT_BLOCKS[key].map(field => [field, typeof source[field] === 'string' ? source[field] : '']));
}

export const SHIPPED_TEXT = Object.fromEntries(Object.keys(CONTENT_BLOCKS).map(key => [key, {
  he: defaults(he, key as ContentBlockKey), en: defaults(en, key as ContentBlockKey)
}])) as Record<ContentBlockKey, { he: ContentBlockData; en: ContentBlockData }>;

export function fieldLabel(field: string): string {
  const names: Record<string, string> = {
    eyebrow: 'כותרת משנה', title: 'כותרת', body: 'תיאור', image: 'תמונה ראשית', imageAlt: 'תיאור התמונה',
    delivery: 'שורת שירות', explore: 'כפתור מוצרים', action: 'כפתור יצירת קשר', custom: 'ייצור אישי',
    customSub: 'תיאור ייצור אישי', av: 'אינטגרציית AV', avSub: 'תיאור AV', accessible: 'נגישות',
    accessibleSub: 'תיאור נגישות', whyTitle: 'כותרת', deliveryTitle: 'כותרת משלוח', deliveryBody: 'תיאור משלוח'
  };
  if (names[field]) return names[field];
  if (/^q\d+$/.test(field)) return `שאלה ${field.slice(1)}`;
  if (/^a\d+$/.test(field)) return `תשובה ${field.slice(1)}`;
  if (/^s\dt$/.test(field)) return `שלב ${field[1]} - כותרת`;
  if (/^s\db$/.test(field)) return `שלב ${field[1]} - תיאור`;
  if (/^why\d+$/.test(field)) return `יתרון ${field.slice(3)}`;
  if (/^proof\d+$/.test(field)) return `נקודת חוזק ${field.slice(5)}`;
  return field;
}
