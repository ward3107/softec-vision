import type { Category, Localized, Product, SpecEntry } from './types';

/** WhatsApp number in international format, no + or dashes. */
export const WA_NUMBER = '972544742520';

export const CATEGORIES: Category[] = [
  {
    key: 'podium',
    label: { he: 'עמדות מרצה – פודיום', en: 'Lecturer Stations — Podiums' },
    description: {
      he: 'עמדות הוראה המשלבות משטח עבודה, תצוגה, בקרה וניהול כבלים.',
      en: 'Teaching stations integrating work surfaces, displays, controls and cable management.'
    },
    visibleIn: ['he', 'en'],
    subs: [
      { key: 'no-tech', label: { he: 'עמדות מרצה ללא טכנולוגיה', en: 'Non-Technology Lecturer Stations' } },
      { key: 'smart', label: { he: 'עמדות מרצה חכמות', en: 'Smart Lecturer Stations' } },
      { key: 'double', label: { he: 'עמדות מרצה כפולות', en: 'Dual Lecturer Stations' } },
      { key: 'audience-screen', label: { he: 'עמדות מרצה כולל מסך לכיוון הקהל', en: 'Lecturer Stations with Audience-Facing Display' } },
      { key: 'accessible', label: { he: 'עמדות מרצה נגישות', en: 'Accessible Lecturer Stations' } },
      { key: 'tables', label: { he: 'שולחנות מרצה', en: 'Lecturer Desks' } }
    ]
  },
  {
    key: 'info-display',
    label: { he: 'עמדות מידע ותצוגה', en: 'Information and Display Stations' },
    description: {
      he: 'עמדות אינטראקטיביות לתצוגה, הכוונה וקבלת מידע.',
      en: 'Interactive stations for display, wayfinding and information access.'
    },
    visibleIn: ['he', 'en']
  },
  {
    key: 'control',
    label: { he: 'שולחנות בקרה ושליטה', en: 'Control and Command Desks' },
    description: {
      he: 'סביבות עבודה מרובות מסכים לחדרי בקרה ותפעול.',
      en: 'Multi-display work environments for control and operations rooms.'
    },
    visibleIn: ['he', 'en'],
    subs: [
      { key: 'control-desks', label: { he: 'שולחנות בקרה', en: 'Control Desks' } },
      { key: 'operator', label: { he: 'עמדות מפעיל', en: 'Operator Stations' } }
    ]
  },
  {
    key: 'charging-carts',
    label: { he: 'עגלות טעינה למחשבים', en: 'Computer Charging Carts' },
    description: {
      he: 'אחסון, טעינה ושינוע מאובטח של מחשבים ניידים.',
      en: 'Secure storage, charging and transport for laptop computers.'
    },
    visibleIn: ['en']
  },
  {
    key: 'service-carts',
    label: { he: 'עגלות מחשוב ושירות', en: 'Computing and Service Carts' },
    description: {
      he: 'עגלות ניידות לציוד מחשוב, שירות ותפעול.',
      en: 'Mobile carts for computing, service and operational equipment.'
    },
    visibleIn: ['he', 'en']
  },
  {
    key: 'custom',
    label: { he: 'תכנון וייצור פתרונות בהתאמה אישית', en: 'Custom Solution Design and Manufacturing' },
    description: {
      he: 'פתרונות מתוכננים לפי המרחב, הציוד ואופן העבודה.',
      en: 'Solutions engineered around the space, equipment and working method.'
    },
    visibleIn: ['he', 'en']
  }
];

const SPEC_LABELS: Record<string, Localized> = {
  displays: { he: 'מסכים', en: 'Displays' },
  finish: { he: 'גימור', en: 'Finish' },
  dimensions: { he: 'מידות (ג×ר×ע)', en: 'Dimensions (H×W×D)' },
  weight: { he: 'משקל', en: 'Weight' },
  power: { he: 'חשמל', en: 'Power' },
  cable: { he: 'ניהול כבלים', en: 'Cable management' },
  mobility: { he: 'ניידות', en: 'Mobility' },
  cableAccess: { he: 'גישה לחיווט', en: 'Cable access' },
  security: { he: 'אבטחה', en: 'Security' },
  accessibility: { he: 'נגישות', en: 'Accessibility' }
};

const PH: Localized = { he: '[למילוי]', en: '[To be completed]' };
const s = (key: string, he: string, en: string): SpecEntry => ({ key, label: SPEC_LABELS[key], value: { he, en } });
const ph = (key: string): SpecEntry => ({ key, label: SPEC_LABELS[key], value: PH });

export const PRODUCTS: Product[] = [
  {
    code: 'LS-1000LPT',
    cat: 'podium',
    sub: 'smart',
    name: { he: 'עמדת מרצה קומפקטית', en: 'Compact Lecturer Station' },
    desc: {
      he: 'עמדת מרצה בגוף לבן סגור, עם זרוע מסך מתכוונן על משטח העבודה וניהול כבלים פנימי מלא. מתאימה לכיתות ולחללי הרצאה קטנים-בינוניים.',
      en: 'An enclosed white lecturer station with an adjustable monitor arm, a clear work surface and fully internal cable management. Suited to small and medium classrooms and lecture spaces.'
    },
    image: '/products/LS-1000LPT.jpg',
    specs: [
      s('displays', 'מסך מגע ראשי + מסך קדמי', 'Main touch display + front display'),
      s('finish', 'פח צבוע בתנור', 'Powder-coated steel'),
      ph('dimensions'), ph('weight'), ph('power'),
      s('cable', 'סמוי מלא', 'Fully concealed')
    ]
  },
  {
    code: 'V-18W',
    cat: 'podium',
    sub: 'audience-screen',
    name: { he: 'עמדה דו-מסכית', en: 'Dual-Display Station' },
    desc: {
      he: 'שני מסכים בזווית אחודה על משטח רחב, עם פתחי בקרה מרכזיים ועמוד מאוורר לציוד מחשוב פנימי. לעבודה משותפת מול קהל משני צדי העמדה.',
      en: 'Two displays aligned on a wide work surface, with central controls and a ventilated column for integrated computing equipment. Designed for shared presentation work facing an audience.'
    },
    image: '/products/V-18W.jpg',
    specs: [
      s('displays', '2 מסכים', '2 displays'),
      s('finish', 'פח צבוע בתנור', 'Powder-coated steel'),
      ph('dimensions'), ph('weight'), ph('power'),
      s('cable', 'סמוי מלא', 'Fully concealed')
    ]
  },
  {
    code: 'IX-1',
    cat: 'info-display',
    name: { he: 'עמדת תצוגה אינטראקטיבית', en: 'Interactive Display Station' },
    desc: {
      he: 'מסך מגע נטוי על בסיס משולש יציב, בגימור דו-גוני חד. מיועדת לחללי תצוגה ותערוכות בהם הציוד עצמו הוא חלק מהחוויה.',
      en: 'An angled touch display on a stable triangular base with a crisp two-tone finish. Designed for exhibitions and display spaces where the equipment is part of the experience.'
    },
    image: '/products/IX-1.jpg',
    specs: [
      s('displays', 'מסך מגע גדול', 'Large touch display'),
      s('finish', 'פח צבוע דו-גוני', 'Two-tone powder-coated steel'),
      ph('dimensions'), ph('weight'), ph('power'),
      s('cable', 'סמוי מלא', 'Fully concealed')
    ]
  },
  {
    code: 'SD-2',
    cat: 'podium',
    sub: 'tables',
    name: { he: 'שולחן מרצה נייד', en: 'Mobile Lecturer Desk' },
    desc: {
      he: 'עמדה מתקפלת על גלגלים, עם זרוע מסך, מדף למחשב נייד וארונית צד נעילה. פתרון לכיתות שדורשות סידור מחדש בין שיעורים.',
      en: 'A folding mobile station with a monitor arm, laptop shelf and lockable side cabinet. A practical solution for classrooms that are rearranged between sessions.'
    },
    image: '/products/SD-2.jpg',
    specs: [
      s('displays', 'מסך + מדף למחשב נייד', 'Display + laptop shelf'),
      s('finish', 'פח צבוע בתנור', 'Powder-coated steel'),
      ph('dimensions'), ph('weight'), ph('power'),
      s('mobility', 'גלגלים עם נעילה', 'Locking casters')
    ]
  },
  {
    code: 'CD-3',
    cat: 'control',
    sub: 'control-desks',
    name: { he: 'שולחן בקרה רב-זרועי', en: 'Multi-Arm Control Desk' },
    desc: {
      he: 'שולחן בקרה עם שתיים עד שלוש זרועות מסך מתעקלות, דלת גישה צדדית לחיווט ותושבת יציבה לעבודה ממושכת. לחדרי בקרה ותפעול.',
      en: 'A control desk with two or three articulated display arms, side cable-access door and a stable structure for extended operation in control and operations rooms.'
    },
    image: '/products/CD-3.jpg',
    specs: [
      s('displays', '2–3 זרועות מסך', '2–3 display arms'),
      s('finish', 'פח צבוע בתנור', 'Powder-coated steel'),
      ph('dimensions'), ph('weight'), ph('power'),
      s('cableAccess', 'דלת צד', 'Side door')
    ]
  },
  {
    code: 'RAV-500',
    cat: 'podium',
    sub: 'accessible',
    name: { he: 'עמדת מרצה נגישה', en: 'Accessible Lecturer Station' },
    desc: {
      he: 'עמדת מרצה בגובה נגיש, עם פאנל בקרת AV משולב, זרוע מיקרופון ומעבר כבלים מובנה. מתוכננת לאולמות הרצאה ולתקני נגישות.',
      en: 'An accessible-height lecturer station with an integrated AV control panel, microphone arm and built-in cable routing, designed for lecture halls and accessibility requirements.'
    },
    image: '/products/RAV-500.jpg',
    specs: [
      s('displays', 'מסך ראשי + פאנל AV', 'Main display + AV panel'),
      s('finish', 'פח צבוע בתנור', 'Powder-coated steel'),
      ph('dimensions'), ph('weight'), ph('power'),
      s('accessibility', 'מותאם תקן', 'Designed for accessibility standards')
    ]
  },
  {
    code: 'V-5',
    cat: 'control',
    sub: 'operator',
    name: { he: 'עמדת בקרה קומפקטית', en: 'Compact Control Station' },
    desc: {
      he: 'קונסולת בדיקה עם מסך ראשי ותצוגת משנה, לוח מקשים ייעודי וארונית אלקטרוניקה נעולה. לתחנות בדיקה ותפעול תעשייתי.',
      en: 'A test console with a primary display, secondary display, dedicated keypad and lockable electronics cabinet for industrial test and operator stations.'
    },
    image: '/products/V-5.jpg',
    specs: [
      s('displays', 'מסך ראשי + תצוגת משנה', 'Main + secondary display'),
      s('finish', 'פח צבוע בתנור', 'Powder-coated steel'),
      ph('dimensions'), ph('weight'), ph('power'),
      s('security', 'ארונית נעולה', 'Lockable cabinet')
    ]
  },
  {
    code: 'V-19W',
    cat: 'podium',
    sub: 'smart',
    name: { he: 'עמדת מרצה דו-רוחבית', en: 'Wide Dual Lecturer Station' },
    desc: {
      he: 'דגם הדגל: שני מסכים רחבים ושני מסכי עזר עליונים, שתי מקלדות, ועמוד מאוורר על בסיס מפוסל ליציבות מרבית.',
      en: 'The flagship model: two wide displays, two upper auxiliary displays, dual keyboards and a ventilated column on a sculpted base for maximum stability.'
    },
    image: '/products/V-19W.jpg',
    specs: [
      s('displays', '2 רחבים + 2 עזר', '2 wide + 2 auxiliary'),
      s('finish', 'פח צבוע דו-גוני', 'Two-tone powder-coated steel'),
      ph('dimensions'), ph('weight'), ph('power'),
      s('cable', 'סמוי מלא', 'Fully concealed')
    ]
  }
];
