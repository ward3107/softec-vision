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

const iconClass = 'h-[18px] w-[18px] flex-none';

function PhoneIcon() {
  return (
    <svg viewBox="0 0 24 24" className={iconClass} fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72c.13.96.36 1.9.7 2.81a2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.9.34 1.85.57 2.81.7A2 2 0 0 1 22 16.92z" />
    </svg>
  );
}

function MailIcon() {
  return (
    <svg viewBox="0 0 24 24" className={iconClass} fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <rect x="2" y="4" width="20" height="16" rx="2" />
      <path d="m2 7 10 6 10-6" />
    </svg>
  );
}

function WhatsAppIcon() {
  return (
    <svg viewBox="0 0 24 24" className={`${iconClass} text-[#15803d]`} fill="currentColor" aria-hidden="true">
      <path d="M12.04 2C6.58 2 2.13 6.45 2.13 11.91c0 1.75.46 3.45 1.32 4.95L2 22l5.25-1.38a9.9 9.9 0 0 0 4.79 1.22h.01c5.46 0 9.91-4.45 9.91-9.91C21.96 6.45 17.5 2 12.04 2zm5.8 14.03c-.24.68-1.42 1.33-1.95 1.38-.5.05-.97.24-3.28-.68-2.77-1.09-4.53-3.92-4.67-4.1-.13-.18-1.12-1.49-1.12-2.84 0-1.35.71-2.01.96-2.29.24-.27.53-.34.71-.34.18 0 .35 0 .51.01.16.01.39-.06.6.46.24.58.79 2 .86 2.14.07.14.12.3.02.48-.09.18-.14.29-.28.45-.14.16-.29.36-.42.48-.14.14-.28.29-.12.57.16.27.71 1.17 1.53 1.9 1.05.93 1.94 1.22 2.22 1.36.27.14.43.12.59-.07.16-.18.68-.79.86-1.06.18-.27.36-.23.6-.14.24.09 1.55.73 1.81.86.27.14.45.2.51.31.07.11.07.64-.17 1.31z" />
    </svg>
  );
}

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
        {/* Contact form */}
        <div>
          <h2 className="text-lg font-bold">{tf('title')}</h2>
          <p className="mb-5 mt-1 text-sm text-machine dark:text-fog">{tf(onlineEnabled ? 'intro' : 'introOffline')}</p>
          <QuoteForm waNumber={WA_NUMBER} products={products} onlineEnabled={onlineEnabled} />
        </div>

        {/* Contact details */}
        <div className="rounded border border-line bg-pure p-6 dark:border-white/10 dark:bg-surface lg:sticky lg:top-24 lg:self-start">
          <h2 className="text-lg font-bold">{t('detailsTitle')}</h2>
          <dl className="mt-4 space-y-3 text-sm">
            <div className="flex items-center justify-between gap-4 border-b border-line pb-3 dark:border-white/10">
              <dt className="flex items-center gap-2 text-machine dark:text-fog">
                <PhoneIcon />
                {t('phone')}
              </dt>
              <dd>
                <a href="tel:+97236968777" className="font-semibold text-blueprint dark:text-skyline" dir="ltr">
                  {PHONE}
                </a>
              </dd>
            </div>
            <div className="flex items-center justify-between gap-4 border-b border-line pb-3 dark:border-white/10">
              <dt className="flex items-center gap-2 text-machine dark:text-fog">
                <MailIcon />
                {t('email')}
              </dt>
              <dd>
                <a href={`mailto:${EMAIL}`} className="font-semibold text-blueprint dark:text-skyline" dir="ltr">
                  {EMAIL}
                </a>
              </dd>
            </div>
            <div className="flex items-center justify-between gap-4">
              <dt className="flex items-center gap-2 text-machine dark:text-fog">
                <WhatsAppIcon />
                WhatsApp
              </dt>
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
