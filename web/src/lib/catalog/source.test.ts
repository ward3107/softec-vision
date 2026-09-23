import { describe, expect, it, vi } from 'vitest';
import type { DbProductRow } from './db';
import { fetchManagedProducts, resolveProducts } from './source';
import type { Product } from './types';

const builtIn: Product[] = [
  {
    code: 'A-1',
    cat: 'podium',
    name: { he: 'א', en: 'A' },
    desc: { he: 'ת', en: 'D' },
    image: '/products/a.jpg',
    specs: []
  }
];

const dbRow: DbProductRow = {
  code: 'A-1',
  sort: 0,
  model_3d_url: null,
  category: { slug: 'podium' },
  sub: null,
  product_translations: [
    { locale: 'he', name: 'א מעודכן', description: 'ת', alt_text: '' },
    { locale: 'en', name: 'A updated', description: 'D', alt_text: '' }
  ],
  product_specs: []
};

/** Minimal stand-in for the supabase-js query builder used by the loader. */
function fakeClient(result: { data: unknown; error: unknown }, managed: { data: unknown; error: unknown }) {
  const query = {
    select: vi.fn(() => query),
    eq: vi.fn(() => query),
    order: vi.fn(() => Promise.resolve(result))
  };
  return {
    from: vi.fn(() => query),
    rpc: vi.fn(() => Promise.resolve(managed)),
    query
  };
}

describe('fetchManagedProducts', () => {
  it('reads published products in catalog order', async () => {
    const client = fakeClient({ data: [dbRow], error: null }, { data: true, error: null });
    const products = await fetchManagedProducts(client as never, builtIn);
    expect(client.from).toHaveBeenCalledWith('products');
    expect(client.query.eq).toHaveBeenCalledWith('status', 'published');
    expect(client.query.order).toHaveBeenCalledWith('sort');
    expect(products?.map((p) => p.name.en)).toEqual(['A updated']);
    expect(client.rpc).not.toHaveBeenCalled();
  });

  it('returns null before the catalog has been imported', async () => {
    const client = fakeClient({ data: [], error: null }, { data: false, error: null });
    expect(await fetchManagedProducts(client as never, builtIn)).toBeNull();
    expect(client.rpc).toHaveBeenCalledWith('catalog_is_managed');
  });

  it('returns an empty catalog when every product has been unpublished', async () => {
    const client = fakeClient({ data: [], error: null }, { data: true, error: null });
    expect(await fetchManagedProducts(client as never, builtIn)).toEqual([]);
  });

  it('throws on a database error', async () => {
    const client = fakeClient({ data: null, error: { message: 'down' } }, { data: null, error: null });
    await expect(fetchManagedProducts(client as never, builtIn)).rejects.toThrow('down');
  });
});

describe('resolveProducts', () => {
  it('uses the built-in catalog when the database is not configured', async () => {
    expect(await resolveProducts(null, builtIn)).toBe(builtIn);
  });

  it('uses the built-in catalog until the database catalog exists', async () => {
    expect(await resolveProducts(async () => null, builtIn)).toBe(builtIn);
  });

  it('uses the database catalog when it exists, even if empty', async () => {
    expect(await resolveProducts(async () => [], builtIn)).toEqual([]);
  });

  it('falls back to the built-in catalog if the database fails', async () => {
    const log = vi.spyOn(console, 'error').mockImplementation(() => {});
    expect(await resolveProducts(async () => Promise.reject(new Error('timeout')), builtIn)).toBe(builtIn);
    expect(log).toHaveBeenCalled();
    log.mockRestore();
  });
});
