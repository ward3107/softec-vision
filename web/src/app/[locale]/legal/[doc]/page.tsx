import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { setRequestLocale } from 'next-intl/server';
import { routing, type AppLocale } from '@/i18n/routing';
import { pageMetadata } from '@/lib/seo';
import legalContent from '@/lib/legal/content.json';

type LocalizedStr = { he: string; en: string };
type Section = { id: string; title: LocalizedStr; body: LocalizedStr };
type Doc = {
  h1: LocalizedStr;
  lastUpdated: LocalizedStr;
  lastUpdatedLabel: LocalizedStr;
  reviewBanner: LocalizedStr;
  lead: LocalizedStr;
  contents: LocalizedStr;
  reviewLabel: LocalizedStr | null;
  reviewDate: LocalizedStr | null;
  sections: Section[];
};

const content = legalContent as Record<string, Doc>;
const DOCS = ['privacy', 'accessibility', 'terms'];
const loc = (value: LocalizedStr, locale: string): string =>
  (value as Record<string, string>)[locale] || value.he;

export function generateStaticParams() {
  return routing.locales.flatMap((locale) => DOCS.map((doc) => ({ locale, doc })));
}

export async function generateMetadata({
  params
}: {
  params: Promise<{ locale: string; doc: string }>;
}): Promise<Metadata> {
  const { locale, doc } = await params;
  const d = content[doc];
  if (!d) return {};
  return pageMetadata({
    locale: locale as AppLocale,
    path: `/legal/${doc}`,
    title: loc(d.h1, locale),
    description: loc(d.lead, locale)
  });
}

export default async function LegalDocPage({
  params
}: {
  params: Promise<{ locale: string; doc: string }>;
}) {
  const { locale, doc } = await params;
  setRequestLocale(locale);
  const d = content[doc];
  if (!d) notFound();
  const l = locale as AppLocale;

  return (
    <>
      <div className="legal-review" role="note">
        <p>{loc(d.reviewBanner, l)}</p>
      </div>

      <div className="mx-auto max-w-4xl px-[clamp(20px,4.5vw,72px)] py-[clamp(28px,4vw,56px)]">
        <h1 className="text-[clamp(1.9rem,4vw,2.7rem)] font-extrabold tracking-tight">{loc(d.h1, l)}</h1>
        <p className="mt-2 text-sm text-machine">
          <strong className="text-graphite">{loc(d.lastUpdatedLabel, l)}</strong> {loc(d.lastUpdated, l)}
        </p>
        {d.reviewLabel && d.reviewDate && (
          <p className="text-sm text-machine">
            <strong className="text-graphite">{loc(d.reviewLabel, l)}</strong> {loc(d.reviewDate, l)}
          </p>
        )}
        <p className="mt-4 max-w-[70ch] text-lg">{loc(d.lead, l)}</p>

        <nav className="mt-8 rounded border border-line bg-pure p-5" aria-label={loc(d.contents, l)}>
          <h2 className="text-xs font-bold uppercase tracking-[0.1em] text-machine">{loc(d.contents, l)}</h2>
          <ol className="mt-3 grid gap-1 sm:grid-cols-2">
            {d.sections.map((s, i) => (
              <li key={s.id}>
                <a href={`#${s.id}`} className="block rounded px-2 py-1 text-sm font-medium hover:bg-paper hover:text-blueprint">
                  <span className="text-machine">{String(i + 1).padStart(2, '0')}.</span> {loc(s.title, l)}
                </a>
              </li>
            ))}
          </ol>
        </nav>

        <div className="legal-prose mt-8">
          {d.sections.map((s) => (
            <section key={s.id} id={s.id}>
              <h2>{loc(s.title, l)}</h2>
              {/* Author-written, trusted markup ported from the reviewed legal templates. */}
              <div dangerouslySetInnerHTML={{ __html: loc(s.body, l) }} />
            </section>
          ))}
        </div>
      </div>
    </>
  );
}
