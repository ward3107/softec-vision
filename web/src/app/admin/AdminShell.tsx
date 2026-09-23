import Link from 'next/link';
import { S } from '@/lib/admin/strings';
import ThemeToggle from '@/components/ThemeToggle';
import { signOut } from './actions';

/** Page frame for signed-in admin pages. */
export default function AdminShell({
  email,
  active,
  children
}: {
  email?: string | null;
  active: 'inquiries' | 'products' | 'content';
  children: React.ReactNode;
}) {
  const tab = (key: 'inquiries' | 'products' | 'content', href: string) => (
    <Link
      href={href}
      aria-current={active === key ? 'page' : undefined}
      className={`inline-flex min-h-[44px] items-center border-b-2 px-2 font-semibold ${
        active === key
          ? 'border-blueprint text-blueprint dark:border-skyline dark:text-skyline'
          : 'border-transparent text-graphite hover:text-blueprint dark:text-ink dark:hover:text-skyline'
      }`}
    >
      {S.nav[key]}
    </Link>
  );
  return (
    <>
      <header className="border-b border-line bg-pure dark:border-white/10 dark:bg-surface">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center gap-x-6 gap-y-2 px-5 py-3">
          <p className="font-extrabold">
            {S.brand} <span className="font-semibold text-machine dark:text-fog">— {S.appTitle}</span>
          </p>
          <nav aria-label={S.appTitle} className="flex gap-4">
            {tab('inquiries', '/admin')}
            {tab('products', '/admin/products')}
            {tab('content', '/admin/content')}
          </nav>
          <div className="ms-auto flex flex-wrap items-center gap-3 text-sm">
            {email && (
              <span className="text-machine dark:text-fog">
                {S.signedInAs}
                <span dir="ltr">{email}</span>
              </span>
            )}
            <ThemeToggle toLightLabel={S.theme.toLight} toDarkLabel={S.theme.toDark} />
            <Link href="/he" className="min-h-[44px] content-center font-semibold text-blueprint hover:underline dark:text-skyline">
              {S.nav.site}
            </Link>
            <form action={signOut}>
              <button
                type="submit"
                className="min-h-[44px] rounded border border-line px-3 font-semibold hover:border-machine dark:border-white/10 dark:hover:border-white/25"
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
