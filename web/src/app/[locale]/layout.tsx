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
import '../globals.css';

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
  const t = await getTranslations({ locale, namespace: 'meta' });
  return {
    title: t('title'),
    description: t('description')
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
    <html lang={locale} dir={dir} className={assistant.variable}>
      <body className="min-h-screen bg-paper font-sans text-graphite antialiased">
        <NextIntlClientProvider messages={messages}>
          <CompareProvider>
            <a href="#main" className="skip-link">
              {t('skip')}
            </a>
            <Header />
            <main id="main" tabIndex={-1}>
              {children}
            </main>
            <Footer />
            <CompareTray />
          </CompareProvider>
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
