import { describe, expect, it, vi } from 'vitest';
import type { SupabaseClient } from '@supabase/supabase-js';
import sharp from 'sharp';
import { replacePrimaryImage, addGalleryImage } from './media';

function setup(insertFails = false, productExists = true) {
  const events: string[] = [];
  const upload = vi.fn(async () => { events.push('upload'); return { error: null }; });
  const remove = vi.fn(async () => { events.push('remove-file'); return { error: null }; });
  const client = {
    storage: { from: () => ({ upload, remove }) },
    from: (table: string) => {
      const query = {
        select: () => query, eq: () => query, order: () => query,
        maybeSingle: async () => ({ data: productExists ? { id: 'product' } : null, error: null }),
        limit: async () => ({ data: [{ sort: 2 }], error: null }),
        then: (resolve: (value: unknown) => unknown) => Promise.resolve({ data: table === 'product_media' ? [{ id: 'old-row', storage_path: 'old.webp' }] : [], error: null }).then(resolve),
        insert: async () => { events.push('insert-row'); return { error: insertFails ? new Error('database failure') : null }; },
        delete: () => ({ in: async () => { events.push('delete-row'); return { error: null }; } })
      };
      return query;
    }
  } as unknown as SupabaseClient;
  return { client, events, upload, remove };
}

async function photo() {
  const bytes = await sharp({ create: { width: 100, height: 80, channels: 4, background: '#fff' } }).png().toBuffer();
  return new File([new Uint8Array(bytes)], 'photo.png', { type: 'image/png' });
}

describe('product image storage boundary', () => {
  it('stores a decoded WebP before replacing references to the old image', async () => {
    const { client, events, upload } = setup();
    expect(await replacePrimaryImage(client, 'TEST', await photo())).toEqual({ ok: true });
    expect(events).toEqual(['upload', 'insert-row', 'delete-row', 'remove-file']);
    const [path, bytes, options] = upload.mock.calls[0] as unknown as [string, Uint8Array, { contentType: string }];
    expect(path).toMatch(/\.webp$/);
    expect(options.contentType).toBe('image/webp');
    expect((await sharp(bytes).metadata()).format).toBe('webp');
  });
  it('preserves the current image when its new database row cannot be saved', async () => {
    const { client, events, remove } = setup(true);
    await expect(replacePrimaryImage(client, 'TEST', await photo())).rejects.toThrow('database failure');
    expect(events).not.toContain('delete-row');
    expect((remove.mock.calls as unknown as Array<[string[]]>)[0]?.[0]).not.toEqual(['old.webp']);
  });
  it('cleans a failed gallery insert and prevents upload before catalog import', async () => {
    const failed = setup(true);
    await expect(addGalleryImage(failed.client, 'TEST', await photo())).rejects.toThrow();
    expect(failed.remove).toHaveBeenCalledOnce();
    const missing = setup(false, false);
    expect(await replacePrimaryImage(missing.client, 'TEST', await photo())).toEqual({ ok: false, error: 'unknownProduct' });
    expect(missing.upload).not.toHaveBeenCalled();
  });
});
