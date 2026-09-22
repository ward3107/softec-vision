import { getTranslations, setRequestLocale } from 'next-intl/server';

export default async function ProcessPage({
  params
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations('process');
  const steps = [
    { n: '01', t: t('s1t'), b: t('s1b') },
    { n: '02', t: t('s2t'), b: t('s2b') },
    { n: '03', t: t('s3t'), b: t('s3b') },
    { n: '04', t: t('s4t'), b: t('s4b') }
  ];

  return (
    <section className="mx-auto max-w-shell px-[clamp(20px,4.5vw,72px)] py-[clamp(36px,5vw,72px)]">
      <p className="mb-3 text-xs font-bold uppercase tracking-[0.12em] text-softec">{t('eyebrow')}</p>
      <h1 className="max-w-2xl text-[clamp(2rem,3.5vw,3rem)] font-extrabold tracking-tight">{t('title')}</h1>
      <p className="mt-3 max-w-2xl text-lg text-machine">{t('body')}</p>

      <ol className="mt-10 grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
        {steps.map((step, i) => (
          <li key={step.n} className={`reveal reveal-up reveal-d${i + 1} border-t-2 border-line pt-5`}>

            <span className="text-base font-bold text-blueprint" aria-hidden="true">
              {step.n}
            </span>
            <h2 className="mt-3 text-lg font-bold">{step.t}</h2>
            <p className="mt-2 text-machine">{step.b}</p>
          </li>
        ))}
      </ol>
    </section>
  );
}
