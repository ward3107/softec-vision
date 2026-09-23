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

  return (
    <section className="mx-auto max-w-shell px-[clamp(20px,4.5vw,72px)] py-[clamp(36px,5vw,72px)]">
      <p className="mb-3 text-xs font-bold uppercase tracking-[0.12em] text-softec">{t('eyebrow')}</p>
      <div className="grid gap-8 lg:grid-cols-2 lg:gap-24">
        <div className="reveal reveal-left">
          <h1>
            <span className="sr-only">{t('title')}</span>
            <BrandLogo className="max-w-[420px]" />
          </h1>
          <p className="mt-4 text-lg text-machine">{t('body')}</p>
          <p className="mt-3 text-lg text-machine">{t('detail')}</p>
        </div>
        <div className="reveal reveal-right">
          <h2 className="text-lg font-bold">{t('spaces')}</h2>
          <ul className="mt-4">
            {sectors.map((row) => (
              <li key={row} className="border-b border-line py-4 text-lg">
                {row}
              </li>
            ))}
          </ul>
        </div>
      </div>
    </section>
  );
}
