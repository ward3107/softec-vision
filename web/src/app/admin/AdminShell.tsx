'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { S } from '@/lib/admin/strings';
import ThemeToggle from '@/components/ThemeToggle';
import { signOut } from './actions';
import { AdminIcons, type AdminIconKey } from './icons';

function activeFromPath(pathname: string): AdminIconKey {
  if (pathname.startsWith('/admin/inquiries')) return 'inquiries';
  if (pathname.startsWith('/admin/products')) return 'products';
  if (pathname.startsWith('/admin/content')) return 'content';
  return 'dashboard';
}

/**
 * Persistent frame for the signed-in admin. Rendered once by the admin layout,
 * so navigating between sections swaps only the page content (with the loading
 * skeleton) while this nav stays put — no re-render, no flash.
 */
export default function AdminShell({ email, children }: { email?: string | null; children: React.ReactNode }) {
  const active = activeFromPath(usePathname());
  const tab = (key: AdminIconKey, href: string) => (
    <Link
      href={href}
      aria-current={active === key ? 'page' : undefined}
      className={`inline-flex min-h-[42px] items-center gap-2 rounded-lg px-3 text-sm font-semibold transition-colors ${
        active === key
          ? 'bg-blueprint text-pure shadow-[0_6px_16px_-8px_rgba(12,94,145,0.7)]'
          : 'text-machine hover:bg-paper hover:text-graphite dark:text-fog dark:hover:bg-white/5 dark:hover:text-ink'
      }`}
    >
      {AdminIcons[key]}
      {S.nav[key]}
    </Link>
  );
  return (
    <>
      <header className="border-t-4 border-t-softec border-b border-b-line bg-pure dark:border-b-white/10 dark:bg-surface">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center gap-x-6 gap-y-3 px-5 py-3">
          <p className="text-lg font-extrabold tracking-tight">
            {S.brand} <span className="font-bold text-blueprint dark:text-skyline">— {S.appTitle}</span>
          </p>
          <nav aria-label={S.appTitle} className="flex flex-wrap gap-1.5">
            {tab('dashboard', '/admin')}
            {tab('inquiries', '/admin/inquiries')}
            {tab('products', '/admin/products')}
            {tab('content', '/admin/content')}
          </nav>
          <div className="ms-auto flex flex-wrap items-center gap-3 text-sm">
            {email && (
              <span className="hidden text-machine sm:inline dark:text-fog">
                {S.signedInAs}
                <span dir="ltr" className="font-semibold">
                  {email}
                </span>
              </span>
            )}
            <ThemeToggle toLightLabel={S.theme.toLight} toDarkLabel={S.theme.toDark} />
            <Link
              href="/he"
              className="min-h-[44px] content-center font-semibold text-blueprint hover:underline dark:text-skyline"
            >
              {S.nav.site}
            </Link>
            <form action={signOut}>
              <button
                type="submit"
                className="min-h-[44px] rounded-lg border border-line px-3 font-semibold hover:border-machine dark:border-white/10 dark:hover:border-white/25"
              >
                {S.signOut}
              </button>
            </form>
          </div>
        </div>
      </header>
      <main id="main" className="mx-auto max-w-6xl px-5 py-8">
        {children}
      </main>
    </>
  );
}
