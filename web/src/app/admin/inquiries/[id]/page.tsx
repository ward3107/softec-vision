import Link from 'next/link';
import { INQUIRY_STATUSES, getInquiryDetail, replyLinks } from '@/lib/admin/inquiries';
import { requireStaff } from '@/lib/admin/session';
import { S } from '@/lib/admin/strings';
import { shortReference } from '@/lib/inquiry/reference';
import he from '../../../../../messages/he.json';
import AdminShell from '../../AdminShell';
import { eraseInquiry, setInquiryStatus } from '../../actions';
import { statusBadge } from '../../statusBadge';

export const dynamic = 'force-dynamic';

const dateFormat = new Intl.DateTimeFormat('he-IL', { dateStyle: 'medium', timeStyle: 'short', timeZone: 'Asia/Jerusalem' });
const projectTypes = he.form.projectTypes as Record<string, string>;
const kb = (bytes: number) => `${Math.max(1, Math.round(bytes / 1024))} KB`;

export default async function AdminInquiryPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { client, user, access } = await requireStaff();
  const detail = /^[0-9a-f-]{36}$/i.test(id) ? await getInquiryDetail(client, id) : null;

  if (!detail) {
    return (
      <AdminShell email={user?.email} active="inquiries">
        <p>{S.detail.notFound}</p>
        <Link href="/admin/inquiries" className="mt-4 inline-block font-semibold text-blueprint hover:underline dark:text-skyline">
          {S.detail.back}
        </Link>
      </AdminShell>
    );
  }

  const { inquiry, attachments } = detail;
  const reference = shortReference(inquiry.id);
  const links = replyLinks({ email: inquiry.email, phone: inquiry.phone, country: inquiry.country, reference });
  const rows: Array<[string, React.ReactNode, boolean?]> = [
    [S.detail.received, dateFormat.format(new Date(inquiry.created_at))],
    [S.detail.company, inquiry.company],
    [S.detail.email, inquiry.email, true],
    [S.detail.phone, inquiry.phone, true],
    [S.detail.country, inquiry.country],
    [S.detail.projectType, inquiry.project_type ? projectTypes[inquiry.project_type] ?? inquiry.project_type : null],
    [S.detail.product, inquiry.product_code_snapshot, true],
    [S.detail.roomDimensions, inquiry.room_dimensions],
    [S.detail.language, inquiry.locale === 'en' ? 'English' : inquiry.locale === 'he' ? 'עברית' : inquiry.locale],
    [
      S.detail.consent,
      inquiry.consent_at ? (
        <>
          {dateFormat.format(new Date(inquiry.consent_at))}
          {inquiry.consent_version && (
            <span className="block text-sm font-normal text-machine dark:text-fog">
              {S.detail.policyVersion}: <bdi>{inquiry.consent_version}</bdi>
            </span>
          )}
        </>
      ) : null
    ]
  ];

  const button = 'inline-flex min-h-[44px] items-center rounded border px-4 text-sm font-semibold';

  return (
    <AdminShell email={user?.email} active="inquiries">
      <Link href="/admin/inquiries" className="text-sm font-semibold text-blueprint hover:underline dark:text-skyline">
        ← {S.detail.back}
      </Link>
      <div className="mt-3 flex flex-wrap items-center gap-3">
        <h1 className="text-2xl font-extrabold">{inquiry.name}</h1>
        <span className={`rounded px-2 py-0.5 text-xs font-bold ${statusBadge[inquiry.status]}`}>{S.statuses[inquiry.status]}</span>
        <span className="text-sm text-machine dark:text-fog">
          {S.detail.reference}: <bdi>{reference}</bdi>
        </span>
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-[1.5fr_1fr]">
        <section className="rounded border border-line bg-pure p-5 dark:border-white/10 dark:bg-surface">
          <dl className="grid gap-x-6 gap-y-3 sm:grid-cols-[auto_1fr]">
            {rows
              .filter(([, value]) => value)
              .map(([label, value, ltr]) => (
                <div key={label} className="contents">
                  <dt className="text-sm text-machine dark:text-fog">{label}</dt>
                  <dd className="font-semibold">{ltr ? <bdi>{value}</bdi> : value}</dd>
                </div>
              ))}
          </dl>
          <h2 className="mt-6 text-base font-bold">{S.detail.requirements}</h2>
          <p className="mt-2 whitespace-pre-wrap leading-relaxed" dir="auto">
            {inquiry.message}
          </p>

          <h2 className="mt-6 text-base font-bold">{S.detail.attachments}</h2>
          {attachments.length === 0 ? (
            <p className="mt-2 text-sm text-machine dark:text-fog">{S.detail.noAttachments}</p>
          ) : (
            <>
              <ul className="mt-2 grid gap-2">
                {attachments.map((file) => (
                  <li key={file.filename + file.size}>
                    {file.url ? (
                      <a
                        href={file.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="font-semibold text-blueprint underline underline-offset-2 dark:text-skyline"
                        dir="ltr"
                      >
                        {file.filename}
                      </a>
                    ) : (
                      <span dir="ltr">{file.filename}</span>
                    )}{' '}
                    <span className="text-sm text-machine dark:text-fog">({kb(file.size)})</span>
                  </li>
                ))}
              </ul>
              <p className="mt-1 text-xs text-machine dark:text-fog">{S.detail.fileLinkNote}</p>
            </>
          )}
        </section>

        <aside className="grid content-start gap-6">
          <section className="rounded border border-line bg-pure p-5 dark:border-white/10 dark:bg-surface">
            <h2 className="text-base font-bold">{S.detail.reply}</h2>
            <div className="mt-3 flex flex-wrap gap-2">
              {links.email && (
                <a href={links.email} className={`${button} border-blueprint bg-blueprint text-pure hover:bg-graphite`}>
                  {S.detail.replyEmail}
                </a>
              )}
              {links.phone && (
                <a href={links.phone} className={`${button} border-line hover:border-machine dark:border-white/10 dark:hover:border-white/25`}>
                  {S.detail.replyPhone}
                </a>
              )}
              {links.whatsapp && (
                <a href={links.whatsapp} target="_blank" rel="noopener noreferrer" className={`${button} border-[#15803d] bg-[#15803d] text-white hover:bg-[#166534]`}>
                  {S.detail.replyWhatsapp}
                </a>
              )}
            </div>
          </section>

          <section className="rounded border border-line bg-pure p-5 dark:border-white/10 dark:bg-surface">
            <h2 className="text-base font-bold">{S.detail.setStatus}</h2>
            <div className="mt-3 flex flex-wrap gap-2">
              {INQUIRY_STATUSES.map((status) => (
                <form key={status} action={setInquiryStatus}>
                  <input type="hidden" name="id" value={inquiry.id} />
                  <input type="hidden" name="status" value={status} />
                  <button
                    type="submit"
                    aria-pressed={inquiry.status === status}
                    className={`${button} ${
                      inquiry.status === status
                        ? 'border-blueprint bg-blueprint text-pure'
                        : 'border-line hover:border-machine dark:border-white/10 dark:hover:border-white/25'
                    }`}
                  >
                    {S.statuses[status]}
                  </button>
                </form>
              ))}
            </div>
          </section>

          {access === 'admin' && (
            <section className="rounded border-2 border-red-700 bg-pure p-5 dark:border-red-400 dark:bg-surface">
              <h2 className="text-base font-bold text-red-700 dark:text-red-400">{S.detail.erase}</h2>
              <p className="mt-1 text-sm">{S.detail.eraseHelp}</p>
              <form action={eraseInquiry} className="mt-3 grid gap-3">
                <input type="hidden" name="id" value={inquiry.id} />
                <label className="flex items-start gap-2 text-sm">
                  <input type="checkbox" name="confirm" required className="mt-0.5 h-5 w-5 accent-red-700" />
                  {S.detail.eraseConfirm}
                </label>
                <button
                  type="submit"
                  className={`${button} justify-center border-red-700 text-red-700 hover:bg-red-50 dark:border-red-400 dark:text-red-400 dark:hover:bg-red-950`}
                >
                  {S.detail.eraseButton}
                </button>
              </form>
            </section>
          )}
        </aside>
      </div>
    </AdminShell>
  );
}
