import Image from 'next/image';
import { getTranslations, setRequestLocale } from 'next-intl/server';
import { Link } from '@/i18n/navigation';
import type { AppLocale } from '@/i18n/routing';
import { filterProducts } from '@/lib/catalog';
import ProductCard from '@/components/catalog/ProductCard';

export default async function HomePage({
  params
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const l = locale as AppLocale;

  const t = await getTranslations('hero');
  const c = await getTranslations('capabilities');
  const tcat = await getTranslations('catalog');
  const tcustom = await getTranslations('custom');
  const tcontact = await getTranslations('contact');

  const featured = (await filterProducts({ lang: l, cat: 'all' })).slice(0, 3);
  const stages = [
    { n: '01', t: tcustom('s1t'), b: tcustom('s1b') },
    { n: '02', t: tcustom('s2t'), b: tcustom('s2b') },
    { n: '03', t: tcustom('s3t'), b: tcustom('s3b') }
  ];

  return (
    <>
      {/* Hero */}
      <section className="bg-paper">
        <div className="mx-auto grid max-w-shell items-center gap-8 px-[clamp(20px,4.5vw,72px)] py-[clamp(36px,5vw,76px)] lg:grid-cols-2">
          <div className="reveal reveal-left">
            <p className="mb-4 text-xs font-bold uppercase tracking-[0.12em] text-softec">{t('eyebrow')}</p>
            <h1 className="text-[clamp(2.25rem,4.5vw,3.6rem)] font-extrabold leading-[1.08] tracking-tight">
              {t('title')}
            </h1>
            <p className="mt-5 max-w-[48ch] text-lg leading-relaxed text-machine">{t('body')}</p>
            <div className="mt-7 flex flex-wrap gap-3">
              <Link href="/contact" className="inline-flex min-h-[48px] items-center justify-center rounded bg-blueprint px-6 font-bold text-pure hover:bg-graphite">
                {t('quote')}
              </Link>
              <Link href="/catalog" className="inline-flex min-h-[48px] items-center justify-center rounded border border-line px-6 font-bold text-graphite hover:border-machine hover:bg-pure">
                {t('explore')}
              </Link>
            </div>
          </div>

          <div className="reveal reveal-right rounded border border-line bg-pure p-4">
            <div className="aspect-[4/3] overflow-hidden rounded bg-paper">
              <Image
                src="/products/LS-1000LPT.jpg"
                alt={`${t('model')} (LS-1000LPT)`}
                width={900}
                height={675}
                priority
                className="h-full w-full object-contain"
              />
            </div>
            <p className="mt-3 flex items-center justify-between px-1 text-sm">
              <span dir="ltr" className="font-bold text-graphite">LS-1000LPT</span>
              <span className="text-machine">{t('model')}</span>
            </p>
          </div>
        </div>
      </section>

      {/* Capabilities */}
      <section aria-label="Capabilities" className="border-y border-line bg-pure">
        <div className="mx-auto grid max-w-shell gap-4 px-[clamp(20px,4.5vw,72px)] py-8 sm:grid-cols-3">
          {[c('custom'), c('av'), c('accessible')].map((label, i) => (
            <p key={label} className={`reveal reveal-up reveal-d${i + 1} border-s-2 border-softec ps-4 text-lg font-semibold`}>
              {label}
            </p>
          ))}
        </div>
      </section>

      {/* Featured products */}
      <section aria-labelledby="featured-title" className="bg-paper">
        <div className="mx-auto max-w-shell px-[clamp(20px,4.5vw,72px)] py-[clamp(40px,5vw,80px)]">
          <div className="reveal reveal-left flex flex-wrap items-end justify-between gap-4">
            <div>
              <h2 id="featured-title" className="text-[clamp(1.8rem,3vw,2.6rem)] font-extrabold tracking-tight">
                {tcat('title')}
              </h2>
              <p className="mt-2 text-machine">{tcat('body')}</p>
            </div>
            <Link href="/catalog" className="font-bold text-blueprint hover:underline">
              {t('explore')} →
            </Link>
          </div>
          <div className="reveal reveal-up mt-8 grid gap-x-6 gap-y-10 sm:grid-cols-2 lg:grid-cols-3">
            {featured.map((product) => (
              <ProductCard key={product.code} product={product} />
            ))}
          </div>
        </div>
      </section>

      {/* Custom manufacturing story */}
      <section aria-labelledby="custom-title" className="bg-graphite text-paper">
        <div className="mx-auto grid max-w-shell gap-10 px-[clamp(20px,4.5vw,72px)] py-[clamp(40px,6vw,88px)] lg:grid-cols-2">
          <div className="reveal reveal-left">
            <p className="mb-3 text-xs font-bold uppercase tracking-[0.12em] text-softec">{tcustom('eyebrow')}</p>
            <h2 id="custom-title" className="max-w-[19ch] text-[clamp(1.9rem,3.2vw,2.8rem)] font-extrabold tracking-tight text-pure">
              {tcustom('title')}
            </h2>
            <p className="mt-4 max-w-[47ch] text-lg leading-relaxed text-paper">{tcustom('body')}</p>
            <Link href="/contact" className="mt-7 inline-flex min-h-[48px] items-center rounded bg-pure px-6 font-bold text-graphite hover:bg-paper">
              {tcustom('action')}
            </Link>
          </div>
          <ol className="list-none">
            {stages.map((stage, i) => (
              <li key={stage.n} className={`reveal reveal-right reveal-d${i + 1} relative border-t border-machine py-5 ps-14`}>
                <span className="absolute start-0 top-5 text-pure">{stage.n}</span>
                <h3 className="mb-1 text-lg font-bold text-pure">{stage.t}</h3>
                <p className="text-paper">{stage.b}</p>
              </li>
            ))}
          </ol>
        </div>
      </section>

      {/* Contact CTA */}
      <section className="bg-paper">
        <div className="reveal reveal-up mx-auto flex max-w-shell flex-wrap items-center justify-between gap-6 px-[clamp(20px,4.5vw,72px)] py-[clamp(40px,5vw,72px)]">
          <div>
            <h2 className="max-w-[22ch] text-[clamp(1.7rem,3vw,2.4rem)] font-extrabold tracking-tight">
              {tcontact('title')}
            </h2>
            <p className="mt-2 max-w-[52ch] text-machine">{tcontact('body')}</p>
          </div>
          <Link href="/contact" className="inline-flex min-h-[48px] flex-none items-center rounded bg-blueprint px-6 font-bold text-pure hover:bg-graphite">
            {t('quote')}
          </Link>
        </div>
      </section>
    </>
  );
}
