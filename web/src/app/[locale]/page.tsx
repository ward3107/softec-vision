import Image from 'next/image';
import { getTranslations, setRequestLocale } from 'next-intl/server';
import { Link } from '@/i18n/navigation';
import type { AppLocale } from '@/i18n/routing';
import { filterProducts, getVisibleCategories, localized } from '@/lib/catalog';
import { resolveText } from '@/lib/content/blocks';
import { loadContentBlocks } from '@/lib/content/source';
import ProductCard from '@/components/catalog/ProductCard';
import TypedText from '@/components/TypedText';
import SectionIndicator from '@/components/SectionIndicator';

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
  const tnav = await getTranslations('nav');
  const heroProof = t.raw('proof') as string[];

  const sections = [
    { id: 'top', label: tnav('home') },
    { id: 'families', label: tnav('products') },
    { id: 'featured', label: tcat('featured') },
    { id: 'custom', label: tcustom('eyebrow') },
    { id: 'contact', label: tnav('contact') }
  ];

  const blocks = await loadContentBlocks();
  const hero = {
    eyebrow: resolveText(blocks, 'home.hero', l, 'eyebrow', t('eyebrow')),
    title: resolveText(blocks, 'home.hero', l, 'title', t('title')),
    body: resolveText(blocks, 'home.hero', l, 'body', t('body'))
  };
  const capabilities = [
    { key: 'custom', label: resolveText(blocks, 'home.capabilities', l, 'custom', c('custom')) },
    { key: 'av', label: resolveText(blocks, 'home.capabilities', l, 'av', c('av')) },
    { key: 'accessible', label: resolveText(blocks, 'home.capabilities', l, 'accessible', c('accessible')) }
  ];

  const allProducts = await filterProducts({ lang: l, cat: 'all' });
  const featured = allProducts.slice(0, 3);
  const categories = await getVisibleCategories(l);
  const categoryImage = (key: string) => allProducts.find((p) => p.cat === key)?.image;
  const stages = [
    { n: '01', t: tcustom('s1t'), b: tcustom('s1b') },
    { n: '02', t: tcustom('s2t'), b: tcustom('s2b') },
    { n: '03', t: tcustom('s3t'), b: tcustom('s3b') }
  ];
  return (
    <>
      <SectionIndicator sections={sections} label={tnav('sections')} />
      <section id="top" className="home-hero overflow-hidden bg-pure dark:bg-surface">
        <div className="home-hero__blueprint" aria-hidden="true" />
        <div className="relative mx-auto grid min-h-[min(790px,calc(100svh-88px))] max-w-shell items-center gap-8 px-[clamp(20px,4.5vw,72px)] py-[clamp(48px,7vw,104px)] lg:grid-cols-[0.9fr_1.1fr]">
          <div className="relative z-10 max-w-[670px]">
              <p className="home-hero__eyebrow mb-5 text-sm font-bold text-blueprint dark:text-skyline">{hero.eyebrow}</p>
              <h1 className="max-w-[15ch] text-[clamp(2.7rem,5.4vw,5.25rem)] font-extrabold leading-[0.98] tracking-[-0.045em] text-graphite dark:text-ink">
                {hero.title}
              </h1>
              <TypedText
                text={hero.body}
                className="mt-7 max-w-[56ch] text-[clamp(1.05rem,1.6vw,1.3rem)] leading-[1.7] text-machine dark:text-fog"
              />
              <div className="mt-8 flex flex-wrap gap-3">
                <Link href="/contact" className="home-hero__primary inline-flex min-h-[52px] items-center justify-center rounded bg-blueprint px-7 font-bold text-pure">
                  {t('quote')}
                </Link>
                <Link
                  href="/catalog"
                  className="inline-flex min-h-[52px] items-center justify-center rounded border border-line bg-pure/80 px-7 font-bold text-graphite hover:border-blueprint hover:text-blueprint dark:border-white/10 dark:bg-surface/80 dark:text-ink dark:hover:border-skyline dark:hover:text-skyline"
                >
                  {t('explore')}
                </Link>
              </div>
              <ul className="mt-9 grid max-w-[650px] gap-3 border-t border-line pt-5 sm:grid-cols-3 dark:border-white/10">
                {heroProof.map((item) => (
                  <li key={item} className="flex items-start gap-2 text-sm font-semibold leading-snug text-graphite dark:text-ink">
                    <span className="mt-[0.45em] h-2 w-2 flex-none rounded-full bg-softec" aria-hidden="true" />
                    {item}
                  </li>
                ))}
              </ul>
          </div>

          <div className="home-hero__visual relative min-h-[390px] lg:min-h-[620px]">
            <div className="home-hero__orbit" aria-hidden="true" />
            <Image
              src="/products/RAV-500-transparent.webp"
              alt={`${t('model')} (RAV-500)`}
              width={1200}
              height={924}
              priority
              sizes="(max-width: 1023px) 92vw, 55vw"
              className="home-hero__product absolute inset-0 h-full w-full object-contain object-center"
            />
            <p className="home-hero__delivery absolute bottom-2 end-0 max-w-[250px] border-s-2 border-softec bg-pure/90 py-2 ps-4 text-sm font-semibold leading-relaxed text-machine backdrop-blur dark:bg-surface/90 dark:text-fog">
              {t('delivery')}
            </p>
          </div>
        </div>
      </section>

      {/* Capabilities */}
      <section aria-label="Capabilities" className="border-y border-line bg-pure dark:border-white/10 dark:bg-surface">
        <div className="mx-auto grid max-w-shell gap-4 px-[clamp(20px,4.5vw,72px)] py-8 sm:grid-cols-3">
          {capabilities.map(({ key, label }, i) => (
            <p key={key} className={`reveal reveal-up reveal-d${i + 1} border-s-2 border-softec ps-4 text-lg font-semibold`}>
              {label}
            </p>
          ))}
        </div>
      </section>

      {/* Product families — browse all categories and subcategories from home */}
      <section id="families" aria-labelledby="families-title" className="bg-pure dark:bg-surface">
        <div className="mx-auto max-w-shell px-[clamp(20px,4.5vw,72px)] py-[clamp(40px,5vw,80px)]">
          <div className="reveal reveal-left">
            <h2 id="families-title" className="text-[clamp(1.8rem,3vw,2.6rem)] font-extrabold tracking-tight">
              {tcat('title')}
            </h2>
            <p className="mt-2 max-w-2xl text-machine dark:text-fog">{tcat('body')}</p>
          </div>
          <ul className="reveal reveal-up mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {categories.map((category) => {
              const image = categoryImage(category.key);
              return (
                <li
                  key={category.key}
                  className="flex h-full flex-col overflow-hidden rounded border border-line bg-pure dark:border-white/10 dark:bg-surface"
                >
                  <Link href={`/catalog/${category.key}`} className="group block" aria-label={localized(category.label, l)}>
                    <div className="aspect-[16/10] overflow-hidden border-b border-line bg-paper dark:border-white/10 dark:bg-canvas">
                      {image ? (
                        <Image
                          src={image}
                          alt=""
                          width={520}
                          height={325}
                          quality={90}
                          sizes="(min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw"
                          className="h-full w-full object-contain transition-transform duration-300 group-hover:scale-[1.03]"
                        />
                      ) : null}
                    </div>
                  </Link>
                  <div className="flex flex-1 flex-col gap-2 p-5">
                    <Link href={`/catalog/${category.key}`} className="text-lg font-bold hover:text-blueprint dark:hover:text-skyline">
                      {localized(category.label, l)}
                    </Link>
                    <p className="text-sm text-machine dark:text-fog">{localized(category.description, l)}</p>
                    {category.subs?.length ? (
                      <ul className="mt-auto flex flex-wrap gap-2 pt-2">
                        {category.subs.map((s) => (
                          <li key={s.key}>
                            <Link
                              href={`/catalog/${category.key}?sub=${s.key}`}
                              className="inline-flex rounded border border-line px-2.5 py-1 text-xs font-semibold hover:border-blueprint hover:text-blueprint dark:border-white/10 dark:hover:border-skyline dark:hover:text-skyline"
                            >
                              {localized(s.label, l)}
                            </Link>
                          </li>
                        ))}
                      </ul>
                    ) : null}
                  </div>
                </li>
              );
            })}
          </ul>
        </div>
      </section>

      {/* Featured products */}
      <section id="featured" aria-labelledby="featured-title" className="bg-paper dark:bg-canvas">
        <div className="mx-auto max-w-shell px-[clamp(20px,4.5vw,72px)] py-[clamp(40px,5vw,80px)]">
          <div className="reveal reveal-left flex flex-wrap items-end justify-between gap-4">
            <h2 id="featured-title" className="text-[clamp(1.8rem,3vw,2.6rem)] font-extrabold tracking-tight">
              {tcat('featured')}
            </h2>
            <Link href="/catalog" className="font-bold text-blueprint hover:underline dark:text-skyline">
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
      <section id="custom" aria-labelledby="custom-title" className="bg-graphite text-paper">
        <div className="mx-auto grid max-w-shell gap-10 px-[clamp(20px,4.5vw,72px)] py-[clamp(40px,6vw,88px)] lg:grid-cols-2">
          <div className="reveal reveal-left">
            <p className="mb-3 text-xs font-bold uppercase tracking-[0.12em] text-[#7CC4EE]">{tcustom('eyebrow')}</p>
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
      <section id="contact" className="bg-paper dark:bg-canvas">
        <div className="reveal reveal-up mx-auto flex max-w-shell flex-wrap items-center justify-between gap-6 px-[clamp(20px,4.5vw,72px)] py-[clamp(40px,5vw,72px)]">
          <div>
            <h2 className="max-w-[22ch] text-[clamp(1.7rem,3vw,2.4rem)] font-extrabold tracking-tight">
              {tcontact('title')}
            </h2>
            <p className="mt-2 max-w-[52ch] text-machine dark:text-fog">{tcontact('body')}</p>
          </div>
          <Link href="/contact" className="inline-flex min-h-[48px] flex-none items-center rounded bg-blueprint px-6 font-bold text-pure hover:bg-graphite">
            {t('quote')}
          </Link>
        </div>
      </section>
    </>
  );
}
