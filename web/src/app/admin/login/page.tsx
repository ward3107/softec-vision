import { redirect } from 'next/navigation';
import { getAdminContext, isSupabaseConfigured } from '@/lib/admin/session';
import { S } from '@/lib/admin/strings';
import AdminAuth from './AdminAuth';

export const dynamic = 'force-dynamic';

export default async function AdminLoginPage({ searchParams }: { searchParams: Promise<{ error?: string }> }) {
  const { error } = await searchParams;
  const configured = isSupabaseConfigured();
  if (configured) {
    const { access } = await getAdminContext();
    if (access === 'admin' || access === 'editor') redirect('/admin');
  }

  return (
    <main id="main" className="mx-auto grid min-h-screen max-w-sm content-center px-5 py-12">
      <p className="text-sm font-bold text-blueprint dark:text-skyline">{S.brand}</p>
      <h1 className="mt-1 text-2xl font-extrabold">{S.signInTitle}</h1>
      <div className="mt-6 rounded border border-line bg-pure p-6 dark:border-white/10 dark:bg-surface">
        {configured ? (
          <AdminAuth initialError={error === 'no-access' ? 'no-access' : undefined} />
        ) : (
          <p role="status" className="text-sm">
            {S.errors.notConfigured}
          </p>
        )}
      </div>
    </main>
  );
}
