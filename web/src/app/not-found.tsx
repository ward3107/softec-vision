import type { Metadata } from 'next';
import Link from 'next/link';
import { Assistant } from 'next/font/google';
import './globals.css';

/**
 * Global fallback for a path that matches no route at all (so next-intl's
 * `[locale]` segment never resolves) — and, in production builds, for some
 * notFound() calls whose nearest boundary can't be reached either. Without
 * this file Next.js falls back to its own bare internal shell (no <html
 * lang>, none of the site's styling), which fails WCAG's html-has-lang check
 * and looks broken to a real visitor. This can't use next-intl's hooks or
 * locale-aware <Link> — there is no resolved locale here — so it is a
 * small, self-contained page defaulting to the site's default locale
 * (Hebrew), exactly as next-intl's own docs recommend for this case.
 */

const assistant = Assistant({
  subsets: ['latin', 'hebrew'],
  weight: ['400', '700', '800'],
  display: 'swap',
  variable: '--font-assistant'
});

export const metadata: Metadata = {
  title: 'הדף לא נמצא — Softec Vision',
  robots: { index: false, follow: false }
};

export default function GlobalNotFound() {
  return (
    <html lang="he" dir="rtl" className={assistant.variable}>
      <body className="min-h-screen bg-paper font-sans text-graphite antialiased">
        <section className="mx-auto flex min-h-screen max-w-shell flex-col items-center justify-center px-[clamp(20px,4.5vw,72px)] text-center">
          <p className="text-6xl font-extrabold text-blueprint">404</p>
          <p className="mt-4 text-lg font-semibold">הדף המבוקש לא נמצא.</p>
          <p className="mt-1 text-machine">The page you are looking for could not be found.</p>
          <Link
            href="/he"
            className="mt-6 inline-flex min-h-[48px] items-center justify-center rounded bg-blueprint px-6 font-bold text-pure hover:bg-graphite"
          >
            Softec Vision
          </Link>
        </section>
      </body>
    </html>
  );
}
