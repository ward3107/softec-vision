import 'server-only';
import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import { unstable_cache } from 'next/cache';
import { rowsToContentBlocks, type ContentBlocks, type DbContentBlockRow } from './blocks';

/** Cache tag the admin revalidates after editing content. */
export const CONTENT_TAG = 'content';

export async function fetchContentBlocks(client: SupabaseClient): Promise<ContentBlocks> {
  const { data, error } = await client.from('content_blocks').select('key, content_block_translations(locale, data)');
  if (error) throw new Error(`content query failed: ${error.message}`);
  return rowsToContentBlocks((data ?? []) as unknown as DbContentBlockRow[]);
}

let loader: (() => Promise<ContentBlocks>) | null | undefined;

function getLoader() {
  if (loader !== undefined) return loader;
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !anonKey) return (loader = null);
  const client = createClient(url, anonKey, { auth: { persistSession: false, autoRefreshToken: false } });
  loader = unstable_cache(() => fetchContentBlocks(client), ['content-blocks'], { tags: [CONTENT_TAG] });
  return loader;
}

/** The owner's marketing-copy overrides, or none if Supabase isn't configured or is unreachable. */
export async function loadContentBlocks(): Promise<ContentBlocks> {
  const load = getLoader();
  if (!load) return {};
  try {
    return await load();
  } catch (error) {
    console.error('[content] database unavailable, using the shipped copy', error);
    return {};
  }
}
