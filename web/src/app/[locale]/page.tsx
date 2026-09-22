import { getTranslations, setRequestLocale } from 'next-intl/server';
import { Link } from '@/i18n/navigation';

export default async function HomePage({
  params
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);

  const t = await getTranslations('hero');
  const c = await getTranslations('capabilities');

  return (
    <>
      {/* Hero */}
      <section className="bg-paper">
        <div className="mx-auto grid max-w-shell items-center gap-8 px-[clamp(20px,4.5vw,72px)] py-[clamp(36px,5vw,76px)] lg:grid-cols-2">
          <div>
            <p className="mb-4 text-xs font-bold uppercase tracking-[0.12em] text-softec">
              {t('eyebrow')}
            </p>
            <h1 className="text-[clamp(2.25rem,4.5vw,3.6rem)] font-extrabold leading-[1.08] tracking-tight">
              {t('title')}
            </h1>
            <p className="mt-5 max-w-[48ch] text-lg leading-relaxed text-machine">
              {t('body')}
            </p>
            <div className="mt-7 flex flex-wrap gap-3">
              <Link
                href="/contact"
                className="inline-flex min-h-[48px] items-center justify-center rounded bg-blueprint px-6 font-bold text-pure hover:bg-graphite"
              >
                {t('quote')}
              </Link>
              <Link
                href="/catalog"
                className="inline-flex min-h-[48px] items-center justify-center rounded border border-line px-6 font-bold text-graphite hover:border-machine hover:bg-pure"
              >
                {t('explore')}
              </Link>
            </div>
          </div>

          {/* Product visual placeholder — replaced by Supabase-backed media in Phase 2. */}
          <div className="rounded border border-line bg-pure p-4">
            <div
              className="flex aspect-[4/3] items-center justify-center rounded bg-paper text-machine"
              role="img"
              aria-label={t('model')}
            >
              <span className="text-sm">{t('model')}</span>
            </div>
            <p className="mt-3 flex items-center justify-between px-1 text-sm">
              <span dir="ltr" className="font-bold text-graphite">
                LS-1000LPT
              </span>
              <span className="text-machine">{t('model')}</span>
            </p>
          </div>
        </div>
      </section>

      {/* Capabilities */}
      <section aria-label="Capabilities" className="border-t border-line bg-pure">
        <div className="mx-auto grid max-w-shell gap-4 px-[clamp(20px,4.5vw,72px)] py-8 sm:grid-cols-3">
          {[c('custom'), c('av'), c('accessible')].map((label) => (
            <p key={label} className="border-s-2 border-softec ps-4 text-lg font-semibold">
              {label}
            </p>
          ))}
        </div>
      </section>
    </>
  );
}
