import Link from 'next/link';
import { S } from '@/lib/admin/strings';
import { signOut } from './actions';

/** Page frame for signed-in admin pages. */
export default function AdminShell({
  email,
  active,
  children
}: {
  email?: string | null;
  active: 'inquiries' | 'products';
  children: React.ReactNode;
}) {
  const tab = (key: 'inquiries' | 'products', href: string) => (
    <Link
      href={href}
      aria-current={active === key ? 'page' : undefined}
      className={`inline-flex min-h-[44px] items-center border-b-2 px-2 font-semibold ${
        active === key ? 'border-blueprint text-blueprint' : 'border-transparent text-graphite hover:text-blueprint'
      }`}
    >
      {S.nav[key]}
    </Link>
  );
  return (
    <>
      <header className="border-b border-line bg-pure">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center gap-x-6 gap-y-2 px-5 py-3">
          <p className="font-extrabold">
            {S.brand} <span className="font-semibold text-machine">— {S.appTitle}</span>
          </p>
          <nav aria-label={S.appTitle} className="flex gap-4">
            {tab('inquiries', '/admin')}
            {tab('products', '/admin/products')}
          </nav>
          <div className="ms-auto flex flex-wrap items-center gap-3 text-sm">
            {email && (
              <span className="text-machine">
                {S.signedInAs}
                <span dir="ltr">{email}</span>
              </span>
            )}
            <Link href="/he" className="min-h-[44px] content-center font-semibold text-blueprint hover:underline">
              {S.nav.site}
            </Link>
            <form action={signOut}>
              <button type="submit" className="min-h-[44px] rounded border border-line px-3 font-semibold hover:border-machine">
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
