import Link from 'next/link';
import { isCatalogManaged, listAdminProducts } from '@/lib/admin/products';
import { requireStaff } from '@/lib/admin/session';
import { S } from '@/lib/admin/strings';
import { CATEGORIES } from '@/lib/catalog/seed';
import AdminShell from '../AdminShell';
import { importCatalogAction } from '../actions';

export const dynamic = 'force-dynamic';

const statusBadge: Record<string, string> = {
  draft: 'bg-paper text-graphite border border-line',
  published: 'bg-[#e6f4ea] text-[#14532d]',
  archived: 'bg-paper text-machine border border-line'
};

export default async function AdminProductsPage({
  searchParams
}: {
  searchParams: Promise<{ imported?: string }>;
}) {
  const { imported } = await searchParams;
  const { client, user, access } = await requireStaff();
  const [managed, rows] = await Promise.all([isCatalogManaged(client), listAdminProducts(client)]);

  return (
    <AdminShell email={user?.email} active="products">
      <h1 className="text-2xl font-extrabold">{S.products.title}</h1>

      {imported !== undefined && (
        <p role="status" className="mt-3 rounded border border-line bg-pure p-3 text-sm">
          ✓ {S.products.import.done(Number(imported) || 0)}
        </p>
      )}

      {!managed && access === 'admin' && (
        <section className="mt-4 rounded border-2 border-blueprint bg-pure p-5">
          <h2 className="text-base font-bold">{S.products.import.title}</h2>
          <p className="mt-1 text-sm">{S.products.import.help}</p>
          <form action={importCatalogAction} className="mt-3">
            <button
              type="submit"
              className="inline-flex min-h-[44px] items-center rounded border border-blueprint bg-blueprint px-4 text-sm font-semibold text-pure hover:bg-graphite"
            >
              {S.products.import.button}
            </button>
          </form>
        </section>
      )}
      {!managed && access !== 'admin' && (
        <p className="mt-4 rounded border border-line bg-pure p-3 text-sm text-machine">{S.products.import.help}</p>
      )}

      {rows.length === 0 ? (
        <p className="mt-8 text-machine">{S.products.empty}</p>
      ) : (
        <div className="mt-6 overflow-x-auto rounded border border-line bg-pure" tabIndex={0} role="region" aria-label={S.products.title}>
          <table className="w-full min-w-[640px] border-collapse text-sm">
            <thead>
              <tr className="border-b border-line text-start">
                {[S.products.code, S.products.name, S.products.category, S.products.status, S.products.missing].map((h) => (
                  <th key={h} scope="col" className="px-3 py-3 text-start font-semibold text-machine">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => (
                <tr key={row.code} className="border-b border-line last:border-b-0 hover:bg-paper">
                  <td className="whitespace-nowrap px-3 py-3">
                    <Link href={`/admin/products/${row.code}`} className="font-semibold text-blueprint underline-offset-2 hover:underline" dir="ltr">
                      {row.code}
                    </Link>
                  </td>
                  <td className="px-3 py-3">{row.name}</td>
                  <td className="px-3 py-3">{CATEGORIES.find((c) => c.key === row.category)?.label.he ?? row.category}</td>
                  <td className="px-3 py-3">
                    <span className={`inline-block rounded px-2 py-0.5 text-xs font-bold ${statusBadge[row.status]}`}>
                      {S.products.statuses[row.status]}
                    </span>
                  </td>
                  <td className="px-3 py-3">
                    {row.missing.length === 0 ? (
                      <span className="text-machine">{S.products.complete}</span>
                    ) : (
                      <span className="font-semibold text-[#9a3412]">{S.products.missingCount(row.missing.length)}</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </AdminShell>
  );
}
