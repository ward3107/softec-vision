'use client';

import { useEffect } from 'react';
import { createBrowserClient } from '@supabase/ssr';
import { handleRecoveryFragment } from '@/lib/admin/recovery';

export default function PasswordRecoveryBridge() {
  useEffect(() => {
    void handleRecoveryFragment(
      window.location.hash,
      () => window.history.replaceState(window.history.state, '', window.location.pathname + window.location.search),
      async (session) => {
        const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
        const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
        if (!url || !key) throw new Error('Auth not configured');
        const client = createBrowserClient(url, key, { auth: { detectSessionInUrl: false } });
        return client.auth.setSession(session);
      },
      (path) => window.location.replace(path)
    );
  }, []);
  return null;
}
