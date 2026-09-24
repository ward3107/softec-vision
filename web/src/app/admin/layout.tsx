import type { Metadata } from 'next';
import { Assistant } from 'next/font/google';
import { getAdminContext, isSupabaseConfigured } from '@/lib/admin/session';
import AdminShell from './AdminShell';
import '../globals.css';

const assistant = Assistant({
  subsets: ['latin', 'hebrew'],
  weight: ['400', '600', '700', '800'],
  display: 'swap',
  variable: '--font-assistant'
});

export const metadata: Metadata = {
  title: 'ניהול — Softec Vision',
  robots: { index: false, follow: false }
};

const BOOT_SCRIPT = `(function(){try{
  var theme=localStorage.getItem('softec-theme');
  if(theme==='dark'){
    document.documentElement.classList.add('dark');
  }
}catch(e){}})();`;

/**
 * Separate root layout: the owner admin shares no public chrome and is never
 * indexed. The persistent nav shell is rendered here (once) for signed-in
 * staff, so section-to-section navigation only swaps the page content; login
 * and the not-configured state render bare.
 */
export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  let authed = false;
  let email: string | null | undefined;
  if (isSupabaseConfigured()) {
    const { access, user } = await getAdminContext();
    if (access === 'admin' || access === 'editor') {
      authed = true;
      email = user?.email;
    }
  }

  return (
    <html lang="he" dir="rtl" className={assistant.variable} suppressHydrationWarning>
      <body
        className="min-h-screen bg-paper font-sans text-graphite antialiased dark:bg-canvas dark:text-ink"
        suppressHydrationWarning
      >
        <script dangerouslySetInnerHTML={{ __html: BOOT_SCRIPT }} />
        {authed ? <AdminShell email={email}>{children}</AdminShell> : children}
      </body>
    </html>
  );
}
