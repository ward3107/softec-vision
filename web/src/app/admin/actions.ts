'use server';

import { revalidatePath, revalidateTag } from 'next/cache';
import { redirect } from 'next/navigation';
import { saveContentBlock } from '@/lib/admin/content';
import { parseStatusUpdate } from '@/lib/admin/inquiries';
import { addGalleryImage, removeGalleryImage, removePrimaryImage, replacePrimaryImage } from '@/lib/admin/media';
import {
  CANONICAL_SPEC_KEYS,
  echoFormValues,
  importBuiltInCatalog,
  parseProductForm,
  saveProduct,
  valuesFromParsedForm
} from '@/lib/admin/products';
import { createUserClient, isSupabaseConfigured, requireStaff } from '@/lib/admin/session';
import { CATALOG_TAG } from '@/lib/catalog/source';
import { parseContentBlockForm, type ContentBlockKey } from '@/lib/content/blocks';
import { CONTENT_TAG } from '@/lib/content/source';

export type SignInState = { error?: 'missing' | 'invalid' | 'notConfigured' };

export async function signIn(_previous: SignInState, fd: FormData): Promise<SignInState> {
  if (!isSupabaseConfigured()) return { error: 'notConfigured' };
  const email = String(fd.get('email') ?? '').trim();
  const password = String(fd.get('password') ?? '');
  if (!email || !password) return { error: 'missing' };
  const client = await createUserClient();
  const { error } = await client.auth.signInWithPassword({ email, password });
  if (error) return { error: 'invalid' };
  redirect('/admin');
}

export async function signOut() {
  if (isSupabaseConfigured()) {
    const client = await createUserClient();
    await client.auth.signOut();
  }
  redirect('/admin/login');
}

export async function setInquiryStatus(fd: FormData) {
  const { client } = await requireStaff();
  const update = parseStatusUpdate(fd);
  if (!update) return;
  const { error } = await client.from('inquiries').update({ status: update.status }).eq('id', update.id);
  if (error) throw new Error(error.message);
  revalidatePath('/admin');
  revalidatePath(`/admin/inquiries/${update.id}`);
}

/** Permanent erasure for privacy requests — admins only (enforced again by RLS). */
export async function eraseInquiry(fd: FormData) {
  const { client } = await requireStaff({ admin: true });
  const id = String(fd.get('id') ?? '');
  if (!/^[0-9a-f-]{36}$/i.test(id) || fd.get('confirm') !== 'on') return;

  const { data: files } = await client.from('inquiry_attachments').select('storage_path').eq('inquiry_id', id);
  const paths = (files ?? []).map((f: { storage_path: string }) => f.storage_path);
  if (paths.length > 0) {
    const removed = await client.storage.from('inquiry-attachments').remove(paths);
    if (removed.error) throw new Error(removed.error.message);
  }
  const { error } = await client.from('inquiries').delete().eq('id', id);
  if (error) throw new Error(error.message);
  revalidatePath('/admin');
  redirect('/admin?erased=1');
}

export type SaveProductState = {
  errors?: Record<string, string>;
  /** What was submitted, echoed back so a rejected form never loses the owner's edits. */
  values?: Record<string, string>;
  saved?: boolean;
};

export async function saveProductAction(
  code: string,
  _previous: SaveProductState,
  fd: FormData
): Promise<SaveProductState> {
  const { client } = await requireStaff();
  const parsed = parseProductForm(fd, CANONICAL_SPEC_KEYS);
  if (!parsed.ok) return { errors: parsed.errors, values: echoFormValues(fd, CANONICAL_SPEC_KEYS) };
  await saveProduct(client, code, parsed.data);
  revalidateTag(CATALOG_TAG);
  revalidatePath('/admin/products');
  revalidatePath(`/admin/products/${code}`);
  return { saved: true, values: valuesFromParsedForm(parsed.data, CANONICAL_SPEC_KEYS) };
}

/** One-time seed of the built-in catalog into Supabase — admins only. */
export async function importCatalogAction() {
  const { client } = await requireStaff({ admin: true });
  const added = await importBuiltInCatalog(client);
  revalidateTag(CATALOG_TAG);
  revalidatePath('/admin/products');
  redirect(`/admin/products?imported=${added}`);
}

function revalidateProductMedia(code: string) {
  revalidateTag(CATALOG_TAG);
  revalidatePath('/admin/products');
  revalidatePath(`/admin/products/${code}`);
}

/** Replaces a product's primary photo — any staff member. */
export async function uploadProductImageAction(code: string, fd: FormData) {
  const { client } = await requireStaff();
  const file = fd.get('file');
  const result = await replacePrimaryImage(client, code, file instanceof File ? file : new File([], ''));
  revalidateProductMedia(code);
  redirect(`/admin/products/${code}?media=${result.ok ? 'updated' : `error-${result.error}`}`);
}

/** Reverts a product's photo back to the built-in catalog image — any staff member. */
export async function removeProductImageAction(code: string) {
  const { client } = await requireStaff();
  await removePrimaryImage(client, code);
  revalidateProductMedia(code);
  redirect(`/admin/products/${code}?media=removed`);
}

/** Adds one photo to a product's gallery — any staff member. */
export async function addGalleryImageAction(code: string, fd: FormData) {
  const { client } = await requireStaff();
  const file = fd.get('file');
  const result = await addGalleryImage(client, code, file instanceof File ? file : new File([], ''));
  revalidateProductMedia(code);
  redirect(`/admin/products/${code}?media=${result.ok ? 'added' : `error-${result.error}`}`);
}

/** Removes one gallery photo — any staff member. */
export async function removeGalleryImageAction(code: string, fd: FormData) {
  const { client } = await requireStaff();
  const mediaId = String(fd.get('mediaId') ?? '');
  if (/^[0-9a-f-]{36}$/i.test(mediaId)) await removeGalleryImage(client, mediaId);
  revalidateProductMedia(code);
  redirect(`/admin/products/${code}?media=removed`);
}

/** Saves one piece of marketing copy (e.g. the homepage hero) — any staff member. A field left blank reverts to the shipped copy. */
export async function saveContentBlockAction(key: ContentBlockKey, fd: FormData) {
  const { client } = await requireStaff();
  const values = parseContentBlockForm(fd, key);
  await saveContentBlock(client, key, values);
  revalidateTag(CONTENT_TAG);
  revalidatePath('/admin/content');
  redirect('/admin/content?saved=1');
}
