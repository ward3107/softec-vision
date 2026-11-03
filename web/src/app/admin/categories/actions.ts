'use server';

import { revalidatePath, updateTag } from 'next/cache';
import { requireStaff } from '@/lib/admin/session';

export type CategoryState = { error?: string; saved?: boolean };

export async function saveSubcategory(_state: CategoryState, fd: FormData): Promise<CategoryState> {
  const { client } = await requireStaff();
  const { error } = await client.rpc('save_subcategory', {
    p_id: fd.get('id') || null, p_parent: fd.get('parent'), p_slug: fd.get('slug'),
    p_he: fd.get('he'), p_en: fd.get('en'), p_status: fd.get('status'), p_sort: Number(fd.get('sort'))
  });
  if (error) return { error: 'השמירה נכשלה. בדקו שמות בשתי השפות, מזהה ייחודי וסדר תקין.' };
  updateTag('catalog');
  revalidatePath('/admin/categories');
  revalidatePath('/admin/products');
  return { saved: true };
}

export async function deleteSubcategory(_state: CategoryState, fd: FormData): Promise<CategoryState> {
  const { client } = await requireStaff();
  if (fd.get('confirm') !== 'on') return { error: 'יש לאשר את המחיקה.' };
  const { error } = await client.rpc('delete_subcategory', { p_id: fd.get('id') });
  if (error) return { error: 'המחיקה נכשלה. רעננו ונסו שוב.' };
  updateTag('catalog');
  revalidatePath('/admin/categories');
  revalidatePath('/admin/products');
  return { saved: true };
}
