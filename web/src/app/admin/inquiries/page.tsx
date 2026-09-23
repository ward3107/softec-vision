import Link from 'next/link';
import { INQUIRY_STATUSES, listInquiries, type InquiryStatus } from '@/lib/admin/inquiries';
import { requireStaff } from '@/lib/admin/session';
import { S } from '@/lib/admin/strings';
import { shortReference } from '@/lib/inquiry/reference';
import AdminShell from '../AdminShell';
import { statusBadge } from '../statusBadge';

export const dynamic = 'force-dynamic';

const dateFormat = new Intl.DateTimeFormat('he-IL', {
  dateStyle: 'short',
  timeStyle: 'short',
  timeZone: 'Asia/Jerusalem'
});

export default async function AdminInquiriesPage({
  searchParams
}: {
  searchParams: Promise<{ status?: string; erased?: string }>;
}) {
  const { status: raw, erased } = await searchParams;
  const status = (INQUIRY_STATUSES as readonly string[]).includes(raw ?? '') ? (raw as InquiryStatus) : undefined;
  const { client, user } = await requireStaff();
  const rows = await listInquiries(client, { status });

  const filter = (value: InquiryStatus | undefined, label: string) => (
    <Link
      href={value ? `/admin/inquiries?status=${value}` : '/admin/inquiries'}
      aria-current={status === value ? 'page' : undefined}
      className={`inline-flex min-h-[44px] items-center rounded border px-3 text-sm font-semibold ${
        status === value
          ? 'border-blueprint bg-pure text-blueprint dark:border-skyline dark:bg-surface dark:text-skyline'
          : 'border-line hover:border-machine dark:border-white/10 dark:hover:border-white/25'
      }`}
    >
      {label}
    </Link>
  );

  return (
    <AdminShell email={user?.email} active="inquiries">
      <h1 className="text-2xl font-extrabold">{S.inquiries.title}</h1>
      {erased && (
        <p role="status" className="mt-3 rounded border border-line bg-pure p-3 text-sm dark:border-white/10 dark:bg-surface">
          ✓ {S.detail.erased}
        </p>
      )}
      <nav aria-label={S.inquiries.status} className="mt-4 flex flex-wrap gap-2">
        {filter(undefined, S.statuses.all)}
        {INQUIRY_STATUSES.map((s) => filter(s, S.statuses[s]))}
      </nav>

      {rows.length === 0 ? (
        <p className="mt-8 text-machine dark:text-fog">{S.inquiries.empty}</p>
      ) : (
        <div
          className="mt-6 overflow-x-auto rounded border border-line bg-pure dark:border-white/10 dark:bg-surface"
          tabIndex={0}
          role="region"
          aria-label={S.inquiries.title}
        >
          <table className="w-full min-w-[640px] border-collapse text-sm">
            <thead>
              <tr className="border-b border-line text-start dark:border-white/10">
                {[S.inquiries.date, S.inquiries.name, S.inquiries.company, S.inquiries.country, S.inquiries.product, S.inquiries.status].map(
                  (h) => (
                    <th key={h} scope="col" className="px-3 py-3 text-start font-semibold text-machine dark:text-fog">
                      {h}
                    </th>
                  )
                )}
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => (
                <tr key={row.id} className="border-b border-line last:border-b-0 hover:bg-paper dark:border-white/10 dark:hover:bg-canvas">
                  <td className="whitespace-nowrap px-3 py-3">
                    <bdi>{dateFormat.format(new Date(row.created_at))}</bdi>
                  </td>
                  <td className="px-3 py-3 font-semibold">
                    <Link
                      href={`/admin/inquiries/${row.id}`}
                      className="text-blueprint underline-offset-2 hover:underline dark:text-skyline"
                    >
                      {row.name}
                    </Link>
                    <span className="ms-2 text-xs text-machine dark:text-fog">
                      <bdi>{shortReference(row.id)}</bdi>
                    </span>
                  </td>
                  <td className="px-3 py-3">{row.company ?? '—'}</td>
                  <td className="px-3 py-3">{row.country ?? '—'}</td>
                  <td className="px-3 py-3">
                    <bdi>{row.product_code_snapshot ?? '—'}</bdi>
                  </td>
                  <td className="px-3 py-3">
                    <span className={`inline-block rounded px-2 py-0.5 text-xs font-bold ${statusBadge[row.status]}`}>
                      {S.statuses[row.status]}
                    </span>
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
