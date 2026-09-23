import type { Metadata } from 'next';
import { getTranslations, setRequestLocale } from 'next-intl/server';
import type { AppLocale } from '@/i18n/routing';
import { buildInquiryUrl, filterProducts, localized } from '@/lib/catalog';
import { WA_NUMBER } from '@/lib/catalog/seed';
import { pageMetadata } from '@/lib/seo';
import { getInquiryConfig } from '@/lib/inquiry/config';
import ContactWhatsAppLink from '@/components/contact/ContactWhatsAppLink';
import QuoteForm from '@/components/contact/QuoteForm';

const PHONE = '03-6968777';
const EMAIL = 'Alon@softec.co.il';

export async function generateMetadata({
  params
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const nav = await getTranslations({ locale, namespace: 'nav' });
  const c = await getTranslations({ locale, namespace: 'contact' });
  return pageMetadata({ locale: locale as AppLocale, path: '/contact', title: nav('contact'), description: c('body') });
}

export default async function ContactPage({
  params
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  // Server-only check; the browser learns only whether online submission is on.
  const onlineEnabled = getInquiryConfig().onlineEnabled;
  const l = locale as AppLocale;
  const t = await getTranslations('contact');
  const tf = await getTranslations('form');
  const whatsapp = buildInquiryUrl(null, l);
  const products = (await filterProducts({ lang: l, cat: 'all' })).map((p) => ({
    code: p.code,
    name: localized(p.name, l)
  }));

  return (
    <section className="mx-auto max-w-shell px-[clamp(20px,4.5vw,72px)] py-[clamp(36px,5vw,72px)]">
      <p className="mb-3 text-xs font-bold uppercase tracking-[0.12em] text-blueprint dark:text-skyline">{t('eyebrow')}</p>
      <h1 className="max-w-[20ch] text-[clamp(2rem,3.5vw,3rem)] font-extrabold tracking-tight">{t('title')}</h1>
      <p className="mt-4 max-w-[52ch] text-lg text-machine dark:text-fog">{t('body')}</p>

      <div className="mt-8 grid gap-10 lg:grid-cols-[1.4fr_1fr]">
        {/* Quote request form */}
        <div>
          <h2 className="text-lg font-bold">{tf('title')}</h2>
          <p className="mb-5 mt-1 text-sm text-machine dark:text-fog">{tf(onlineEnabled ? 'intro' : 'introOffline')}</p>
          <QuoteForm waNumber={WA_NUMBER} products={products} onlineEnabled={onlineEnabled} />
        </div>

        {/* Contact details */}
        <div className="rounded border border-line bg-pure p-6 dark:border-white/10 dark:bg-surface lg:sticky lg:top-24 lg:self-start">
          <h2 className="text-lg font-bold">{t('detailsTitle')}</h2>
          <dl className="mt-4 space-y-3 text-sm">
            <div className="flex justify-between gap-4 border-b border-line pb-3 dark:border-white/10">
              <dt className="text-machine dark:text-fog">{t('phone')}</dt>
              <dd>
                <a href="tel:+97236968777" className="font-semibold text-blueprint dark:text-skyline" dir="ltr">
                  {PHONE}
                </a>
              </dd>
            </div>
            <div className="flex justify-between gap-4 border-b border-line pb-3 dark:border-white/10">
              <dt className="text-machine dark:text-fog">{t('email')}</dt>
              <dd>
                <a href={`mailto:${EMAIL}`} className="font-semibold text-blueprint dark:text-skyline" dir="ltr">
                  {EMAIL}
                </a>
              </dd>
            </div>
            <div className="flex justify-between gap-4">
              <dt className="text-machine dark:text-fog">WhatsApp</dt>
              <dd>
                <ContactWhatsAppLink href={whatsapp}>+972-54-474-2520</ContactWhatsAppLink>
              </dd>
            </div>
          </dl>
        </div>
      </div>
    </section>
  );
}
