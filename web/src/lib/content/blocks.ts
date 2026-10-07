/**
 * Owner-editable marketing copy (Supabase `content_blocks` /
 * `content_block_translations`, RLS: public reads published, staff manage
 * all — see migration 0001). A block's field is only overridden on the site
 * when the owner has actually filled it in; an empty field falls back to the
 * shipped copy, exactly like the product text/spec overrides in
 * `lib/catalog/db.ts`. No 'server-only' here so the pure resolver is
 * importable by tests; the Supabase-fetching half is only ever called from
 * server code.
 */
import type { AppLocale } from '@/i18n/routing';

/** Question/answer pairs in the home-page FAQ (fields q1/a1 … q8/a8). */
export const FAQ_COUNT = 8;

/** Every editable block and the fields it exposes, in display order. */
export const CONTENT_BLOCKS = {
  'home.hero': ['eyebrow', 'title', 'body', 'image', 'imageAlt', 'delivery', 'explore', 'proof1', 'proof2', 'proof3'],
  'home.capabilities': ['custom', 'customSub', 'av', 'avSub', 'accessible', 'accessibleSub'],
  'home.families': ['title', 'body'],
  'home.process': ['eyebrow', 'title', 'body', 's1t', 's1b', 's2t', 's2b', 's3t', 's3b', 's4t', 's4b', 'deliveryTitle', 'deliveryBody'],
  'home.custom': ['eyebrow', 'title', 'body', 'action', 's1t', 's1b', 's2t', 's2b', 's3t', 's3b'],
  'home.about': ['whyTitle', 'why1', 'why2', 'why3', 'why4'],
  'home.faq': ['eyebrow', 'title', 'body', 'q1', 'a1', 'q2', 'a2', 'q3', 'a3', 'q4', 'a4', 'q5', 'a5', 'q6', 'a6', 'q7', 'a7', 'q8', 'a8'],
  'home.contact': ['title', 'body']
} as const;

export type ContentBlockKey = keyof typeof CONTENT_BLOCKS;
export type ContentBlockData = Record<string, string>;
/** key -> locale -> field -> value, for whatever blocks the database has. */
export type ContentBlocks = Partial<Record<ContentBlockKey, Record<AppLocale, ContentBlockData>>>;

export interface DbContentBlockRow {
  key: string;
  content_block_translations: Array<{ locale: string; data: ContentBlockData }>;
}

/** Maps the raw Supabase rows to the shape resolveText() reads. */
export function rowsToContentBlocks(rows: DbContentBlockRow[]): ContentBlocks {
  const blocks: ContentBlocks = {};
  for (const row of rows) {
    if (!Object.hasOwn(CONTENT_BLOCKS, row.key)) continue;
    const key = row.key as ContentBlockKey;
    const he = row.content_block_translations.find((t) => t.locale === 'he')?.data ?? {};
    const en = row.content_block_translations.find((t) => t.locale === 'en')?.data ?? {};
    blocks[key] = { he, en };
  }
  return blocks;
}

/** The owner's override for one field, or the fallback when unset/blank. */
export function resolveText(blocks: ContentBlocks, key: ContentBlockKey, locale: AppLocale, field: string, fallback: string): string {
  if (isContentHidden(blocks, key, locale, field)) return '';
  const value = blocks[key]?.[locale]?.[field];
  return value && value.trim() ? value : fallback;
}

export function isContentHidden(blocks: ContentBlocks, key: ContentBlockKey, locale: AppLocale, field?: string): boolean {
  return blocks[key]?.[locale]?.[field ? `_hide.${field}` : '_hidden'] === 'true';
}

/** Stable selection hooks shared by the public renderer and authenticated preview. */
export function contentAttributes(blocks: ContentBlocks, key: ContentBlockKey, locale: AppLocale, field?: string) {
  return {
    'data-cms-block': field ? undefined : key,
    'data-cms-field': field,
    style: isContentHidden(blocks, key, locale, field) ? { display: 'none' } : undefined
  };
}

export const CONTENT_LIMIT = 600;

/**
 * Parses one block's submitted fields (`he.<field>` / `en.<field>`), trimmed
 * and length-capped. Blank is valid — for marketing copy it simply means
 * "use the shipped default" (see resolveText), so there is nothing to reject.
 */
export function parseContentBlockForm(fd: FormData, key: ContentBlockKey): { he: ContentBlockData; en: ContentBlockData } {
  const fields = CONTENT_BLOCKS[key];
  const read = (locale: 'he' | 'en') =>
    Object.fromEntries(
      fields.map((field) => [field, String(fd.get(`${locale}.${field}`) ?? '').trim().slice(0, CONTENT_LIMIT)])
    ) as ContentBlockData;
  return { he: read('he'), en: read('en') };
}
