import 'server-only';
import type { SupabaseClient } from '@supabase/supabase-js';
import { sanitizeCodeForPath } from '@/lib/catalog/media';
import { findProductId, type MediaUploadError } from './media';
import { MAX_MODEL_BYTES, MODEL_BUCKET, validGlb } from '@/lib/media/model-policy';

export function modelUploadPrefix(code: string, userId: string) {
  return `${sanitizeCodeForPath(code)}/uploads/${userId}/`;
}

export async function commitModelUpload(client: SupabaseClient, code: string, userId: string, path: string):
  Promise<{ ok: true } | { ok: false; error: MediaUploadError }> {
  const prefix = modelUploadPrefix(code, userId);
  if (!path.startsWith(prefix) || !/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}\.glb$/.test(path.slice(prefix.length))) {
    return { ok: false, error: 'badType' };
  }
  const productId = await findProductId(client, code);
  if (!productId) return { ok: false, error: 'unknownProduct' };
  const { data: product, error: readError } = await client.from('products').select('model_3d_url').eq('id', productId).single();
  if (readError) throw readError;
  const oldPath = product.model_3d_url as string | null;
  // A retry after a lost response must not delete the now-current model.
  if (oldPath === path) return { ok: true };
  const bucket = client.storage.from(MODEL_BUCKET);
  const { data: blob, error: downloadError } = await bucket.download(path);
  if (downloadError || !blob) return { ok: false, error: 'uploadFailed' };
  const invalid: MediaUploadError | null = !blob.size ? 'noFile' : blob.size > MAX_MODEL_BYTES ? 'tooLarge'
    : !validGlb(new Uint8Array(await blob.arrayBuffer())) ? 'badType' : null;
  if (invalid) {
    await bucket.remove([path]);
    return { ok: false, error: invalid };
  }
  const { error } = await client.from('products').update({ model_3d_url: path }).eq('id', productId);
  if (error) throw error;
  if (oldPath) {
    const removed = await bucket.remove([oldPath]);
    if (removed.error) console.error('model_cleanup_failed', { code: removed.error.name });
  }
  return { ok: true };
}
