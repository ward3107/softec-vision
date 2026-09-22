import { getTranslations, setRequestLocale } from 'next-intl/server';
import { Link } from '@/i18n/navigation';

export default async function CustomPage({
  params
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations('custom');
  const stages = [
    { n: '01', t: t('s1t'), b: t('s1b') },
    { n: '02', t: t('s2t'), b: t('s2b') },
    { n: '03', t: t('s3t'), b: t('s3b') }
  ];

  return (
    <section className="bg-graphite text-paper">
      <div className="mx-auto grid max-w-shell gap-10 px-[clamp(20px,4.5vw,72px)] py-[clamp(40px,6vw,88px)] lg:grid-cols-2">
        <div className="reveal reveal-left">
          <p className="mb-3 text-xs font-bold uppercase tracking-[0.12em] text-softec">{t('eyebrow')}</p>
          <h1 className="max-w-[19ch] text-[clamp(2rem,3.5vw,3rem)] font-extrabold tracking-tight text-pure">
            {t('title')}
          </h1>
          <p className="mt-4 max-w-[47ch] text-lg leading-relaxed text-paper">{t('body')}</p>
          <Link
            href="/contact"
            className="mt-7 inline-flex min-h-[48px] items-center rounded bg-pure px-6 font-bold text-graphite hover:bg-paper"
          >
            {t('action')}
          </Link>
        </div>
        <ol className="list-none">
          {stages.map((stage, i) => (
            <li key={stage.n} className={`reveal reveal-right reveal-d${i + 1} relative border-t border-machine py-5 ps-14`}>
              <span className="absolute start-0 top-5 text-pure">{stage.n}</span>
              <h2 className="mb-1 text-lg font-bold text-pure">{stage.t}</h2>
              <p className="text-paper">{stage.b}</p>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}
