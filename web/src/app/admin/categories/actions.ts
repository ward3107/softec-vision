'use server';

import { revalidatePath, updateTag } from 'next/cache';
import { getAdminStrings } from '@/lib/admin/locale';
import { requireStaff } from '@/lib/admin/session';

export type CategoryState = { error?: string; saved?: boolean };

export async function saveSubcategory(_state: CategoryState, fd: FormData): Promise<CategoryState> {
  const S = await getAdminStrings();
  const { client } = await requireStaff();
  const { error } = await client.rpc('save_subcategory', {
    p_id: fd.get('id') || null, p_parent: fd.get('parent'), p_slug: fd.get('slug'),
    p_he: fd.get('he'), p_en: fd.get('en'), p_status: fd.get('status'), p_sort: Number(fd.get('sort'))
  });
  if (error) return { error: S.workflow.categoryFailed };
  updateTag('catalog');
  revalidatePath('/admin/categories');
  revalidatePath('/admin/products');
  return { saved: true };
}

export async function deleteSubcategory(_state: CategoryState, fd: FormData): Promise<CategoryState> {
  const S = await getAdminStrings();
  const { client } = await requireStaff();
  if (fd.get('confirm') !== 'on') return { error: S.workflow.confirmDelete };
  const { error } = await client.rpc('delete_subcategory', { p_id: fd.get('id') });
  if (error) return { error: S.workflow.deleteFailed };
  updateTag('catalog');
  revalidatePath('/admin/categories');
  revalidatePath('/admin/products');
  return { saved: true };
}
