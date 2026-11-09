'use server';
import { revalidatePath, updateTag } from 'next/cache';
import { requireStaff } from '@/lib/admin/session';
import { getAdminStrings } from '@/lib/admin/locale';
import { validateExternalMedia } from '@/lib/admin/externalMedia';
import { CATALOG_TAG } from '@/lib/catalog/source';
export type ExternalMediaState = { error?: string; saved?: boolean; url?: string; kind?: string };
export async function saveExternalMedia(code: string, _state: ExternalMediaState, fd: FormData): Promise<ExternalMediaState> {
  const { client } = await requireStaff();
  const S = await getAdminStrings();
  const raw = String(fd.get('url') ?? '');
  const kind = String(fd.get('kind') ?? '');
  const url = validateExternalMedia(kind, raw);
  if (!url) return { error: S.workflow.invalidUrl, url: raw, kind };
  const { error } = await client.rpc('attach_product_external_media', { p_code: code, p_kind: kind, p_url: url });
  if (error) return { error: S.workflow.saveFailed, url: raw, kind };
  updateTag(CATALOG_TAG);
  revalidatePath(`/admin/products/${code}`);
  return { saved: true, url: '', kind };
}
