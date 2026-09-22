import { getTranslations, setRequestLocale } from 'next-intl/server';
import type { AppLocale } from '@/i18n/routing';
import { buildInquiryUrl } from '@/lib/catalog';

const PHONE = '03-6968777';
const EMAIL = 'Alon@softec.co.il';

export default async function ContactPage({
  params
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const l = locale as AppLocale;
  const t = await getTranslations('contact');
  const whatsapp = buildInquiryUrl(null, l);

  return (
    <section className="mx-auto max-w-shell px-[clamp(20px,4.5vw,72px)] py-[clamp(36px,5vw,72px)]">
      <p className="mb-3 text-xs font-bold uppercase tracking-[0.12em] text-softec">{t('eyebrow')}</p>
      <div className="grid gap-10 lg:grid-cols-2">
        <div>
          <h1 className="max-w-[20ch] text-[clamp(2rem,3.5vw,3rem)] font-extrabold tracking-tight">
            {t('title')}
          </h1>
          <p className="mt-4 max-w-[52ch] text-lg text-machine">{t('body')}</p>
          <a
            href={whatsapp}
            target="_blank"
            rel="noopener"
            className="mt-6 inline-flex min-h-[48px] items-center rounded bg-[#25D366] px-6 font-bold text-white hover:brightness-95"
          >
            {t('whatsapp')}
          </a>
        </div>

        <div className="rounded border border-line bg-pure p-6">
          <h2 className="text-lg font-bold">{t('detailsTitle')}</h2>
          <dl className="mt-4 space-y-3 text-sm">
            <div className="flex justify-between gap-4 border-b border-line pb-3">
              <dt className="text-machine">{t('phone')}</dt>
              <dd>
                <a href={`tel:+972${PHONE.replace(/\D/g, '').slice(1)}`} className="font-semibold text-blueprint" dir="ltr">
                  {PHONE}
                </a>
              </dd>
            </div>
            <div className="flex justify-between gap-4 border-b border-line pb-3">
              <dt className="text-machine">{t('email')}</dt>
              <dd>
                <a href={`mailto:${EMAIL}`} className="font-semibold text-blueprint" dir="ltr">
                  {EMAIL}
                </a>
              </dd>
            </div>
            <div className="flex justify-between gap-4">
              <dt className="text-machine">WhatsApp</dt>
              <dd>
                <a href={whatsapp} target="_blank" rel="noopener" className="font-semibold text-blueprint" dir="ltr">
                  +972-54-474-2520
                </a>
              </dd>
            </div>
          </dl>
          <p className="mt-5 rounded border border-line bg-paper p-4 text-sm text-machine">{t('formNote')}</p>
        </div>
      </div>
    </section>
  );
}
