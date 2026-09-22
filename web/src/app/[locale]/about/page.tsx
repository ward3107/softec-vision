import { getTranslations, setRequestLocale } from 'next-intl/server';

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
        <div>
          <h1 className="text-[clamp(2rem,3.5vw,3rem)] font-extrabold tracking-tight">{t('title')}</h1>
          <p className="mt-4 text-lg text-machine">{t('body')}</p>
          <p className="mt-3 text-lg text-machine">{t('detail')}</p>
        </div>
        <div>
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
