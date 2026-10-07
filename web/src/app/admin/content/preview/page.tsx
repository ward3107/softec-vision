import { NextIntlClientProvider } from 'next-intl';
import { getMessages, setRequestLocale } from 'next-intl/server';
import { requireStaff } from '@/lib/admin/session';
import HomePage from '@/app/[locale]/page';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { ConsentProvider } from '@/components/consent/ConsentProvider';
import PreviewReady from './PreviewReady';

export const dynamic = 'force-dynamic';

export default async function ContentPreview({ searchParams }: { searchParams: Promise<{ locale?: string }> }) {
  await requireStaff();
  const locale = (await searchParams).locale === 'en' ? 'en' : 'he';
  setRequestLocale(locale);
  const messages = await getMessages({ locale });
  const home = await HomePage({ params: Promise.resolve({ locale }) });
  return <div dir={locale === 'he' ? 'rtl' : 'ltr'} lang={locale} className="bg-paper text-graphite">
    <NextIntlClientProvider locale={locale} messages={messages}>
      <ConsentProvider gaId="">
        <Header />
        <main>{home}</main>
        <Footer />
        <PreviewReady locale={locale} />
      </ConsentProvider>
    </NextIntlClientProvider>
  </div>;
}
