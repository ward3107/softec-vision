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

/** Canonical spec fields, in display order. */
export const SPEC_LABELS: Record<string, Localized> = {
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
    imageAlt: {
      he: 'עמדת מרצה קומפקטית לבנה עם זרוע מסך על המשטח העליון ומסך בחזית העמוד',
      en: 'White compact lecturer station with a monitor arm on the top surface and a display on the front of the column'
    },
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
    image: '/products/V-18W-transparent.webp',
    imageAlt: {
      he: 'עמדה לבנה עם שני מסכים מעל משטח עבודה רחב ועמוד מאוורר על בסיס מקושת',
      en: 'White station with two displays above a wide work surface and a ventilated column on a curved base'
    },
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
    image: '/products/IX-1-transparent.webp',
    imageAlt: {
      he: 'מסך מגע גדול ונטוי על בסיס זוויתי בגימור שחור ואדום',
      en: 'Large tilted touch display on an angular base with a black and red finish'
    },
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
    image: '/products/SD-2-transparent.webp',
    imageAlt: {
      he: 'שולחן מרצה לבן על גלגלים עם זרוע מסך, מקום למחשב נייד וארונית צד סגורה',
      en: 'White lecturer desk on casters with a monitor arm, laptop space and an enclosed side cabinet'
    },
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
    image: '/products/CD-3-transparent.webp',
    imageAlt: {
      he: 'שולחן בקרה לבן עם שלוש זרועות מסך מתכווננות ומשטח עבודה רחב',
      en: 'White control desk with three articulated monitor arms and a wide work surface'
    },
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
    image: '/products/RAV-500-transparent.webp',
    imageAlt: {
      he: 'עמדת מרצה נגישה אפורה עם מסך, מקלדת שקועה, מיקרופון גמיש, פאנל שליטה ולוח כוונון גובה',
      en: 'Grey accessible lecturer station with a display, recessed keyboard, gooseneck microphone, touch control panel and height-adjustment keypad'
    },
    specs: [
      s('displays', 'מסך ראשי + פאנל AV', 'Main display + AV panel'),
      s('finish', 'פח צבוע בתנור', 'Powder-coated steel'),
      ph('dimensions'), ph('weight'), ph('power'),
      s('accessibility', 'גובה עבודה נגיש', 'Accessible working height')
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
    image: '/products/V-5-transparent.webp',
    imageAlt: {
      he: 'קונסולת בקרה אפורה בהירה עם מסך ראשי נטוי, מסך מגע קטן, מיקרופון גמיש, מקלדת ומגירה ננעלת',
      en: 'Light grey control console with an angled main display, small touch screen, gooseneck microphone, keyboard and lockable drawer'
    },
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
    image: '/products/V-19W-transparent.webp',
    imageAlt: {
      he: 'עמדת מרצה לבנה ורחבה עם שני מסכים גדולים, שני מסכים עליונים קטנים ושתי מקלדות',
      en: 'White wide lecturer station with two large displays, two small upper displays and two keyboards'
    },
    specs: [
      s('displays', '2 רחבים + 2 עזר', '2 wide + 2 auxiliary'),
      s('finish', 'פח צבוע דו-גוני', 'Two-tone powder-coated steel'),
      ph('dimensions'), ph('weight'), ph('power'),
      s('cable', 'סמוי מלא', 'Fully concealed')
    ]
  },
  {
    code: 'ACCESSIBLE-TLV',
    cat: 'podium',
    sub: 'accessible',
    name: { he: 'פודיום נגיש חכם', en: 'Smart Accessible Podium' },
    desc: {
      he: 'עמדת מרצה נגישה באולם הרצאות, עם מסך עבודה, פאנל שליטה ומיקרופון משולבים במשטח העליון.',
      en: 'An accessible lecturer station in a lecture hall, with a work display, control panel and microphone integrated into the top surface.'
    },
    image: '/products/new/accessible-podium-tel-aviv-01.webp',
    imageAlt: {
      he: 'פודיום נגיש חכם אפור של אוניברסיטת תל אביב עם מסך משולב',
      en: 'Grey smart accessible podium for Tel Aviv University with an integrated display'
    },
    gallery: [
      {
        src: '/products/new/accessible-podium-tel-aviv-02.webp',
        alt: { he: 'מבט צד על הפודיום הנגיש ומסך השליטה', en: 'Side view of the accessible podium and its control display' }
      },
      {
        src: '/products/new/accessible-podium-tel-aviv-03.webp',
        alt: { he: 'משטח העבודה הנגיש עם מסך, מקלדת, עכבר ופאנל AV', en: 'Accessible work surface with display, keyboard, mouse and AV control panel' }
      }
    ],
    specs: [
      s('displays', 'מסך עבודה + פאנל AV', 'Work display + AV control panel'),
      s('accessibility', 'משטח עבודה בגובה נגיש', 'Accessible-height work surface'),
      ph('dimensions'), ph('weight'), ph('power')
    ]
  },
  {
    code: 'BIO-DOUBLE',
    cat: 'podium',
    sub: 'double',
    name: { he: 'עמדת מרצה כפולה ביולוגי', en: 'Biology Dual Lecturer Station' },
    desc: {
      he: 'עמדת מרצה רחבה עם שני משטחי צד נשלפים, משטח עבודה מעץ וארון ציוד מרכזי הניתן לנעילה.',
      en: 'A wide lecturer station with two pull-out side surfaces, a timber worktop and a lockable central equipment cabinet.'
    },
    image: '/products/new/biology-double-podium-01.webp',
    imageAlt: { he: 'עמדת מרצה כפולה לבנה עם שני משטחי צד נשלפים', en: 'White dual lecturer station with two pull-out side surfaces' },
    gallery: [
      {
        src: '/products/new/biology-double-podium-02.webp',
        alt: { he: 'מבט קדמי על עמדת המרצה הכפולה של המכון למחקר ביולוגי', en: 'Front view of the dual lecturer station for the Israel Institute for Biological Research' }
      }
    ],
    specs: [s('finish', 'גוף לבן ומשטח עץ', 'White body with timber worktop'), ph('dimensions'), ph('weight')]
  },
  {
    code: 'G-1',
    cat: 'podium',
    sub: 'smart',
    name: { he: 'עמדת מרצה G-1', en: 'G-1 Lecturer Station' },
    desc: {
      he: 'עמדת מרצה קומפקטית עם משטח עבודה רחב, מקום למחשב נייד ושתי זרועות גמישות למיקרופון ולתאורה.',
      en: 'A compact lecturer station with a wide work surface, laptop space and two flexible arms for a microphone and task light.'
    },
    image: '/products/new/lecturer-station-g1-01.webp',
    imageAlt: { he: 'עמדת מרצה G-1 לבנה ושחורה עם מחשב נייד ושתי זרועות', en: 'White and black G-1 lecturer station with a laptop and two flexible arms' },
    gallery: [
      {
        src: '/products/new/lecturer-station-g1-02.webp',
        alt: { he: 'מבט חזיתי על משטח העבודה של עמדת G-1', en: 'Front view of the G-1 lecturer station work surface' }
      }
    ],
    specs: [s('displays', 'מקום למחשב נייד', 'Laptop workspace'), s('cable', 'פתחים משולבים במשטח', 'Integrated worktop ports'), ph('dimensions')]
  },
  {
    code: 'NT-PODIUM',
    cat: 'podium',
    sub: 'no-tech',
    name: { he: 'עמדת מרצה ללא טכנולוגיה', en: 'Non-Technology Lecturer Podium' },
    desc: { he: 'פודיום שחור מינימליסטי עם משטח כתיבה רחב ומיקרופון גמיש.', en: 'A minimalist black podium with a wide writing surface and flexible microphone.' },
    image: '/products/new/non-tech-lecturer-podium.webp',
    imageAlt: { he: 'פודיום שחור ללא מסך עם מיקרופון גמיש', en: 'Black podium without a display, fitted with a flexible microphone' },
    specs: [s('displays', 'ללא מסך משולב', 'No integrated display'), ph('dimensions'), ph('weight')]
  },
  {
    code: 'L-2',
    cat: 'podium',
    sub: 'no-tech',
    name: { he: 'פודיום אלומיניום L-2', en: 'L-2 Aluminium Podium' },
    desc: { he: 'פודיום אלומיניום קל-מראה עם מדף עבודה עליון ומדף פנימי פתוח.', en: 'A lightweight-looking aluminium podium with an upper work surface and an open internal shelf.' },
    image: '/products/new/aluminum-podium-l2.webp',
    imageAlt: { he: 'פודיום אלומיניום L-2 עם מדף פנימי', en: 'L-2 aluminium podium with an internal shelf' },
    specs: [s('finish', 'אלומיניום', 'Aluminium'), ph('dimensions'), ph('weight')]
  },
  {
    code: 'IL-18',
    cat: 'podium',
    sub: 'no-tech',
    name: { he: 'פודיום IL-18', en: 'IL-18 Podium' },
    desc: { he: 'פודיום לבן קומפקטי עם גוף סגור, משטח עליון כהה ופתחי מעבר כבלים.', en: 'A compact white podium with an enclosed body, dark worktop and cable pass-throughs.' },
    image: '/products/new/podium-il18-01.webp',
    imageAlt: { he: 'פודיום IL-18 לבן במבט קדמי', en: 'White IL-18 podium viewed from the front' },
    gallery: [
      { src: '/products/new/podium-il18-02.webp', alt: { he: 'שתי זוויות של פודיום IL-18', en: 'Two views of the IL-18 podium' } }
    ],
    specs: [s('cable', 'פתחים משולבים', 'Integrated pass-throughs'), ph('dimensions'), ph('weight')]
  },
  {
    code: 'MEMORIAL-HALL',
    cat: 'custom',
    name: { he: 'פודיום היכל ההנצחה', en: 'Memorial Hall Podium' },
    desc: { he: 'פודיום מותאם להיכל הזיכרון הממלכתי לחללי מערכות ישראל, עם חזית ממותגת ותאורה מובנית.', en: 'A custom podium for Israel’s National Memorial Hall, with a branded front panel and integrated task lighting.' },
    image: '/products/new/memorial-hall-podium-01.webp',
    imageAlt: { he: 'פודיום לבן בהיכל הזיכרון הממלכתי לצד דגלים', en: 'White podium in Israel’s National Memorial Hall beside ceremonial flags' },
    gallery: [
      { src: '/products/new/memorial-hall-podium-02.webp', alt: { he: 'מבט צד על הפודיום בהיכל ההנצחה מול קירות הזיכרון', en: 'Side view of the memorial hall podium in front of the remembrance displays' } }
    ],
    specs: [s('finish', 'חזית מותאמת וממותגת', 'Custom branded front'), ph('dimensions'), ph('weight')]
  },
  {
    code: 'ROTHSCHILD',
    cat: 'custom',
    name: { he: 'פודיום קרן אדמונד דה רוטשילד', en: 'Edmond de Rothschild Foundation Podium' },
    desc: { he: 'פודיום שחור מותאם אישית עם חזית ממותגת ומשטח כתיבה רחב.', en: 'A custom black podium with a branded front panel and wide writing surface.' },
    image: '/products/new/rothschild-foundation-podium-01.webp',
    imageAlt: { he: 'פודיום שחור ממותג של קרן אדמונד דה רוטשילד', en: 'Black branded podium for the Edmond de Rothschild Foundation' },
    gallery: [
      { src: '/products/new/rothschild-foundation-podium-02.webp', alt: { he: 'שתי זוויות של פודיום קרן אדמונד דה רוטשילד', en: 'Two views of the Edmond de Rothschild Foundation podium' } }
    ],
    specs: [s('finish', 'גוף שחור וחזית ממותגת', 'Black body with branded front'), ph('dimensions'), ph('weight')]
  },
  {
    code: 'PREMIUM-LECTERN',
    cat: 'podium',
    sub: 'smart',
    name: { he: 'פודיום מרצה מהודר', en: 'Premium Lecturer Podium' },
    desc: { he: 'פודיום מהודר בגוון אפור עם מסך משולב, מיקרופון וחזית מחורצת הניתנת למיתוג.', en: 'A premium grey podium with an integrated display, microphone and fluted, brand-ready front.' },
    image: '/products/new/premium-lecturer-podium.webp',
    imageAlt: { he: 'פודיום מרצה אפור מהודר עם מסך ומיקרופון', en: 'Premium grey lecturer podium with an integrated display and microphone' },
    specs: [s('displays', 'מסך משולב', 'Integrated display'), s('finish', 'חזית מחורצת וממותגת', 'Fluted branded front'), ph('dimensions')]
  },
  {
    code: 'SDEROT-HALL',
    cat: 'custom',
    name: { he: 'פודיום אולם המופעים שדרות', en: 'Sderot Performing Arts Hall Podium' },
    desc: { he: 'פודיום לבן מותאם לאולם המופעים שדרות, עם חזית ממותגת, משטח רחב ומיקרופון גמיש.', en: 'A custom white podium for the Sderot Performing Arts Hall, with a branded fascia, wide surface and flexible microphone.' },
    image: '/products/new/sderot-performing-arts-podium.webp',
    imageAlt: { he: 'פודיום לבן ממותג של אולם המופעים שדרות', en: 'White branded podium for the Sderot Performing Arts Hall' },
    specs: [s('finish', 'חזית לבנה ממותגת', 'White branded fascia'), ph('dimensions'), ph('weight')]
  }
];
