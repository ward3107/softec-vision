import Link from 'next/link';
import { countInquiries } from '@/lib/admin/inquiries';
import { isCatalogManaged, listAdminProducts } from '@/lib/admin/products';
import { listAdminContentBlocks } from '@/lib/admin/content';
import { requireStaff } from '@/lib/admin/session';
import { S } from '@/lib/admin/strings';
import AdminShell from './AdminShell';

export const dynamic = 'force-dynamic';

function Card({
  href,
  title,
  children
}: {
  href: string;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <Link
      href={href}
      className="block rounded border border-line bg-pure p-5 hover:border-blueprint dark:border-white/10 dark:bg-surface dark:hover:border-skyline"
    >
      <h2 className="text-sm font-bold uppercase tracking-[0.06em] text-machine dark:text-fog">{title}</h2>
      <div className="mt-2">{children}</div>
      <p className="mt-3 text-sm font-semibold text-blueprint dark:text-skyline">{S.dashboard.goTo}</p>
    </Link>
  );
}

export default async function AdminDashboardPage({
  searchParams
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const { error } = await searchParams;
  const { client, user } = await requireStaff();

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
    <AdminShell email={user?.email} active="dashboard">
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
        <Card href="/admin/inquiries" title={S.dashboard.inquiriesCard}>
          {inquiries.total === 0 ? (
            <p className="text-machine dark:text-fog">{S.dashboard.noInquiries}</p>
          ) : (
            <>
              <p className="text-3xl font-extrabold">{S.dashboard.newInquiries(inquiries.new)}</p>
              <p className="text-sm text-machine dark:text-fog">{S.dashboard.totalInquiries(inquiries.total)}</p>
            </>
          )}
        </Card>

        <Card href="/admin/products" title={S.dashboard.productsCard}>
          <p className="text-3xl font-extrabold">{S.dashboard.totalProducts(products.length)}</p>
          <p className="text-sm text-machine dark:text-fog">
            {missingSpecCount > 0 ? S.dashboard.missingSpecs(missingSpecCount) : S.dashboard.completeSpecs}
          </p>
          <p className="mt-1 text-xs text-machine dark:text-fog">
            {managed ? S.dashboard.catalogManaged : S.dashboard.catalogNotManaged}
          </p>
        </Card>

        <Card href="/admin/content" title={S.dashboard.contentCard}>
          <p className="text-3xl font-extrabold">
            {editedBlockCount}/{contentBlocks.length}
          </p>
          <p className="text-sm text-machine dark:text-fog">{S.dashboard.contentEdited(editedBlockCount, contentBlocks.length)}</p>
        </Card>
      </div>
    </AdminShell>
  );
}
