import 'server-only';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { createServerClient } from '@supabase/ssr';
import type { SupabaseClient, User } from '@supabase/supabase-js';
import { decideAccess, type Access } from './inquiries';

export const isSupabaseConfigured = () =>
  Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);

/**
 * Supabase client acting as the signed-in owner (anon key + their session
 * cookie). Every admin query runs through this, so Row Level Security — not
 * just this code — decides what they may read and change.
 */
export async function createUserClient(): Promise<SupabaseClient> {
  const cookieStore = await cookies();
  return createServerClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!, {
    cookies: {
      getAll: () => cookieStore.getAll(),
      setAll: (toSet) => {
        try {
          toSet.forEach(({ name, value, options }) => cookieStore.set(name, value, options));
        } catch {
          // Called from a Server Component: the middleware refreshes the session instead.
        }
      }
    }
  });
}

export interface AdminContext {
  access: Access;
  user: User | null;
  client: SupabaseClient;
}

export async function getAdminContext(): Promise<AdminContext> {
  const client = await createUserClient();
  // getUser() verifies the session with the auth server (never trust the cookie alone).
  const {
    data: { user }
  } = await client.auth.getUser();
  if (!user) return { access: 'sign-in', user: null, client };
  const { data: profile } = await client.from('profiles').select('role').eq('id', user.id).maybeSingle();
  return { access: decideAccess(user, profile), user, client };
}

/** For pages and actions: continue only as staff (optionally admin). */
export async function requireStaff({ admin = false } = {}): Promise<AdminContext> {
  if (!isSupabaseConfigured()) redirect('/admin/login');
  const context = await getAdminContext();
  if (context.access === 'sign-in') redirect('/admin/login');
  if (context.access === 'no-access') redirect('/admin/login?error=no-access');
  if (admin && context.access !== 'admin') redirect('/admin?error=admin-only');
  return context;
}
