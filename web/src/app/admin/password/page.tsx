import { redirect } from 'next/navigation';
import { requireStaff } from '@/lib/admin/session';

export const dynamic = 'force-dynamic';

async function changePassword(formData: FormData) {
  'use server';

  const { client } = await requireStaff();
  const password = String(formData.get('password') ?? '');
  const confirmation = String(formData.get('confirmation') ?? '');

  if (password.length < 12) redirect('/admin/password?error=short');
  if (password !== confirmation) redirect('/admin/password?error=mismatch');

  const { error } = await client.auth.updateUser({ password });
  if (error) redirect('/admin/password?error=failed');

  redirect('/admin/password?saved=1');
}

export default async function PasswordPage({
  searchParams
}: {
  searchParams: Promise<{ error?: string; saved?: string }>;
}) {
  await requireStaff();
  const { error, saved } = await searchParams;
  const message =
    error === 'short'
      ? 'בחרו סיסמה של לפחות 12 תווים.'
      : error === 'mismatch'
        ? 'שתי הסיסמאות אינן זהות.'
        : error === 'failed'
          ? 'לא הצלחנו לעדכן את הסיסמה. נסו שוב.'
          : null;

  return (
    <section className="mx-auto max-w-md">
      <h1 className="text-2xl font-extrabold">עדכון סיסמה</h1>
      <p className="mt-2 text-machine dark:text-fog">
        הסיסמה החדשה תשמש לכניסה לאזור הניהול יחד עם כתובת המייל שלך.
      </p>
      {saved && (
        <p role="status" className="mt-5 rounded border border-green-700 p-3 font-semibold text-green-800">
          הסיסמה נשמרה. אפשר להשתמש בה כדרך כניסה חלופית.
        </p>
      )}
      {message && (
        <p role="alert" className="mt-5 rounded border border-red-700 p-3 font-semibold text-red-700">
          {message}
        </p>
      )}
      <form action={changePassword} className="mt-6 grid gap-4 rounded border border-line bg-pure p-5 dark:border-white/10 dark:bg-surface">
        <div>
          <label htmlFor="new-password" className="block text-sm font-semibold">סיסמה חדשה</label>
          <input
            id="new-password"
            name="password"
            type="password"
            autoComplete="new-password"
            minLength={12}
            required
            className="mt-1 block w-full rounded border border-line bg-pure px-3 py-2.5 dark:border-white/10 dark:bg-canvas"
          />
        </div>
        <div>
          <label htmlFor="confirm-password" className="block text-sm font-semibold">אימות סיסמה</label>
          <input
            id="confirm-password"
            name="confirmation"
            type="password"
            autoComplete="new-password"
            minLength={12}
            required
            className="mt-1 block w-full rounded border border-line bg-pure px-3 py-2.5 dark:border-white/10 dark:bg-canvas"
          />
        </div>
        <button type="submit" className="min-h-[48px] rounded bg-blueprint px-6 font-bold text-pure hover:bg-graphite">
          שמירת סיסמה
        </button>
      </form>
    </section>
  );
}
