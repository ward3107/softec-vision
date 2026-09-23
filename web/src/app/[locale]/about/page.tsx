import type { Metadata } from 'next';
import { getTranslations, setRequestLocale } from 'next-intl/server';
import type { AppLocale } from '@/i18n/routing';
import { pageMetadata } from '@/lib/seo';
import BrandLogo from '@/components/BrandLogo';

export async function generateMetadata({
  params
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const nav = await getTranslations({ locale, namespace: 'nav' });
  const about = await getTranslations({ locale, namespace: 'about' });
  return pageMetadata({ locale: locale as AppLocale, path: '/about', title: nav('about'), description: about('body') });
}

export default async function AboutPage({
  params
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations('about');
  const sectors = [t('education'), t('display'), t('control'), t('industry')];
  const capabilities = [
    { title: t('howTitle'), body: t('howBody') },
    { title: t('avTitle'), body: t('avBody') },
    { title: t('accessTitle'), body: t('accessBody') }
  ];
  const why = [t('why1'), t('why2'), t('why3'), t('why4')];

  return (
    <>
      <section className="mx-auto max-w-shell px-[clamp(20px,4.5vw,72px)] py-[clamp(36px,5vw,72px)]">
        <p className="mb-3 text-xs font-bold uppercase tracking-[0.12em] text-blueprint dark:text-skyline">{t('eyebrow')}</p>
        <div className="grid gap-8 lg:grid-cols-2 lg:gap-24">
          <div className="reveal reveal-left">
            <h1>
              <span className="sr-only">{t('title')}</span>
              <BrandLogo className="max-w-[420px]" />
            </h1>
            <p className="mt-4 text-lg text-machine dark:text-fog">{t('body')}</p>
            <p className="mt-3 text-lg text-machine dark:text-fog">{t('detail')}</p>
          </div>
          <div className="reveal reveal-right">
            <h2 className="text-lg font-bold">{t('spaces')}</h2>
            <ul className="mt-4">
              {sectors.map((row) => (
                <li key={row} className="border-b border-line py-4 text-lg dark:border-white/10">
                  {row}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </section>

      {/* Capabilities: manufacturing, AV integration, accessibility */}
      <section aria-labelledby="capabilities-title" className="bg-paper dark:bg-canvas">
        <div className="mx-auto max-w-shell px-[clamp(20px,4.5vw,72px)] py-[clamp(36px,5vw,72px)]">
          <h2 id="capabilities-title" className="sr-only">
            {t('capabilitiesTitle')}
          </h2>
          <div className="grid gap-8 sm:grid-cols-3">
            {capabilities.map((item, i) => (
              <div key={item.title} className={`reveal reveal-up reveal-d${i + 1} border-s-2 border-softec ps-5`}>
                <h3 className="text-lg font-bold">{item.title}</h3>
                <p className="mt-2 text-machine dark:text-fog">{item.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Why Softec Vision */}
      <section aria-labelledby="why-title" className="bg-graphite text-paper">
        <div className="mx-auto max-w-shell px-[clamp(20px,4.5vw,72px)] py-[clamp(36px,5vw,64px)]">
          <h2 id="why-title" className="text-[clamp(1.6rem,2.6vw,2.2rem)] font-extrabold tracking-tight text-pure">
            {t('whyTitle')}
          </h2>
          <ul className="mt-6 grid gap-4 sm:grid-cols-2">
            {why.map((item) => (
              <li key={item} className="flex items-start gap-3 text-lg text-paper">
                <span className="mt-[0.55em] h-2 w-2 flex-none rounded-full bg-softec" aria-hidden="true" />
                {item}
              </li>
            ))}
          </ul>
        </div>
      </section>
    </>
  );
}
