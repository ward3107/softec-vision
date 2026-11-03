import 'server-only';
import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import { unstable_cache } from 'next/cache';
import { CATEGORIES } from './seed';
import type { Category } from './types';
import type { AppLocale } from '@/i18n/routing';

export type CategoryRow = {
  id: string;
  slug: string;
  parent_id: string | null;
  status: 'draft' | 'published' | 'archived';
  sort: number;
  visible_in: AppLocale[];
  category_translations: Array<{ locale: string; name: string; description: string }>;
};

export async function listCategories(client: SupabaseClient): Promise<CategoryRow[]> {
  const { data, error } = await client.from('categories')
    .select('id,slug,parent_id,status,sort,visible_in,category_translations(locale,name,description)')
    .order('sort').order('slug');
  if (error) throw new Error(error.message);
  return data ?? [];
}

export function categoryRowsToCatalog(rows: CategoryRow[]): Category[] {
  const text = (row: CategoryRow, field: 'name' | 'description') => ({
    he: row.category_translations.find(t => t.locale === 'he')?.[field] ?? '',
    en: row.category_translations.find(t => t.locale === 'en')?.[field] ?? ''
  });
  const published = rows.filter(row => row.status === 'published');
  return published.filter(row => !row.parent_id).map(row => ({
    key: row.slug,
    label: text(row, 'name'),
    description: text(row, 'description'),
    visibleIn: row.visible_in,
    subs: published.filter(sub => sub.parent_id === row.id).map(sub => ({ key: sub.slug, label: text(sub, 'name') }))
  }));
}

const fetchCategories = unstable_cache(async () => {
  const client = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!, {
    auth: { persistSession: false, autoRefreshToken: false }
  });
  const rows = await listCategories(client);
  const { data: managed, error } = await client.rpc('catalog_is_managed');
  if (error) throw new Error(error.message);
  return rows.length || managed ? categoryRowsToCatalog(rows) : CATEGORIES;
}, ['catalog-categories'], { tags: ['catalog'] });

export async function loadCategories(): Promise<Category[]> {
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) return CATEGORIES;
  try { return await fetchCategories(); }
  catch (error) {
    console.error('[catalog] categories unavailable', error);
    return [];
  }
}
