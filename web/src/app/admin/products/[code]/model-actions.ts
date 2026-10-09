'use server';

import { revalidatePath, revalidateTag } from 'next/cache';
import { requireStaff } from '@/lib/admin/session';
import { findProductId } from '@/lib/admin/media';
import { commitModelUpload, modelUploadPrefix } from '@/lib/admin/model-upload';
import { MAX_MODEL_BYTES, MODEL_BUCKET } from '@/lib/media/model-policy';
import { CATALOG_TAG } from '@/lib/catalog/source';

export async function beginModelUpload(code: string, size: number) {
  const { client, user } = await requireStaff();
  if (!user || !Number.isSafeInteger(size) || size <= 0 || size > MAX_MODEL_BYTES) return { ok: false as const, error: 'tooLarge' as const };
  if (!(await findProductId(client, code))) return { ok: false as const, error: 'unknownProduct' as const };
  const path = `${modelUploadPrefix(code, user.id)}${crypto.randomUUID()}.glb`;
  const { data, error } = await client.storage.from(MODEL_BUCKET).createSignedUploadUrl(path, { upsert: false });
  if (error || !data) return { ok: false as const, error: 'uploadFailed' as const };
  return { ok: true as const, path, token: data.token };
}

export async function finishModelUpload(code: string, path: string) {
  const { client, user } = await requireStaff();
  if (!user || typeof path !== 'string' || path.length > 300) return { ok: false as const, error: 'badType' as const };
  try {
    const result = await commitModelUpload(client, code, user.id, path);
    if (result.ok) {
      revalidateTag(CATALOG_TAG, 'max');
      revalidatePath('/admin/products');
      revalidatePath(`/admin/products/${code}`);
    }
    return result;
  } catch {
    console.error('model_upload_failed');
    return { ok: false as const, error: 'uploadFailed' as const };
  }
}
