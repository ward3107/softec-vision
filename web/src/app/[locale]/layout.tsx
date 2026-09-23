import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { NextIntlClientProvider } from 'next-intl';
import { getMessages, getTranslations, setRequestLocale } from 'next-intl/server';
import { Assistant } from 'next/font/google';
import { routing, localeDir, type AppLocale } from '@/i18n/routing';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { CompareProvider } from '@/components/catalog/CompareProvider';
import CompareTray from '@/components/catalog/CompareTray';
import RevealController from '@/components/motion/RevealController';
import FloatingDock from '@/components/widgets/FloatingDock';
import BrandSplash from '@/components/BrandSplash';
import JsonLd, { organizationSchema } from '@/components/JsonLd';
import ConsentBanner from '@/components/consent/ConsentBanner';
import { ConsentProvider } from '@/components/consent/ConsentProvider';
import { WA_NUMBER } from '@/lib/catalog/seed';
import { SITE_URL, BRAND, OG_LOCALE, localeUrl, metaAlternates } from '@/lib/seo';
import '../globals.css';

/**
 * Runs before first paint: flags that JS is live (so scroll-reveal can hide
 * elements without risking a no-JS blank), and re-applies any saved
 * accessibility preferences so there is no flash of the default display.
 */
const BOOT_SCRIPT = `(function(){try{
  var d=document.documentElement;d.classList.add('js');
  if(localStorage.getItem('softec-brand-intro-seen')==='1'){d.classList.add('brand-splash-seen');}
  var f=parseInt(localStorage.getItem('a11y-font')||'0',10);
  if(f){d.style.fontSize=(100+f*8)+'%';}
  ['contrast','grayscale','invert','links','headings','readable','linespacing','letterspacing','bigcursor','hideimages','nomotion'].forEach(function(k){
    if(localStorage.getItem('a11y-'+k)==='1'){document.body.classList.add('a11y-'+k);}
  });
}catch(e){}})();`;

const assistant = Assistant({
  subsets: ['latin', 'hebrew'],
  weight: ['400', '500', '600', '700', '800'],
  display: 'swap',
  variable: '--font-assistant'
});

export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }));
}

export async function generateMetadata({
  params
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const l = locale as AppLocale;
  const t = await getTranslations({ locale, namespace: 'meta' });
  return {
    metadataBase: new URL(SITE_URL),
    title: { default: t('title'), template: `%s | ${BRAND}` },
    description: t('description'),
    applicationName: BRAND,
    alternates: metaAlternates(l, ''),
    openGraph: {
      type: 'website',
      siteName: BRAND,
      locale: OG_LOCALE[l],
      alternateLocale: l === 'he' ? OG_LOCALE.en : OG_LOCALE.he,
      url: localeUrl(l, ''),
      title: t('title'),
      description: t('description')
    },
    twitter: { card: 'summary_large_image', title: t('title'), description: t('description') },
    robots: { index: true, follow: true }
  };
}

export default async function LocaleLayout({
  children,
  params
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  if (!(routing.locales as readonly string[]).includes(locale)) notFound();

  // Enable static rendering for this locale.
  setRequestLocale(locale);

  const messages = await getMessages();
  const t = await getTranslations('nav');
  const dir = localeDir[locale as AppLocale];

  return (
    <html lang={locale} dir={dir} className={assistant.variable} suppressHydrationWarning>
      <body className="min-h-screen bg-paper font-sans text-graphite antialiased" suppressHydrationWarning>
        <script dangerouslySetInnerHTML={{ __html: BOOT_SCRIPT }} />
        <JsonLd data={organizationSchema(locale as AppLocale)} />
        <BrandSplash />
        <NextIntlClientProvider messages={messages}>
          <ConsentProvider gaId={process.env.NEXT_PUBLIC_GA4_ID ?? ''}>
            <CompareProvider>
              <a href="#main" className="skip-link">
                {t('skip')}
              </a>
              {/* Colour-filter aids apply here; the dock and reading overlays sit outside. */}
              <div id="a11y-content">
                <Header />
                <main id="main" tabIndex={-1}>
                  {children}
                </main>
                <Footer />
              </div>
              <CompareTray />
              <FloatingDock waNumber={WA_NUMBER} />
              <RevealController />
              <ConsentBanner />
            </CompareProvider>
          </ConsentProvider>
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
