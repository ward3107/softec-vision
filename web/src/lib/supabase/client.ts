import { createClient, type SupabaseClient } from '@supabase/supabase-js';

/**
 * Browser Supabase client using the public anon key. All access is constrained
 * by Row Level Security (public reads see only published rows). Instantiate
 * lazily where needed — not configured until env vars are set (see .env.example).
 */
export function createBrowserClient(): SupabaseClient {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !anonKey) {
    throw new Error('Supabase is not configured yet — set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY.');
  }
  return createClient(url, anonKey);
}
