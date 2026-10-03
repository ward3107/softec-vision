import type { AppLocale } from '@/i18n/routing';

export type ArticleSection = {
  heading: string;
  paragraphs: string[];
  bullets?: string[];
};

export type ArticleSource = {
  title: string;
  url: string;
  publisher: string;
};

export type LocalizedArticle = {
  title: string;
  description: string;
  eyebrow: string;
  imageAlt: string;
  readingTime: string;
  summary: string;
  takeawaysTitle: string;
  takeaways: string[];
  sections: ArticleSection[];
  sourcesTitle: string;
  methodology: string;
};

export type BlogPost = {
  slug: string;
  publishedAt: string;
  updatedAt: string;
  image: string;
  sources: ArticleSource[];
  content: Record<AppLocale, LocalizedArticle>;
};

export const BLOG_POSTS: BlogPost[] = [
  {
    slug: 'accessible-lecturer-station-design',
    publishedAt: '2026-10-04',
    updatedAt: '2026-10-04',
    image: '/products/new/accessible-podium-tel-aviv-01.webp',
    sources: [
      {
        title: '2010 ADA Standards for Accessible Design — Sections 308 and 902',
        url: 'https://www.ada.gov/law-and-regs/design-standards/2010-stds/',
        publisher: 'U.S. Department of Justice'
      },
      {
        title: 'ISO 9241-5:2024 — Workstation layout and postural requirements',
        url: 'https://www.iso.org/obp/ui/en/#iso:std:iso:9241:-5:ed-2:v1:en',
        publisher: 'International Organization for Standardization'
      },
      {
        title: 'Sit-stand workstations and impact on low back discomfort: a systematic review and meta-analysis',
        url: 'https://pubmed.ncbi.nlm.nih.gov/29115188/',
        publisher: 'Ergonomics, 2018'
      }
    ],
    content: {
      en: {
        title: 'Accessible Lecturer Stations: From Compliance Dimensions to Everyday Use',
        description: 'A research-informed guide to reach, clearances, adjustability and AV layout for accessible lecturer stations and teaching spaces.',
        eyebrow: 'Accessibility & ergonomics',
        imageAlt: 'Accessible Softec Vision lecturer station with integrated display and control surface in a university lecture hall',
        readingTime: '7 minute read',
        summary: 'An accessible lecturer station must provide a usable approach, reachable controls and a work surface that supports different bodies and teaching styles. The strongest result comes from testing those dimensions with the actual room, equipment and users—not from treating accessibility as a single height measurement.',
        takeawaysTitle: 'What should an accessible lecturer station include?',
        takeaways: [
          'A clear forward approach with knee and toe space, not merely an open-looking façade.',
          'Controls, connections and microphone positions within a practical reach envelope.',
          'A work surface and display layout that supports seated and standing use without blocking sightlines.',
          'Early coordination between furniture, AV, power, cable access and the room’s circulation path.'
        ],
        sections: [
          {
            heading: 'Accessibility begins with the approach to the station',
            paragraphs: [
              'A station can have a low worktop and still be difficult to use if the base blocks a wheelchair approach or the circulation path is too tight. Accessible design starts with the floor area in front of the station, the direction of approach and the clear space below the work surface.',
              'The 2010 ADA Standards use 28–34 inches (710–865 mm) as the work-surface height range for covered dining and work surfaces, together with clear floor space and knee-and-toe clearance. These figures are a useful reference for international projects, but the governing local standard and the project accessibility consultant remain decisive.'
            ]
          },
          {
            heading: 'Reach is a system, not a single number',
            paragraphs: [
              'The user must be able to reach the microphone, keyboard, touch panel, power controls and connection points without leaning across equipment. Obstructions change the usable reach range, so a control can be at the correct height and still be too far back.',
              'The ADA reference range for an unobstructed adult forward reach is 15–48 inches (380–1220 mm) above the floor. When a surface creates an obstruction, the permitted high reach changes with its depth. That is why the plan view of the console matters as much as its elevation.'
            ],
            bullets: [
              'Place frequent controls in the closest, clearest reach zone.',
              'Keep cable hatches and service access separate from the user’s operating area.',
              'Check the location of loose devices after the full AV package is installed.'
            ]
          },
          {
            heading: 'Adjustability should support movement without adding complexity',
            paragraphs: [
              'ISO 9241-5 emphasizes fit, postural change, ease of adjustment and adaptable workstation layouts. For a lecturer station, this can mean adjustable work height, movable display arms or carefully chosen fixed dimensions that fit the intended population.',
              'Research on sit-stand workstations suggests that changing posture may reduce low-back discomfort, but the evidence does not define one ideal configuration for every user. Adjustment controls should therefore be easy to understand, safe around moving parts and positioned where the user can operate them independently.'
            ]
          },
          {
            heading: 'Prototype the complete teaching workflow',
            paragraphs: [
              'A useful review does more than check a drawing. It walks through arriving at the station, connecting a laptop, reading the display, operating room controls, using the microphone, storing personal items and leaving the work area.',
              'A full-scale mock-up or an early sample exposes conflicts between reach, screen angle, cable bends and sightlines before manufacturing. Representative users should participate wherever possible, and the final installation should be checked again after AV commissioning.'
            ]
          }
        ],
        sourcesTitle: 'Research and standards consulted',
        methodology: 'This article is an engineering synthesis of the linked standards and peer-reviewed research. It is not a certification or a substitute for project-specific accessibility advice.'
      },
      he: {
        title: 'תכנון עמדת מרצה נגישה: ממידות תקן לשימוש יומיומי',
        description: 'מדריך מבוסס מחקר לתכנון טווחי הגעה, מרווחים, כוונון ופריסת AV בעמדות מרצה נגישות ובחללי הוראה.',
        eyebrow: 'נגישות וארגונומיה',
        imageAlt: 'עמדת מרצה נגישה של Softec Vision עם מסך ומשטח שליטה משולבים באולם הרצאות אוניברסיטאי',
        readingTime: '7 דקות קריאה',
        summary: 'עמדת מרצה נגישה צריכה לאפשר גישה נוחה, הפעלה של כל הבקרות ומשטח עבודה שמתאים לגופים ולסגנונות הוראה שונים. התוצאה הטובה ביותר מתקבלת כשבודקים את המידות יחד עם החדר, הציוד והמשתמשים בפועל—ולא מתייחסים לנגישות כאל נתון גובה יחיד.',
        takeawaysTitle: 'מה צריכה לכלול עמדת מרצה נגישה?',
        takeaways: [
          'גישה חזיתית פנויה עם מרווח ברכיים וכפות רגליים, ולא רק חזית שנראית פתוחה.',
          'בקרות, חיבורים ומיקרופון שנמצאים בטווח הגעה מעשי.',
          'משטח עבודה ותצוגות שתומכים בשימוש בישיבה ובעמידה בלי לחסום קווי ראייה.',
          'תיאום מוקדם בין הריהוט, ה־AV, החשמל, מעבר הכבלים ונתיב התנועה בחדר.'
        ],
        sections: [
          {
            heading: 'נגישות מתחילה בדרך אל העמדה',
            paragraphs: [
              'גם משטח עבודה נמוך אינו מבטיח שימוש נגיש אם בסיס העמדה חוסם גישה לכיסא גלגלים או אם נתיב התנועה צר. התכנון מתחיל בשטח הרצפה שלפני העמדה, בכיוון הגישה ובמרווח הפנוי מתחת למשטח.',
              'תקן ADA האמריקאי מגדיר למשטחי עבודה רלוונטיים טווח גובה של 710–865 מ״מ, יחד עם שטח רצפה פנוי ומרווח לברכיים ולכפות הרגליים. הנתונים הם נקודת ייחוס שימושית, אך בכל פרויקט התקן המקומי ויועץ הנגישות הם הקובעים.'
            ]
          },
          {
            heading: 'טווח הגעה הוא מערכת, לא מספר אחד',
            paragraphs: [
              'המשתמש צריך להגיע למיקרופון, למקלדת, למסך המגע, לבקרות ולחיבורים בלי להישען מעל ציוד. מכשול על המשטח משנה את טווח ההגעה, ולכן בקר יכול להיות בגובה נכון ועדיין רחוק מדי.',
              'ב־ADA טווח ההגעה הקדמי ללא מכשול למבוגר הוא 380–1220 מ״מ מעל הרצפה. כאשר משטח יוצר מכשול, הגובה המותר משתנה לפי עומק המכשול. לכן תכנית העמדה חשובה לא פחות מהמבט החזיתי שלה.'
            ],
            bullets: [
              'למקם בקרות תכופות באזור הקרוב והפנוי ביותר.',
              'להפריד פתחי שירות וכבלים מאזור ההפעלה של המשתמש.',
              'לבדוק את מיקום כל האביזרים לאחר התקנת חבילת ה־AV המלאה.'
            ]
          },
          {
            heading: 'כוונון צריך לאפשר תנועה בלי להוסיף מורכבות',
            paragraphs: [
              'ISO 9241-5 מדגיש התאמה למשתמש, שינוי תנוחה, כוונון פשוט ופריסת תחנת עבודה שניתנת להתאמה. בעמדת מרצה הדבר יכול להתבטא בגובה מתכוונן, בזרועות מסך נעות או במידות קבועות שנבחרו היטב לאוכלוסיית היעד.',
              'מחקרים על שולחנות ישיבה־עמידה מצביעים על אפשרות להפחתת אי־נוחות בגב התחתון, אך אינם מגדירים תצורה אחת שמתאימה לכולם. לכן בקרי הכוונון צריכים להיות ברורים, בטוחים ונגישים להפעלה עצמאית.'
            ]
          },
          {
            heading: 'בודקים את כל תהליך ההוראה באב־טיפוס',
            paragraphs: [
              'בדיקה טובה אינה מסתיימת בשרטוט. היא עוברת על ההגעה לעמדה, חיבור מחשב, קריאת המסך, הפעלת מערכות החדר, שימוש במיקרופון, אחסון חפצים ויציאה מאזור העבודה.',
              'דגם בגודל מלא או אב־טיפוס מוקדם חושף התנגשויות בין טווחי הגעה, זוויות מסך, כיפופי כבלים וקווי ראייה לפני הייצור. רצוי לשלב משתמשים מייצגים ולבדוק שוב את ההתקנה לאחר הפעלת מערכת ה־AV.'
            ]
          }
        ],
        sourcesTitle: 'מחקרים ותקנים שעליהם התבססנו',
        methodology: 'המאמר הוא סינתזה הנדסית של התקנים והמחקרים המקושרים. הוא אינו אישור תקינה ואינו מחליף ייעוץ נגישות ספציפי לפרויקט.'
      }
    }
  },
  {
    slug: 'control-room-workstation-human-factors',
    publishedAt: '2026-10-04',
    updatedAt: '2026-10-04',
    image: '/products/CD-3-transparent.webp',
    sources: [
      {
        title: 'ISO 11064-4:2013 — Layout and dimensions of control-centre workstations',
        url: 'https://www.iso.org/standard/54419.html',
        publisher: 'International Organization for Standardization'
      },
      {
        title: 'Looking beyond the screen: A systematic review of safety in control rooms',
        url: 'https://pubmed.ncbi.nlm.nih.gov/38322855/',
        publisher: 'Heliyon, 2024'
      },
      {
        title: 'Using evidence to support the design of submarine control console workstations',
        url: 'https://pubmed.ncbi.nlm.nih.gov/31109462/',
        publisher: 'Applied Ergonomics, 2019'
      }
    ],
    content: {
      en: {
        title: 'Control-Room Workstations: Designing Around Tasks, People and Safety',
        description: 'How task analysis, display geometry, service access and representative-user testing shape reliable control-room workstations.',
        eyebrow: 'Control rooms & human factors',
        imageAlt: 'White Softec Vision control desk with three articulated monitor arms and a wide operator work surface',
        readingTime: '8 minute read',
        summary: 'A control-room workstation should be designed from the operator’s tasks and information priorities—not from the number of screens alone. Layout, reach, sightlines, maintenance access and team communication all influence performance over a long shift.',
        takeawaysTitle: 'What makes a control workstation effective?',
        takeaways: [
          'A task analysis that identifies critical information, controls and hand-offs before the furniture is fixed.',
          'Display and input-device positions that support clear sightlines and neutral working postures.',
          'Cable and service access that maintenance teams can use without disrupting the operator area.',
          'Validation with representative operators, real equipment and realistic operating scenarios.'
        ],
        sections: [
          {
            heading: 'Start with the operating task, not the furniture footprint',
            paragraphs: [
              'Control rooms are socio-technical systems: people, interfaces, procedures, teams and the physical environment work together. A systematic review published in 2024 grouped control-room safety evidence around reliability, safety performance, decision support, communication, situation awareness and related human-factor concerns.',
              'The first design input should therefore be a task map. It identifies what the operator monitors continuously, what is used only during an event, where collaboration happens and which controls must remain immediately available.'
            ]
          },
          {
            heading: 'Display geometry should follow information priority',
            paragraphs: [
              'ISO 11064-4 addresses the layout and dimensions of seated and standing control-centre workstations. In practice, primary information belongs near the operator’s natural line of sight, while secondary displays can move farther away only when text size, viewing distance and frequency of use allow it.',
              'More screens do not automatically create better awareness. Poor grouping can increase head movement and make alarms or changing states harder to detect. The display plan should group information by task and preserve visibility to shared room displays and colleagues.'
            ],
            bullets: [
              'Keep frequently compared information within a compact visual field.',
              'Check reflections, ambient lighting and viewing angles at the installed location.',
              'Reserve space for notes and input devices instead of filling the full surface with monitors.'
            ]
          },
          {
            heading: 'Design the service path as carefully as the user path',
            paragraphs: [
              'A workstation that looks clean from the front may be difficult to maintain. Removable panels, cable separation, ventilation and component replacement paths should be planned before fabrication.',
              'Good service access reduces the temptation to leave doors open, route temporary cables across walkways or work inside the operator’s leg space. It also makes future changes—new displays, processors or control panels—less disruptive.'
            ]
          },
          {
            heading: 'Evidence from multiple sources is stronger than a single checklist',
            paragraphs: [
              'A study on submarine control consoles combined research literature, relevant standards, population-specific anthropometric data and user focus groups. That mixed approach matters because controlled studies rarely capture every constraint of a real 24/7 operations room.',
              'For a new console, use standards as the baseline, then test a mock-up with representative users and realistic tasks. Record unresolved trade-offs and re-check them after equipment integration and commissioning.'
            ]
          }
        ],
        sourcesTitle: 'Research and standards consulted',
        methodology: 'This article translates published human-factors evidence into practical design questions. Safety-critical projects require a qualified human-factors assessment and the standards applicable to their sector.'
      },
      he: {
        title: 'עמדות לחדרי בקרה: תכנון סביב משימות, אנשים ובטיחות',
        description: 'כיצד ניתוח משימות, גאומטריית מסכים, גישת שירות ובדיקות עם משתמשים מייצגים מעצבים עמדות בקרה אמינות.',
        eyebrow: 'חדרי בקרה והנדסת אנוש',
        imageAlt: 'שולחן בקרה לבן של Softec Vision עם שלוש זרועות מסך ומשטח עבודה רחב למפעיל',
        readingTime: '8 דקות קריאה',
        summary: 'עמדת חדר בקרה צריכה להתחיל מהמשימות ומסדרי העדיפויות של המפעיל—לא ממספר המסכים בלבד. פריסה, טווחי הגעה, קווי ראייה, גישת תחזוקה ותקשורת בצוות משפיעים על התפקוד לאורך משמרת ארוכה.',
        takeawaysTitle: 'מה הופך עמדת בקרה ליעילה?',
        takeaways: [
          'ניתוח משימות שמזהה מידע קריטי, בקרות והעברת אחריות לפני שקובעים את מבנה הריהוט.',
          'מיקום מסכים ואמצעי קלט ששומר על קו ראייה ברור ותנוחת עבודה ניטרלית.',
          'גישה לכבלים ולשירות שאינה מפריעה לאזור העבודה של המפעיל.',
          'אימות עם מפעילים מייצגים, ציוד אמיתי ותרחישי עבודה מציאותיים.'
        ],
        sections: [
          {
            heading: 'מתחילים במשימה התפעולית, לא במידות הרהיט',
            paragraphs: [
              'חדר בקרה הוא מערכת חברתית־טכנולוגית שבה אנשים, ממשקים, נהלים, צוותים והסביבה הפיזית עובדים יחד. סקירה שיטתית מ־2024 מיינה את מחקרי הבטיחות בחדרי בקרה לפי אמינות, ביצועי בטיחות, תמיכה בהחלטות, תקשורת, מודעות מצבית ונושאי הנדסת אנוש נוספים.',
              'לכן נקודת המוצא היא מפת משימות: מה מנוטר ברציפות, במה משתמשים רק בזמן אירוע, היכן מתקיימת עבודת צוות ואילו בקרות חייבות להיות זמינות מיד.'
            ]
          },
          {
            heading: 'גאומטריית המסכים צריכה לעקוב אחר חשיבות המידע',
            paragraphs: [
              'ISO 11064-4 עוסק בפריסה ובמידות של עמדות ישיבה ועמידה במרכזי בקרה. בפועל, המידע הראשי צריך להיות סמוך לקו הראייה הטבעי, ומסכים משניים יכולים להתרחק רק אם גודל הטקסט, מרחק הצפייה ותדירות השימוש מאפשרים זאת.',
              'מספר גדול יותר של מסכים אינו מבטיח מודעות טובה יותר. קיבוץ לקוי יכול להגדיל תנועות ראש ולהקשות על זיהוי התראות. יש לקבץ מידע לפי משימה ולשמור על קשר עין עם מסכים משותפים ועם אנשי הצוות.'
            ],
            bullets: [
              'לרכז מידע שנדרש להשוואה תכופה בתוך שדה ראייה קומפקטי.',
              'לבדוק השתקפויות, תאורת סביבה וזוויות צפייה באתר עצמו.',
              'להשאיר מקום להערות ולאמצעי קלט במקום למלא את המשטח במסכים.'
            ]
          },
          {
            heading: 'מתכננים את נתיב השירות כמו את נתיב המשתמש',
            paragraphs: [
              'עמדה שנראית נקייה מלפנים עלולה להיות קשה לתחזוקה. פאנלים נשלפים, הפרדת כבלים, אוורור ונתיבי החלפה של רכיבים צריכים להיקבע לפני הייצור.',
              'גישת שירות טובה מפחיתה מצבים שבהם דלתות נשארות פתוחות, כבלים זמניים חוצים מעבר או טכנאי עובד בתוך מרווח הרגליים. היא גם מקלה על שדרוג עתידי של מסכים, מחשבים ופאנלי שליטה.'
            ]
          },
          {
            heading: 'שילוב מקורות ראיות חזק יותר מרשימת בדיקה אחת',
            paragraphs: [
              'מחקר על קונסולות שליטה בצוללות שילב ספרות מחקרית, תקנים, נתונים אנתרופומטריים וקבוצות מיקוד של משתמשים. הגישה המשולבת חשובה משום שמחקר מבוקר אינו מייצג תמיד את כל האילוצים של חדר תפעול אמיתי שפועל סביב השעון.',
              'בפרויקט חדש משתמשים בתקנים כבסיס, ולאחר מכן בודקים אב־טיפוס עם משתמשים מייצגים ומשימות מציאותיות. מתעדים פשרות שלא נפתרו ובודקים אותן שוב אחרי שילוב הציוד וההפעלה.'
            ]
          }
        ],
        sourcesTitle: 'מחקרים ותקנים שעליהם התבססנו',
        methodology: 'המאמר מתרגם ממצאים שפורסמו לשאלות תכנון מעשיות. פרויקט בטיחותי או קריטי דורש הערכת הנדסת אנוש מקצועית ועמידה בתקנים של הענף הרלוונטי.'
      }
    }
  },
  {
    slug: 'flexible-learning-space-technology-furniture',
    publishedAt: '2026-10-04',
    updatedAt: '2026-10-04',
    image: '/products/new/biology-double-podium-01.webp',
    sources: [
      {
        title: 'Active learning increases student performance in science, engineering, and mathematics',
        url: 'https://www.pnas.org/doi/10.1073/pnas.1319030111',
        publisher: 'Proceedings of the National Academy of Sciences, 2014'
      },
      {
        title: 'ISO 9241-5:2024 — Workstation layout and postural requirements',
        url: 'https://www.iso.org/obp/ui/en/#iso:std:iso:9241:-5:ed-2:v1:en',
        publisher: 'International Organization for Standardization'
      },
      {
        title: 'Industrial workstation design: a systematic ergonomics approach',
        url: 'https://pubmed.ncbi.nlm.nih.gov/15677055/',
        publisher: 'Applied Ergonomics, 1996'
      }
    ],
    content: {
      en: {
        title: 'Technology Furniture for Flexible Learning Spaces',
        description: 'A research-informed framework for lecturer stations that support active learning, fast room changes and reliable AV operation.',
        eyebrow: 'Learning spaces & AV',
        imageAlt: 'Wide dual Softec Vision lecturer station with pull-out side work surfaces and integrated equipment storage',
        readingTime: '7 minute read',
        summary: 'Flexible learning is supported when the room can move between explanation, demonstration and group activity without making the technology difficult to operate. The lecturer station should reduce setup friction, preserve sightlines and keep AV controls predictable across teaching modes.',
        takeawaysTitle: 'How can furniture support flexible teaching?',
        takeaways: [
          'Keep the transition between lecture, demonstration and discussion fast and understandable.',
          'Place the instructor’s displays so they support the task without becoming a visual barrier.',
          'Provide a clear home for laptops, document cameras, microphones and temporary connections.',
          'Test the station together with room layout, teaching scenarios and the complete AV system.'
        ],
        sections: [
          {
            heading: 'Active learning changes the demands on the room',
            paragraphs: [
              'A large meta-analysis published in PNAS found better examination performance and lower failure rates in undergraduate STEM courses using active-learning approaches than in traditional lecturing. Furniture alone cannot create active learning, but it can either support or obstruct the transitions those approaches require.',
              'When an instructor moves between presenting, demonstrating, questioning and circulating around the room, the technology should remain available without forcing every activity back to a fixed position.'
            ]
          },
          {
            heading: 'The lecturer station should reduce switching costs',
            paragraphs: [
              'Every unnecessary cable change, hidden input or blocked surface adds friction. A well-planned station creates predictable locations for the primary computer, temporary guest devices, audio controls, room control and teaching materials.',
              'The goal is not to expose every connector. It is to make common actions obvious while keeping service connections, power distribution and cable slack protected inside the body.'
            ],
            bullets: [
              'Define the three to five most common teaching scenarios before selecting equipment.',
              'Keep temporary laptop connections visible and easy to replace.',
              'Use consistent control labels and provide a clear default state for the next lecturer.'
            ]
          },
          {
            heading: 'Sightlines connect the instructor, audience and displays',
            paragraphs: [
              'A large front display can communicate content to the audience, but it can also create a barrier if its height or angle hides the lecturer. The instructor’s preview display must be readable without turning away from students, while audience-facing screens need to remain visible from the room’s critical seats.',
              'Check the arrangement with real display sizes and camera positions. The same station may be used for in-room teaching, hybrid sessions and recorded lectures, each with different sightline requirements.'
            ]
          },
          {
            heading: 'Prototype with scenarios, not only dimensions',
            paragraphs: [
              'Systematic workstation design combines anthropometric fit, posture, work height, working areas and visual requirements. A mock-up allows the project team to test these factors before metal is cut.',
              'Run short scenarios: start a presentation, connect a guest laptop, switch to a document camera, take a question, adjust the microphone and return the room to its default state. The observations become design inputs for the final station and the room-control interface.'
            ]
          }
        ],
        sourcesTitle: 'Research and standards consulted',
        methodology: 'This article connects learning research with workstation and AV design. It does not claim that furniture alone improves learning outcomes; pedagogy, acoustics, lighting, technology and support all contribute.'
      },
      he: {
        title: 'ריהוט טכנולוגי לחללי למידה גמישים',
        description: 'מסגרת מבוססת מחקר לעמדות מרצה שתומכות בלמידה פעילה, שינוי מהיר של החדר ותפעול AV אמין.',
        eyebrow: 'חללי למידה ו־AV',
        imageAlt: 'עמדת מרצה כפולה ורחבה של Softec Vision עם משטחי צד נשלפים ואחסון משולב לציוד',
        readingTime: '7 דקות קריאה',
        summary: 'למידה גמישה מקבלת תמיכה כשהחדר יכול לעבור בין הסבר, הדגמה ופעילות קבוצתית בלי להפוך את הטכנולוגיה למסובכת. עמדת המרצה צריכה לצמצם חיכוך בהפעלה, לשמור על קווי ראייה ולהציג בקרות AV עקביות בכל מצב הוראה.',
        takeawaysTitle: 'איך ריהוט יכול לתמוך בהוראה גמישה?',
        takeaways: [
          'לאפשר מעבר מהיר וברור בין הרצאה, הדגמה ודיון.',
          'למקם את מסכי המרצה כך שיתמכו במשימה בלי להפוך למחסום חזותי.',
          'להגדיר מקום ברור למחשב נייד, מצלמת מסמכים, מיקרופון וחיבורים זמניים.',
          'לבדוק את העמדה יחד עם פריסת החדר, תרחישי הוראה ומערכת ה־AV המלאה.'
        ],
        sections: [
          {
            heading: 'למידה פעילה משנה את הדרישות מהחדר',
            paragraphs: [
              'מטא־אנליזה רחבה שפורסמה ב־PNAS מצאה שיפור בביצועי מבחנים וירידה בשיעורי כישלון בקורסי STEM לתואר ראשון שהשתמשו בלמידה פעילה לעומת הרצאה מסורתית. ריהוט לבדו אינו יוצר למידה פעילה, אך הוא יכול לתמוך במעברים שהיא דורשת או להפריע להם.',
              'כאשר המרצה עובר בין הצגה, הדגמה, שאלות ותנועה בחדר, הטכנולוגיה צריכה להישאר זמינה בלי לאלץ כל פעילות לחזור לעמדה קבועה.'
            ]
          },
          {
            heading: 'עמדת המרצה צריכה לצמצם את עלות המעבר',
            paragraphs: [
              'כל החלפת כבל מיותרת, כניסה נסתרת או משטח חסום מוסיפים חיכוך. עמדה מתוכננת מגדירה מקומות צפויים למחשב הראשי, לציוד אורח, לבקרת שמע, לשליטה בחדר ולחומרי הוראה.',
              'המטרה אינה לחשוף כל חיבור, אלא להפוך פעולות שכיחות לברורות, תוך הגנה על חיבורי שירות, חלוקת חשמל ועודפי כבלים בתוך גוף העמדה.'
            ],
            bullets: [
              'להגדיר שלושה עד חמישה תרחישי הוראה שכיחים לפני בחירת הציוד.',
              'לשמור חיבורים זמניים למחשב נייד גלויים וקלים להחלפה.',
              'להשתמש בתוויות עקביות וליצור מצב ברירת מחדל ברור למרצה הבא.'
            ]
          },
          {
            heading: 'קווי ראייה מחברים בין המרצה, הקהל והתצוגות',
            paragraphs: [
              'מסך קדמי גדול יכול להעביר תוכן לקהל, אך גם להסתיר את המרצה אם הגובה או הזווית אינם נכונים. מסך התצוגה של המרצה צריך להיות קריא בלי להפנות גב לסטודנטים, והמסכים לקהל צריכים להישאר נראים מהמושבים הקריטיים בחדר.',
              'בודקים את הפריסה עם גדלי המסכים ועם מיקומי המצלמות האמיתיים. אותה עמדה עשויה לשמש הוראה בחדר, מפגש היברידי והקלטה—ולכל מצב דרישות קו ראייה שונות.'
            ]
          },
          {
            heading: 'בודקים תרחישים, לא רק מידות',
            paragraphs: [
              'תכנון שיטתי של תחנת עבודה משלב התאמה אנתרופומטרית, תנוחה, גובה עבודה, אזורי עבודה ודרישות חזותיות. אב־טיפוס מאפשר לצוות לבדוק את הגורמים האלה לפני חיתוך המתכת.',
              'מריצים תרחישים קצרים: פתיחת מצגת, חיבור מחשב אורח, מעבר למצלמת מסמכים, קבלת שאלה, כוונון המיקרופון והחזרת החדר למצב ברירת המחדל. התצפיות הופכות לדרישות לעמדה ולממשק השליטה בחדר.'
            ]
          }
        ],
        sourcesTitle: 'מחקרים ותקנים שעליהם התבססנו',
        methodology: 'המאמר מחבר בין מחקר בתחום הלמידה לבין תכנון תחנות עבודה ו־AV. הוא אינו טוען שריהוט לבדו משפר הישגים; פדגוגיה, אקוסטיקה, תאורה, טכנולוגיה ותמיכה תורמים יחד.'
      }
    }
  }
];

export function getBlogPost(slug: string): BlogPost | undefined {
  return BLOG_POSTS.find((post) => post.slug === slug);
}

