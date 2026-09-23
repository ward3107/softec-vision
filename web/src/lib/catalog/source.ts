import 'server-only';
import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import { unstable_cache } from 'next/cache';
import { PRODUCT_SELECT, rowsToProducts, type DbProductRow } from './db';
import { PRODUCTS } from './seed';
import type { Product } from './types';

/** Cache tag the admin revalidates after changing products. */
export const CATALOG_TAG = 'catalog';

/**
 * Published products from Supabase, or null while the catalog has not been
 * imported yet (the site then keeps using the built-in catalog).
 */
export async function fetchManagedProducts(
  client: SupabaseClient,
  builtIn: Product[],
  supabaseUrl?: string
): Promise<Product[] | null> {
  const { data, error } = await client.from('products').select(PRODUCT_SELECT).eq('status', 'published').order('sort');
  if (error) throw new Error(`catalog query failed: ${error.message}`);
  const rows = (data ?? []) as unknown as DbProductRow[];
  if (rows.length === 0) {
    const { data: managed, error: rpcError } = await client.rpc('catalog_is_managed');
    if (rpcError) throw new Error(`catalog check failed: ${rpcError.message}`);
    if (!managed) return null;
  }
  return rowsToProducts(rows, builtIn, undefined, supabaseUrl);
}

/** Pick the catalog to show; a database outage never takes the site down. */
export async function resolveProducts(
  loadManaged: (() => Promise<Product[] | null>) | null,
  builtIn: Product[]
): Promise<Product[]> {
  if (!loadManaged) return builtIn;
  try {
    return (await loadManaged()) ?? builtIn;
  } catch (error) {
    console.error('[catalog] database unavailable, showing the built-in catalog', error);
    return builtIn;
  }
}

let managedLoader: (() => Promise<Product[] | null>) | null | undefined;

function getManagedLoader() {
  if (managedLoader !== undefined) return managedLoader;
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !anonKey) return (managedLoader = null);
  // Public (anon) access: Row Level Security returns published products only.
  const client = createClient(url, anonKey, { auth: { persistSession: false, autoRefreshToken: false } });
  // Errors are thrown, not cached, so the next request retries the database.
  managedLoader = unstable_cache(() => fetchManagedProducts(client, PRODUCTS, url), ['catalog-products'], {
    tags: [CATALOG_TAG]
  });
  return managedLoader;
}

/** Every product the public site may show (all categories, all locales). */
export function loadProducts(): Promise<Product[]> {
  return resolveProducts(getManagedLoader(), PRODUCTS);
}
