import type { ReactElement } from 'react';
import Link from 'next/link';
import { countInquiries } from '@/lib/admin/inquiries';
import { isCatalogManaged, listAdminProducts } from '@/lib/admin/products';
import { listAdminContentBlocks } from '@/lib/admin/content';
import { requireStaff } from '@/lib/admin/session';
import { S } from '@/lib/admin/strings';
import { AdminIcons } from './icons';

export const dynamic = 'force-dynamic';

type Accent = 'blue' | 'emerald' | 'indigo';

// Each dashboard card owns a colour so the three sections read apart at a glance.
const ACCENTS: Record<Accent, { bar: string; chip: string; link: string; hover: string }> = {
  blue: {
    bar: 'bg-softec',
    chip: 'bg-softec/12 text-blueprint dark:bg-softec/20 dark:text-skyline',
    link: 'text-blueprint dark:text-skyline',
    hover: 'hover:border-softec/60'
  },
  emerald: {
    bar: 'bg-emerald-500',
    chip: 'bg-emerald-500/12 text-emerald-700 dark:bg-emerald-400/15 dark:text-emerald-300',
    link: 'text-emerald-700 dark:text-emerald-300',
    hover: 'hover:border-emerald-500/60'
  },
  indigo: {
    bar: 'bg-indigo-500',
    chip: 'bg-indigo-500/12 text-indigo-700 dark:bg-indigo-400/15 dark:text-indigo-300',
    link: 'text-indigo-700 dark:text-indigo-300',
    hover: 'hover:border-indigo-500/60'
  }
};

function Card({
  href,
  title,
  icon,
  accent,
  children
}: {
  href: string;
  title: string;
  icon: ReactElement;
  accent: Accent;
  children: React.ReactNode;
}) {
  const a = ACCENTS[accent];
  return (
    <Link
      href={href}
      className={`group relative block overflow-hidden rounded-xl border border-line bg-pure p-5 transition-all hover:-translate-y-0.5 hover:shadow-[0_18px_40px_-24px_rgba(21,23,25,0.45)] ${a.hover} dark:border-white/10 dark:bg-surface`}
    >
      <span className={`absolute inset-x-0 top-0 h-1 ${a.bar}`} aria-hidden="true" />
      <div className="flex items-center gap-3">
        <span className={`grid h-10 w-10 flex-none place-items-center rounded-lg ${a.chip}`}>{icon}</span>
        <h2 className="text-sm font-bold uppercase tracking-[0.06em] text-machine dark:text-fog">{title}</h2>
      </div>
      <div className="mt-4">{children}</div>
      <p className={`mt-4 text-sm font-semibold ${a.link}`}>{S.dashboard.goTo}</p>
    </Link>
  );
}

const chip = 'inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-bold';

export default async function AdminDashboardPage({
  searchParams
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const { error } = await searchParams;
  const { client } = await requireStaff();

  const [inquiries, products, managed, contentBlocks] = await Promise.all([
    countInquiries(client),
    listAdminProducts(client),
    isCatalogManaged(client),
    listAdminContentBlocks(client)
  ]);

  const missingSpecCount = products.filter((p) => p.missing.length > 0).length;
  const editedBlockCount = contentBlocks.filter((b) =>
    Object.values(b.values.he).some((v) => v.trim()) || Object.values(b.values.en).some((v) => v.trim())
  ).length;

  return (
    <>
      <h1 className="text-2xl font-extrabold">{S.dashboard.title}</h1>
      <p className="mt-1 text-machine dark:text-fog">{S.dashboard.welcome}</p>

      {error === 'admin-only' && (
        <p
          role="alert"
          className="mt-4 rounded border-2 border-red-700 bg-pure p-3 text-sm font-semibold text-red-700 dark:border-red-400 dark:bg-surface dark:text-red-400"
        >
          {S.errors['admin-only']}
        </p>
      )}

      <div className="mt-6 grid gap-4 sm:grid-cols-3">
        <Card href="/admin/inquiries" title={S.dashboard.inquiriesCard} icon={AdminIcons.inquiries} accent="blue">
          {inquiries.total === 0 ? (
            <p className="text-machine dark:text-fog">{S.dashboard.noInquiries}</p>
          ) : (
            <>
              <p className="text-4xl font-extrabold leading-none text-graphite dark:text-ink">
                {S.dashboard.newInquiries(inquiries.new)}
              </p>
              <p className="mt-2 text-sm text-machine dark:text-fog">{S.dashboard.totalInquiries(inquiries.total)}</p>
            </>
          )}
        </Card>

        <Card href="/admin/products" title={S.dashboard.productsCard} icon={AdminIcons.products} accent="emerald">
          <p className="text-4xl font-extrabold leading-none text-graphite dark:text-ink">
            {S.dashboard.totalProducts(products.length)}
          </p>
          <p className="mt-3">
            {missingSpecCount > 0 ? (
              <span className={`${chip} bg-amber-500/15 text-amber-700 dark:bg-amber-400/15 dark:text-amber-300`}>
                {S.dashboard.missingSpecs(missingSpecCount)}
              </span>
            ) : (
              <span className={`${chip} bg-emerald-500/15 text-emerald-700 dark:bg-emerald-400/15 dark:text-emerald-300`}>
                {S.dashboard.completeSpecs}
              </span>
            )}
          </p>
          <p className="mt-2 text-xs text-machine dark:text-fog">
            {managed ? S.dashboard.catalogManaged : S.dashboard.catalogNotManaged}
          </p>
        </Card>

        <Card href="/admin/content" title={S.dashboard.contentCard} icon={AdminIcons.content} accent="indigo">
          <p className="text-4xl font-extrabold leading-none text-graphite dark:text-ink">
            {editedBlockCount}
            <span className="text-2xl text-machine dark:text-fog">/{contentBlocks.length}</span>
          </p>
          <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-line" aria-hidden="true">
            <div
              className="h-full rounded-full bg-indigo-500 transition-all"
              style={{ width: `${contentBlocks.length ? Math.round((editedBlockCount / contentBlocks.length) * 100) : 0}%` }}
            />
          </div>
          <p className="mt-2 text-sm text-machine dark:text-fog">
            {S.dashboard.contentEdited(editedBlockCount, contentBlocks.length)}
          </p>
        </Card>
      </div>
    </>
  );
}
