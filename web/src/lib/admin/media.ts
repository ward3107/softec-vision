import 'server-only';
import type { SupabaseClient } from '@supabase/supabase-js';
import { sanitizeCodeForPath } from '@/lib/catalog/media';
import { sniffType } from '@/lib/inquiry/attachment';

const BUCKET = 'product-media';
const MAX_BYTES = 6 * 1024 * 1024;
const EXT: Record<string, string> = { 'image/jpeg': 'jpg', 'image/png': 'png', 'image/webp': 'webp' };

export type MediaUploadError = 'noFile' | 'tooLarge' | 'badType' | 'unknownProduct';

async function findProductId(client: SupabaseClient, code: string): Promise<string | null> {
  const { data, error } = await client.from('products').select('id').eq('code', code).maybeSingle();
  if (error) throw new Error(error.message);
  return (data as { id: string } | null)?.id ?? null;
}

async function readAndCheck(file: File): Promise<{ ok: true; bytes: Uint8Array; ext: string } | { ok: false; error: MediaUploadError }> {
  if (!file || file.size === 0) return { ok: false, error: 'noFile' };
  if (file.size > MAX_BYTES) return { ok: false, error: 'tooLarge' };
  const bytes = new Uint8Array(await file.arrayBuffer());
  const mime = sniffType(bytes);
  const ext = mime ? EXT[mime] : undefined;
  if (!ext) return { ok: false, error: 'badType' };
  return { ok: true, bytes, ext };
}

async function removeMediaRows(client: SupabaseClient, ids: string[], paths: string[]): Promise<void> {
  if (paths.length > 0) {
    const removed = await client.storage.from(BUCKET).remove(paths);
    if (removed.error) throw new Error(removed.error.message);
  }
  if (ids.length > 0) {
    const { error } = await client.from('product_media').delete().in('id', ids);
    if (error) throw new Error(error.message);
  }
}

/** Replaces the product's primary photo (there is at most one). RLS: any staff member. */
export async function replacePrimaryImage(
  client: SupabaseClient,
  code: string,
  file: File
): Promise<{ ok: true } | { ok: false; error: MediaUploadError }> {
  const checked = await readAndCheck(file);
  if (!checked.ok) return checked;

  const productId = await findProductId(client, code);
  if (!productId) return { ok: false, error: 'unknownProduct' };

  const { data: existing, error: existingError } = await client
    .from('product_media')
    .select('id, storage_path')
    .eq('product_id', productId)
    .eq('kind', 'image');
  if (existingError) throw new Error(existingError.message);
  const old = (existing ?? []) as Array<{ id: string; storage_path: string }>;

  const path = `${sanitizeCodeForPath(code)}/image-${Date.now()}.${checked.ext}`;
  const uploaded = await client.storage.from(BUCKET).upload(path, checked.bytes, {
    contentType: `image/${checked.ext === 'jpg' ? 'jpeg' : checked.ext}`,
    upsert: false
  });
  if (uploaded.error) throw new Error(uploaded.error.message);

  const { error: insertError } = await client
    .from('product_media')
    .insert({ product_id: productId, storage_path: path, kind: 'image', sort: 0 });
  if (insertError) throw new Error(insertError.message);

  await removeMediaRows(
    client,
    old.map((o) => o.id),
    old.map((o) => o.storage_path)
  );
  return { ok: true };
}

/** Reverts to the built-in catalog photo by removing the owner's upload. RLS: any staff member. */
export async function removePrimaryImage(client: SupabaseClient, code: string): Promise<void> {
  const productId = await findProductId(client, code);
  if (!productId) return;
  const { data, error } = await client.from('product_media').select('id, storage_path').eq('product_id', productId).eq('kind', 'image');
  if (error) throw new Error(error.message);
  const rows = (data ?? []) as Array<{ id: string; storage_path: string }>;
  await removeMediaRows(
    client,
    rows.map((r) => r.id),
    rows.map((r) => r.storage_path)
  );
}

/** Adds one photo to the product's gallery. RLS: any staff member. */
export async function addGalleryImage(
  client: SupabaseClient,
  code: string,
  file: File
): Promise<{ ok: true } | { ok: false; error: MediaUploadError }> {
  const checked = await readAndCheck(file);
  if (!checked.ok) return checked;

  const productId = await findProductId(client, code);
  if (!productId) return { ok: false, error: 'unknownProduct' };

  const { data: existing, error: existingError } = await client
    .from('product_media')
    .select('sort')
    .eq('product_id', productId)
    .eq('kind', 'gallery')
    .order('sort', { ascending: false })
    .limit(1);
  if (existingError) throw new Error(existingError.message);
  const nextSort = ((existing as Array<{ sort: number }> | null)?.[0]?.sort ?? -1) + 1;

  const path = `${sanitizeCodeForPath(code)}/gallery-${Date.now()}.${checked.ext}`;
  const uploaded = await client.storage.from(BUCKET).upload(path, checked.bytes, {
    contentType: `image/${checked.ext === 'jpg' ? 'jpeg' : checked.ext}`,
    upsert: false
  });
  if (uploaded.error) throw new Error(uploaded.error.message);

  const { error: insertError } = await client
    .from('product_media')
    .insert({ product_id: productId, storage_path: path, kind: 'gallery', sort: nextSort });
  if (insertError) throw new Error(insertError.message);
  return { ok: true };
}

/** Removes one gallery photo by its product_media row id. RLS: any staff member. */
export async function removeGalleryImage(client: SupabaseClient, mediaId: string): Promise<void> {
  const { data, error } = await client.from('product_media').select('storage_path').eq('id', mediaId).eq('kind', 'gallery').maybeSingle();
  if (error) throw new Error(error.message);
  const row = data as { storage_path: string } | null;
  if (!row) return;
  await removeMediaRows(client, [mediaId], [row.storage_path]);
}

/** A product's current photos, for the admin edit page. */
export async function getProductMedia(
  client: SupabaseClient,
  code: string
): Promise<{ image: { path: string } | null; gallery: Array<{ id: string; path: string }> }> {
  const productId = await findProductId(client, code);
  if (!productId) return { image: null, gallery: [] };
  const { data, error } = await client
    .from('product_media')
    .select('id, storage_path, kind, sort')
    .eq('product_id', productId)
    .order('sort');
  if (error) throw new Error(error.message);
  const rows = (data ?? []) as Array<{ id: string; storage_path: string; kind: 'image' | 'gallery'; sort: number }>;
  const image = rows.find((r) => r.kind === 'image');
  return {
    image: image ? { path: image.storage_path } : null,
    gallery: rows.filter((r) => r.kind === 'gallery').map((r) => ({ id: r.id, path: r.storage_path }))
  };
}
