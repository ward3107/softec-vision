import Link from 'next/link';
import { confirmMagicLink } from './actions';

export const dynamic = 'force-dynamic';
export const metadata = {
  title: 'אישור כניסה | Softec Vision',
  robots: { index: false, follow: false }
};

export default async function ConfirmMagicLinkPage({
  searchParams
}: {
  searchParams: Promise<{ token_hash?: string; type?: string }>;
}) {
  const { token_hash: tokenHash, type } = await searchParams;
  const canConfirm = Boolean(tokenHash) && type === 'email';

  return (
    <main dir="rtl" lang="he" className="mx-auto grid min-h-screen max-w-md content-center px-5 py-12">
      <p className="text-sm font-bold text-blueprint dark:text-skyline">Softec Vision</p>
      <section className="mt-3 rounded border border-line bg-pure p-6 dark:border-white/10 dark:bg-surface">
        <h1 className="text-2xl font-extrabold">כניסה ללוח הניהול</h1>
        {canConfirm ? (
          <>
            <p className="mt-3 text-sm text-muted">
              לחיצה על הכפתור תאשר את הכניסה ותעביר אותך ישירות ללוח הניהול.
            </p>
            <form action={confirmMagicLink} className="mt-6">
              <input type="hidden" name="token_hash" value={tokenHash} />
              <input type="hidden" name="type" value="email" />
              <button
                type="submit"
                className="w-full rounded bg-blueprint px-5 py-3 font-bold text-white hover:opacity-90"
              >
                אישור וכניסה
              </button>
            </form>
          </>
        ) : (
          <>
            <p role="status" className="mt-3 text-sm text-muted">
              הקישור חסר או לא תקין. בקש קישור כניסה חדש ופתח אותו מאותו מכשיר.
            </p>
            <Link href="/admin/login" className="mt-6 inline-block font-bold text-blueprint hover:underline dark:text-skyline">
              חזרה לכניסה
            </Link>
          </>
        )}
      </section>
    </main>
  );
}
