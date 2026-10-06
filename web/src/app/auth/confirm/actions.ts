'use server';

import { redirect } from 'next/navigation';
import { createUserClient, isSupabaseConfigured } from '@/lib/admin/session';

/**
 * Redeem a Supabase token hash only after the recipient explicitly submits
 * the confirmation form. Email security scanners can safely GET the page
 * without consuming the one-time token.
 */
export async function confirmMagicLink(formData: FormData) {
  if (!isSupabaseConfigured()) redirect('/admin/login?error=auth-callback');

  const tokenHash = String(formData.get('token_hash') ?? '').trim();
  const type = String(formData.get('type') ?? '');
  if (!tokenHash || type !== 'email') {
    redirect('/admin/login?error=auth-callback');
  }

  const supabase = await createUserClient();
  const { error } = await supabase.auth.verifyOtp({
    token_hash: tokenHash,
    type: 'email'
  });

  if (error) redirect('/admin/login?error=auth-callback');
  redirect('/admin');
}
