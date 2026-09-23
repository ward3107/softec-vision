import 'server-only';
import type { SupabaseClient } from '@supabase/supabase-js';
import enMessages from '../../../messages/en.json';
import heMessages from '../../../messages/he.json';
import { CONTENT_BLOCKS, type ContentBlockData, type ContentBlockKey } from '@/lib/content/blocks';

/** The shipped copy for a block's fields, keyed the same way the block's own data is — the admin form's placeholder/default when the owner hasn't overridden a field. */
const SHIPPED_TEXT: Record<ContentBlockKey, { he: ContentBlockData; en: ContentBlockData }> = {
  'home.hero': {
    he: { eyebrow: heMessages.hero.eyebrow, title: heMessages.hero.title, body: heMessages.hero.body },
    en: { eyebrow: enMessages.hero.eyebrow, title: enMessages.hero.title, body: enMessages.hero.body }
  },
  'home.capabilities': {
    he: { custom: heMessages.capabilities.custom, av: heMessages.capabilities.av, accessible: heMessages.capabilities.accessible },
    en: { custom: enMessages.capabilities.custom, av: enMessages.capabilities.av, accessible: enMessages.capabilities.accessible }
  }
};

export interface AdminContentBlock {
  key: ContentBlockKey;
  fields: readonly string[];
  /** The owner's saved override, or '' where unset. */
  values: { he: ContentBlockData; en: ContentBlockData };
  /** The shipped copy shown alongside each field as its "default if left blank". */
  shipped: { he: ContentBlockData; en: ContentBlockData };
}

/** Every editable block, with the owner's current overrides (blank where unset). */
export async function listAdminContentBlocks(client: SupabaseClient): Promise<AdminContentBlock[]> {
  const { data, error } = await client.from('content_blocks').select('key, content_block_translations(locale, data)');
  if (error) throw new Error(error.message);
  const rows = (data ?? []) as unknown as Array<{ key: string; content_block_translations: Array<{ locale: string; data: ContentBlockData }> }>;
  const byKey = new Map(rows.map((r) => [r.key, r]));

  return (Object.keys(CONTENT_BLOCKS) as ContentBlockKey[]).map((key) => {
    const fields = CONTENT_BLOCKS[key];
    const row = byKey.get(key);
    const dataFor = (locale: 'he' | 'en') => {
      const saved = row?.content_block_translations.find((t) => t.locale === locale)?.data ?? {};
      return Object.fromEntries(fields.map((field) => [field, saved[field] ?? ''])) as ContentBlockData;
    };
    return { key, fields, values: { he: dataFor('he'), en: dataFor('en') }, shipped: SHIPPED_TEXT[key] };
  });
}

/** Saves one block's fields for both locales. RLS: any staff member (same table policy as products). */
export async function saveContentBlock(
  client: SupabaseClient,
  key: ContentBlockKey,
  values: { he: ContentBlockData; en: ContentBlockData }
): Promise<void> {
  const { data: block, error: blockError } = await client
    .from('content_blocks')
    .upsert({ key }, { onConflict: 'key' })
    .select('id')
    .single();
  if (blockError) throw new Error(blockError.message);
  const blockId = (block as { id: string }).id;

  const { error } = await client
    .from('content_block_translations')
    .upsert(
      [
        { block_id: blockId, locale: 'he', data: values.he },
        { block_id: blockId, locale: 'en', data: values.en }
      ],
      { onConflict: 'block_id,locale' }
    );
  if (error) throw new Error(error.message);
}
