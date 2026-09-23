'use client';

import Link from 'next/link';

/**
 * Root error boundary — the last line of defense against an uncaught
 * rendering error anywhere in the app. Without this file (there was none),
 * Next.js falls back to its own bare internal error shell (no <html lang>,
 * none of the site's styling) for any such error, including — it turns out
 * — some cases where notFound() is called from a dynamically-rendered route
 * (one whose params weren't in generateStaticParams's build-time list) and
 * rendering the nested not-found.tsx boundary itself fails. Same reasoning
 * as the root not-found.tsx: no locale context is guaranteed here, so this
 * stays a small, self-contained page with hardcoded bilingual text.
 */
export default function GlobalError({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <html lang="he" dir="rtl">
      <body style={{ background: '#F7F8F8', color: '#151719', fontFamily: 'Arial, sans-serif' }}>
        <section
          style={{
            minHeight: '100vh',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            textAlign: 'center',
            padding: '24px'
          }}
        >
          <p style={{ fontSize: '1.25rem', fontWeight: 700 }}>משהו השתבש.</p>
          <p style={{ marginTop: '4px', color: '#697077' }}>Something went wrong.</p>
          <div style={{ marginTop: '24px', display: 'flex', gap: '12px', flexWrap: 'wrap', justifyContent: 'center' }}>
            <button
              type="button"
              onClick={reset}
              style={{
                minHeight: '48px',
                padding: '0 24px',
                borderRadius: '6px',
                background: '#0C5E91',
                color: '#FFFFFF',
                fontWeight: 700,
                border: 'none',
                cursor: 'pointer'
              }}
            >
              נסו שוב / Try again
            </button>
            <Link
              href="/he"
              style={{
                minHeight: '48px',
                display: 'inline-flex',
                alignItems: 'center',
                padding: '0 24px',
                borderRadius: '6px',
                border: '1px solid #697077',
                color: '#151719',
                fontWeight: 700,
                textDecoration: 'none'
              }}
            >
              Softec Vision
            </Link>
          </div>
        </section>
      </body>
    </html>
  );
}
