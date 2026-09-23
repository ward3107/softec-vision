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
  'home.hero': ['eyebrow', 'title', 'body'],
  'home.capabilities': ['custom', 'av', 'accessible'],
  'home.faq': ['q1', 'a1', 'q2', 'a2', 'q3', 'a3', 'q4', 'a4', 'q5', 'a5', 'q6', 'a6', 'q7', 'a7', 'q8', 'a8']
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
    if (!(row.key in CONTENT_BLOCKS)) continue; // a block the app no longer knows about
    const key = row.key as ContentBlockKey;
    const he = row.content_block_translations.find((t) => t.locale === 'he')?.data ?? {};
    const en = row.content_block_translations.find((t) => t.locale === 'en')?.data ?? {};
    blocks[key] = { he, en };
  }
  return blocks;
}

/** The owner's override for one field, or the fallback when unset/blank. */
export function resolveText(blocks: ContentBlocks, key: ContentBlockKey, locale: AppLocale, field: string, fallback: string): string {
  const value = blocks[key]?.[locale]?.[field];
  return value && value.trim() ? value : fallback;
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
