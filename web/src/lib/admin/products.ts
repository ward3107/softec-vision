import 'server-only';
import type { SupabaseClient } from '@supabase/supabase-js';
import { buildImportPayload, PRODUCT_SELECT, rowsToProducts, type DbProductRow } from '@/lib/catalog/db';
import { CATEGORIES, PRODUCTS, SPEC_LABELS } from '@/lib/catalog/seed';
import { isPlaceholder, type Product } from '@/lib/catalog/types';
import type { AdminProductDetail, AdminProductRow, ParsedProductForm, ProductStatus } from './productForm';

export * from './productForm';

/**
 * The full product list for the admin (drafts and archived included), read
 * from the same rows the public site uses. Falls back to the built-in
 * catalog before the database has been imported.
 */
export async function listAdminProducts(client: SupabaseClient, locale: 'he' | 'en' = 'he'): Promise<AdminProductRow[]> {
  const { data, error } = await client
    .from('products')
    .select(`${PRODUCT_SELECT}, status`)
    .order('sort');
  if (error) throw new Error(error.message);
  const rows = (data ?? []) as unknown as Array<DbProductRow & { status: ProductStatus }>;

  if (rows.length === 0) {
    return PRODUCTS.map((product) => ({
      code: product.code,
      status: 'published',
      category: product.cat,
      name: product.name[locale],
      missing: product.specs.filter((s) => isPlaceholder(s.value.he) || isPlaceholder(s.value.en)).map((s) => s.key)
    }));
  }

  const known = new Set(Object.keys(SPEC_LABELS));
  return rows.map((row) => {
    const t = row.product_translations.find((tr) => tr.locale === locale) ?? row.product_translations[0];
    const filled = new Set(
      row.product_specs
        .filter((s) => s.spec_field && s.value_translations?.he?.trim() && s.value_translations?.en?.trim())
        .map((s) => s.spec_field!.key)
    );
    return {
      code: row.code,
      status: row.status,
      category: row.category?.slug ?? '',
      name: t?.name ?? row.code,
      missing: [...known].filter((key) => !filled.has(key))
    };
  });
}

/** One product for the edit form, with every canonical spec key present (blank if unset). */
export async function getAdminProduct(client: SupabaseClient, code: string): Promise<AdminProductDetail | null> {
  const { data, error } = await client
    .from('products')
    .select(`${PRODUCT_SELECT}, status`)
    .eq('code', code)
    .maybeSingle();
  if (error) throw new Error(error.message);

  if (!data) {
    const product = PRODUCTS.find((p) => p.code === code);
    if (!product) return null;
    const specs = Object.fromEntries(Object.keys(SPEC_LABELS).map((key) => [key, { he: '', en: '' }]));
    for (const spec of product.specs) if (!isPlaceholder(spec.value.he) && !isPlaceholder(spec.value.en)) specs[spec.key] = spec.value;
    return {
      code: product.code,
      status: 'published',
      cat: product.cat,
      sub: product.sub ?? null,
      translations: {
        he: { name: product.name.he, description: product.desc.he, alt_text: product.imageAlt?.he ?? '' },
        en: { name: product.name.en, description: product.desc.en, alt_text: product.imageAlt?.en ?? '' }
      },
      specs
    };
  }

  const row = data as unknown as DbProductRow & { status: ProductStatus };
  const he = row.product_translations.find((t) => t.locale === 'he');
  const en = row.product_translations.find((t) => t.locale === 'en');
  const specs = Object.fromEntries(Object.keys(SPEC_LABELS).map((key) => [key, { he: '', en: '' }]));
  for (const spec of row.product_specs) {
    if (spec.spec_field && specs[spec.spec_field.key]) {
      specs[spec.spec_field.key] = { he: spec.value_translations?.he ?? '', en: spec.value_translations?.en ?? '' };
    }
  }
  return {
    code: row.code,
    status: row.status,
    cat: row.category?.slug ?? '',
    sub: row.sub?.slug ?? null,
    translations: {
      he: { name: he?.name ?? '', description: he?.description ?? '', alt_text: he?.alt_text ?? '' },
      en: { name: en?.name ?? '', description: en?.description ?? '', alt_text: en?.alt_text ?? '' }
    },
    specs
  };
}

/** Save one product's editable fields (RLS: any staff member). */
export async function saveProduct(client: SupabaseClient, code: string, form: ParsedProductForm): Promise<void> {
  const { error } = await client.rpc('save_product', {
    p_code: code,
    p_status: form.status,
    p_translations: form.translations,
    p_specs: form.specs
  });
  if (error) throw new Error(error.message);
}

/** Whether the catalog has been imported into Supabase yet. */
export async function isCatalogManaged(client: SupabaseClient): Promise<boolean> {
  const { data, error } = await client.rpc('catalog_is_managed');
  if (error) throw new Error(error.message);
  return Boolean(data);
}

/** One-time import of the built-in catalog into Supabase (RLS: admin only). */
export async function importBuiltInCatalog(client: SupabaseClient): Promise<number> {
  const payload = buildImportPayload(CATEGORIES, PRODUCTS, SPEC_LABELS);
  const { data, error } = await client.rpc('import_catalog', { payload });
  if (error) throw new Error(error.message);
  return (data as number) ?? 0;
}

export const CANONICAL_SPEC_KEYS = Object.keys(SPEC_LABELS);
export type { Product };
