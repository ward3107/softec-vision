'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { parseStatusUpdate } from '@/lib/admin/inquiries';
import { createUserClient, isSupabaseConfigured, requireStaff } from '@/lib/admin/session';

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
