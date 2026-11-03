'use server';

import { updateTag, revalidatePath } from 'next/cache';
import { requireStaff } from '@/lib/admin/session';
import { UPLOAD_CONFIG, UPLOAD_KINDS, uploadExtension, uploadMime, isVideo, type UploadKind } from '@/lib/admin/upload';
import { sanitizeCodeForPath } from '@/lib/catalog/media';
import { sniffType, isGlb } from '@/lib/inquiry/attachment';

export async function prepareUpload(code: string, kind: UploadKind, name: string) {
  const { client } = await requireStaff();
  if (!UPLOAD_KINDS.includes(kind)) return { error: 'סוג מדיה לא תקין.' };
  const ext = uploadExtension(kind, name);
  if (!ext) return { error: 'סוג הקובץ אינו נתמך.' };
  const { data: product, error } = await client.from('products').select('id').eq('code', code).maybeSingle();
  if (error || !product) return { error: 'המוצר לא נמצא. רעננו את העמוד.' };
  const path = `${sanitizeCodeForPath(code)}/${kind}-${crypto.randomUUID()}.${ext}`;
  const bucket = UPLOAD_CONFIG[kind].bucket;
  const signed = await client.storage.from(bucket).createSignedUploadUrl(path);
  if (signed.error || !signed.data) return { error: 'לא ניתן להתחיל העלאה. בדקו את החיבור ונסו שוב.' };
  return { path, bucket, token: signed.data.token };
}

export async function finishUpload(code: string, kind: UploadKind, path: string) {
  const { client } = await requireStaff();
  if (!UPLOAD_KINDS.includes(kind)) return { error: 'סוג מדיה לא תקין.' };
  const prefix = `${sanitizeCodeForPath(code)}/${kind}-`;
  const suffix = path.slice(prefix.length);
  if (!path.startsWith(prefix) || !/^[0-9a-f-]{36}\.[a-z0-9]+$/.test(suffix) || !uploadExtension(kind, path)) return { error: 'קובץ לא תקין.' };
  const config = UPLOAD_CONFIG[kind];
  const storage = client.storage.from(config.bucket);
  const { data: file, error } = await storage.download(path);
  if (error || !file) return { error: 'הקובץ לא התקבל. נסו להעלות אותו שוב.' };
  if (!file.size || file.size > config.max) {
    await storage.remove([path]);
    return { error: 'גודל הקובץ אינו תקין.' };
  }
  const bytes = new Uint8Array(await file.arrayBuffer());
  const valid = kind === 'model' ? isGlb(bytes) : kind === 'video'
    ? isVideo(bytes, path.split('.').pop()!)
    : sniffType(bytes) === uploadMime(kind, path);
  if (!valid) {
    await storage.remove([path]);
    return { error: 'תוכן הקובץ אינו תואם לסוג המדיה שנבחר.' };
  }
  const saved = await client.rpc('attach_product_media', { p_code: code, p_kind: kind, p_path: path });
  if (saved.error) {
    return { error: 'שמירת המדיה נכשלה. נסו שוב.' };
  }
  // The row is committed before old files are cleaned up, so failed cleanup cannot break the product.
  const oldPaths = (saved.data ?? []) as string[];
  if (oldPaths.length) {
    const cleanup = await storage.remove(oldPaths);
    if (cleanup.error) console.error('[media] old upload cleanup failed', cleanup.error.message);
  }
  updateTag('catalog');
  revalidatePath(`/admin/products/${code}`);
  return { saved: true };
}
