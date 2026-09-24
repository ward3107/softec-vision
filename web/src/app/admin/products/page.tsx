import Link from 'next/link';
import { isCatalogManaged, listAdminProducts } from '@/lib/admin/products';
import { requireStaff } from '@/lib/admin/session';
import { S } from '@/lib/admin/strings';
import { CATEGORIES } from '@/lib/catalog/seed';
import { importCatalogAction } from '../actions';

export const dynamic = 'force-dynamic';

const statusBadge: Record<string, string> = {
  draft: 'bg-paper text-graphite border border-line dark:bg-canvas dark:text-ink dark:border-white/10',
  published: 'bg-[#e6f4ea] text-[#14532d]',
  archived: 'bg-paper text-machine border border-line dark:bg-canvas dark:text-fog dark:border-white/10'
};

export default async function AdminProductsPage({
  searchParams
}: {
  searchParams: Promise<{ imported?: string }>;
}) {
  const { imported } = await searchParams;
  const { client, access } = await requireStaff();
  const [managed, rows] = await Promise.all([isCatalogManaged(client), listAdminProducts(client)]);

  return (
    <>
      <h1 className="text-2xl font-extrabold">{S.products.title}</h1>

      {imported !== undefined && (
        <p role="status" className="mt-3 rounded border border-line bg-pure p-3 text-sm dark:border-white/10 dark:bg-surface">
          ✓ {S.products.import.done(Number(imported) || 0)}
        </p>
      )}

      {!managed && access === 'admin' && (
        <section className="mt-4 rounded border-2 border-blueprint bg-pure p-5 dark:border-skyline dark:bg-surface">
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
        <p className="mt-4 rounded border border-line bg-pure p-3 text-sm text-machine dark:border-white/10 dark:bg-surface dark:text-fog">
          {S.products.import.help}
        </p>
      )}

      {rows.length === 0 ? (
        <p className="mt-8 text-machine dark:text-fog">{S.products.empty}</p>
      ) : (
        <div
          className="mt-6 overflow-x-auto rounded border border-line bg-pure dark:border-white/10 dark:bg-surface"
          tabIndex={0}
          role="region"
          aria-label={S.products.title}
        >
          <table className="w-full min-w-[640px] border-collapse text-sm">
            <thead>
              <tr className="border-b border-line text-start dark:border-white/10">
                {[S.products.code, S.products.name, S.products.category, S.products.status, S.products.missing].map((h) => (
                  <th key={h} scope="col" className="px-3 py-3 text-start font-semibold text-machine dark:text-fog">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => (
                <tr key={row.code} className="border-b border-line last:border-b-0 hover:bg-paper dark:border-white/10 dark:hover:bg-canvas">
                  <td className="whitespace-nowrap px-3 py-3">
                    <Link
                      href={`/admin/products/${row.code}`}
                      className="font-semibold text-blueprint underline-offset-2 hover:underline dark:text-skyline"
                      dir="ltr"
                    >
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
                      <span className="text-machine dark:text-fog">{S.products.complete}</span>
                    ) : (
                      <span className="font-semibold text-[#9a3412] dark:text-orange-400">{S.products.missingCount(row.missing.length)}</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </>
  );
}
