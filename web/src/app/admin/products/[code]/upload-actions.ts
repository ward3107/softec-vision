'use server';

import { updateTag, revalidatePath } from 'next/cache';
import { getAdminStrings } from '@/lib/admin/locale';
import { requireStaff } from '@/lib/admin/session';
import { UPLOAD_CONFIG, UPLOAD_KINDS, uploadExtension, uploadMime, isVideo, type UploadKind } from '@/lib/admin/upload';
import { sanitizeCodeForPath } from '@/lib/catalog/media';
import { sniffType, isGlb } from '@/lib/inquiry/attachment';

export async function prepareUpload(code: string, kind: UploadKind, name: string) {
  const { client } = await requireStaff();
  const S = await getAdminStrings();
  if (!UPLOAD_KINDS.includes(kind)) return { error: S.workflow.uploadType };
  const ext = uploadExtension(kind, name);
  if (!ext) return { error: S.workflow.uploadType };
  const { data: product, error } = await client.from('products').select('id').eq('code', code).maybeSingle();
  if (error || !product) return { error: S.workflow.saveFailed };
  const path = `${sanitizeCodeForPath(code)}/${kind}-${crypto.randomUUID()}.${ext}`;
  const bucket = UPLOAD_CONFIG[kind].bucket;
  const signed = await client.storage.from(bucket).createSignedUploadUrl(path);
  if (signed.error || !signed.data) return { error: S.workflow.uploadFailed };
  return { path, bucket, token: signed.data.token };
}

export async function finishUpload(code: string, kind: UploadKind, path: string) {
  const { client } = await requireStaff();
  const S = await getAdminStrings();
  if (!UPLOAD_KINDS.includes(kind)) return { error: S.workflow.uploadType };
  const prefix = `${sanitizeCodeForPath(code)}/${kind}-`;
  const suffix = path.slice(prefix.length);
  if (!path.startsWith(prefix) || !/^[0-9a-f-]{36}\.[a-z0-9]+$/.test(suffix) || !uploadExtension(kind, path)) return { error: S.workflow.uploadInvalid };
  const config = UPLOAD_CONFIG[kind];
  const storage = client.storage.from(config.bucket);
  const { data: file, error } = await storage.download(path);
  if (error || !file) return { error: S.workflow.uploadMissing };
  if (!file.size || file.size > config.max) {
    return { error: S.workflow.uploadType };
  }
  const bytes = new Uint8Array(await file.arrayBuffer());
  const valid = kind === 'model' ? isGlb(bytes) : kind === 'video'
    ? isVideo(bytes, path.split('.').pop()!)
    : sniffType(bytes) === uploadMime(kind, path);
  if (!valid) {
    return { error: S.workflow.uploadInvalid };
  }
  const saved = await client.rpc('attach_product_media', { p_code: code, p_kind: kind, p_path: path });
  if (saved.error) {
    return { error: S.workflow.saveFailed };
  }
  // Database triggers retain detached paths for review. Never delete stored files here.
  updateTag('catalog');
  revalidatePath(`/admin/products/${code}`);
  return { saved: true };
}
