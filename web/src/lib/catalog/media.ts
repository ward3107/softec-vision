/** Pure helpers for the owner-uploaded product photos (Supabase Storage). No 'server-only': imported by db.ts, which the client-safe admin form also reaches types from. */

const BUCKET = 'product-media';

/** Public URL for a file in the product-media bucket. The bucket is public, so this is a stable, deterministic URL — no signing needed. */
export function publicMediaUrl(supabaseUrl: string, storagePath: string): string {
  return `${supabaseUrl.replace(/\/$/, '')}/storage/v1/object/public/${BUCKET}/${storagePath}`;
}

/** A product code as a Storage path segment: keep only what codes actually contain. */
export function sanitizeCodeForPath(code: string): string {
  const cleaned = code.replace(/[^A-Za-z0-9_-]/g, '');
  if (!cleaned) throw new Error('invalid product code');
  return cleaned;
}
