-- Seed: locales, categories/subcategories and spec fields.
-- Products are imported from the in-repo seed (src/lib/catalog/seed.ts) once the
-- CMS import runs; kept out of SQL to avoid duplicating that source of truth.

insert into locales (code, name, dir, enabled, is_default, sort) values
  ('he', 'עברית',   'rtl', true, true,  0),
  ('en', 'English', 'ltr', true, false, 1)
on conflict (code) do nothing;

-- Top-level categories. charging-carts is English-only via visible_in.
with cat(slug, sort, status, visible_in, name_he, name_en, desc_he, desc_en) as (
  values
    ('podium', 0, 'published', array['he','en'],
      'עמדות מרצה – פודיום', 'Lecturer Stations — Podiums',
      'עמדות הוראה המשלבות משטח עבודה, תצוגה, בקרה וניהול כבלים.',
      'Teaching stations integrating work surfaces, displays, controls and cable management.'),
    ('info-display', 1, 'published', array['he','en'],
      'עמדות מידע ותצוגה', 'Information and Display Stations',
      'עמדות אינטראקטיביות לתצוגה, הכוונה וקבלת מידע.',
      'Interactive stations for display, wayfinding and information access.'),
    ('control', 2, 'published', array['he','en'],
      'שולחנות בקרה ושליטה', 'Control and Command Desks',
      'סביבות עבודה מרובות מסכים לחדרי בקרה ותפעול.',
      'Multi-display work environments for control and operations rooms.'),
    ('charging-carts', 3, 'published', array['en'],
      'עגלות טעינה למחשבים', 'Computer Charging Carts',
      'אחסון, טעינה ושינוע מאובטח של מחשבים ניידים.',
      'Secure storage, charging and transport for laptop computers.'),
    ('service-carts', 4, 'published', array['he','en'],
      'עגלות מחשוב ושירות', 'Computing and Service Carts',
      'עגלות ניידות לציוד מחשוב, שירות ותפעול.',
      'Mobile carts for computing, service and operational equipment.'),
    ('custom', 5, 'published', array['he','en'],
      'תכנון וייצור פתרונות בהתאמה אישית', 'Custom Solution Design and Manufacturing',
      'פתרונות מתוכננים לפי המרחב, הציוד ואופן העבודה.',
      'Solutions engineered around the space, equipment and working method.')
),
ins as (
  insert into categories (slug, sort, status, visible_in)
  select slug, sort, status::publish_status, visible_in from cat
  on conflict (slug) do nothing
  returning id, slug
)
insert into category_translations (category_id, locale, name, description)
select i.id, l.locale, l.name, l.description
from ins i
join (
  select slug, 'he' as locale, name_he as name, desc_he as description from cat
  union all
  select slug, 'en', name_en, desc_en from cat
) l on l.slug = i.slug
on conflict do nothing;

-- Canonical spec fields (labels drive the detail table and comparison rows).
with sf(key, sort, label_he, label_en) as (
  values
    ('displays', 0, 'מסכים', 'Displays'),
    ('finish', 1, 'גימור', 'Finish'),
    ('dimensions', 2, 'מידות (ג×ר×ע)', 'Dimensions (H×W×D)'),
    ('weight', 3, 'משקל', 'Weight'),
    ('power', 4, 'חשמל', 'Power'),
    ('cable', 5, 'ניהול כבלים', 'Cable management'),
    ('mobility', 6, 'ניידות', 'Mobility'),
    ('cableAccess', 7, 'גישה לחיווט', 'Cable access'),
    ('security', 8, 'אבטחה', 'Security'),
    ('accessibility', 9, 'נגישות', 'Accessibility')
),
ins as (
  insert into spec_fields (key, sort) select key, sort from sf
  on conflict (key) do nothing
  returning id, key
)
insert into spec_field_translations (spec_field_id, locale, label)
select i.id, l.locale, l.label
from ins i
join (
  select key, 'he' as locale, label_he as label from sf
  union all
  select key, 'en', label_en from sf
) l on l.key = i.key
on conflict do nothing;

-- Singleton contact info.
insert into contact_info (id, phone, whatsapp, email)
values (1, '03-6968777', '+972544742520', 'Alon@softec.co.il')
on conflict (id) do nothing;
