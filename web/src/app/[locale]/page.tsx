import Image from 'next/image';
import { getTranslations, setRequestLocale } from 'next-intl/server';
import { Link } from '@/i18n/navigation';
import type { AppLocale } from '@/i18n/routing';
import { filterProducts, getVisibleCategories, localized } from '@/lib/catalog';
import { FAQ_COUNT, resolveText } from '@/lib/content/blocks';
import { loadContentBlocks } from '@/lib/content/source';
import JsonLd, { faqSchema } from '@/components/JsonLd';
import CategoryExplorer, { type ExplorerCategory, type ExplorerItem } from '@/components/catalog/CategoryExplorer';
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
  const tprocess = await getTranslations('process');
  const tabout = await getTranslations('about');
  const tfaq = await getTranslations('faq');
  const tnav = await getTranslations('nav');
  const heroProof = t.raw('proof') as string[];

  const sections = [
    { id: 'top', label: tnav('home') },
    { id: 'families', label: tnav('products') },
    { id: 'how', label: tnav('process') },
    { id: 'why', label: tnav('about') },
    { id: 'faq', label: tnav('faq') },
    { id: 'contact', label: tnav('contact') }
  ];

  const processSteps = [
    { n: '01', t: tprocess('s1t'), b: tprocess('s1b') },
    { n: '02', t: tprocess('s2t'), b: tprocess('s2b') },
    { n: '03', t: tprocess('s3t'), b: tprocess('s3b') },
    { n: '04', t: tprocess('s4t'), b: tprocess('s4b') }
  ];
  const whyPoints = [tabout('why1'), tabout('why2'), tabout('why3'), tabout('why4')];

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
  const faqItems = Array.from({ length: FAQ_COUNT }, (_, i) => {
    const q = `q${i + 1}`;
    const a = `a${i + 1}`;
    return { q: resolveText(blocks, 'home.faq', l, q, tfaq(q)), a: resolveText(blocks, 'home.faq', l, a, tfaq(a)) };
  });

  const allProducts = await filterProducts({ lang: l, cat: 'all' });
  const categories = await getVisibleCategories(l);
  // One tile per family. Families with subcategories open onto them (those that
  // have products), the rest onto their products.
  const explorer: ExplorerCategory[] = categories.map((category) => {
    const inFamily = allProducts.filter((p) => p.cat === category.key);
    const items: ExplorerItem[] = category.subs?.length
      ? category.subs.flatMap((s) => {
          const inSub = inFamily.filter((p) => p.sub === s.key);
          if (inSub.length === 0) return [];
          return [{
            key: s.key,
            label: localized(s.label, l),
            meta: tcat('modelCount', { count: inSub.length }),
            image: inSub[0].image,
            alt: '',
            href: `/catalog/${category.key}?sub=${s.key}`
          }];
        })
      : inFamily.map((p) => ({ key: p.code, label: localized(p.name, l), meta: p.code, image: p.image, alt: '', href: `/product/${p.code}` }));
    return {
      key: category.key,
      label: localized(category.label, l),
      description: localized(category.description, l),
      image: inFamily[0]?.image,
      items
    };
  });
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

      {/* Product families — a tile per family; opening one shows its subcategories (or products) as pictures */}
      <section id="families" aria-labelledby="families-title" className="bg-pure dark:bg-surface">
        <div className="mx-auto max-w-shell px-[clamp(20px,4.5vw,72px)] py-[clamp(40px,5vw,80px)]">
          <div className="reveal reveal-left">
            <h2 id="families-title" className="text-[clamp(1.8rem,3vw,2.6rem)] font-extrabold tracking-tight">
              {tcat('title')}
            </h2>
            <p className="mt-2 max-w-2xl text-machine dark:text-fog">{tcat('body')}</p>
          </div>
          <div className="reveal reveal-up">
            <CategoryExplorer
              categories={explorer}
              labels={{ viewAll: tcat('exploreViewAll'), empty: tcat('exploreEmpty'), contact: t('quote') }}
            />
          </div>
        </div>
      </section>

      {/* How it works — the whole process (formerly its own page), set apart as a blueprint band */}
      <section id="how" aria-labelledby="how-title" className="relative overflow-hidden bg-blueprint text-pure">
        <div className="process-band__grid" aria-hidden="true" />
        <div className="relative mx-auto max-w-shell px-[clamp(20px,4.5vw,72px)] py-[clamp(48px,6vw,96px)]">
          <div className="reveal reveal-left max-w-2xl">
            <p className="mb-3 text-xs font-bold uppercase tracking-[0.12em] text-[#BFE3F8]">{tprocess('eyebrow')}</p>
            <h2 id="how-title" className="text-[clamp(1.9rem,3.2vw,2.8rem)] font-extrabold tracking-tight text-pure">
              {tprocess('title')}
            </h2>
            <p className="mt-3 text-lg text-[#DCEEF9]">{tprocess('body')}</p>
          </div>
          <ol className="reveal reveal-up relative mt-12 grid gap-8 before:absolute before:bottom-6 before:start-6 before:top-6 before:border-s-2 before:border-dashed before:border-white/40 lg:grid-cols-4 lg:gap-6 lg:before:bottom-auto lg:before:end-6 lg:before:border-s-0 lg:before:border-t-2">
            {processSteps.map((step) => (
              <li key={step.n} className="relative ps-16 lg:ps-0 lg:pt-16">
                <span className="absolute start-0 top-0 z-10 grid h-12 w-12 place-items-center rounded-full border-2 border-pure bg-blueprint text-lg font-extrabold text-pure">
                  {step.n}
                </span>
                <h3 className="text-lg font-bold text-pure">{step.t}</h3>
                <p className="mt-2 leading-relaxed text-[#DCEEF9]">{step.b}</p>
              </li>
            ))}
          </ol>
          <div className="reveal reveal-up mt-12 flex flex-col gap-4 rounded border border-white/25 bg-white/10 p-6 sm:flex-row sm:items-start">
            <svg
              className="h-10 w-10 flex-none text-pure rtl:-scale-x-100"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.75"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
            >
              <path d="M3 6h11v9H3zM14 9h4l3 3v3h-7" />
              <circle cx="7" cy="17.5" r="1.75" />
              <circle cx="17" cy="17.5" r="1.75" />
            </svg>
            <div>
              <h3 className="text-lg font-bold text-pure">{tprocess('deliveryTitle')}</h3>
              <p className="mt-1 max-w-[70ch] leading-relaxed text-[#DCEEF9]">{tprocess('deliveryBody')}</p>
            </div>
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

      {/* Why Softec Vision */}
      <section id="why" aria-labelledby="why-title" className="bg-[#E6F2FA] dark:bg-[#0D1C27]">
        <div className="mx-auto max-w-shell px-[clamp(20px,4.5vw,72px)] py-[clamp(40px,5vw,80px)]">
          <h2 id="why-title" className="reveal reveal-left text-[clamp(1.8rem,3vw,2.6rem)] font-extrabold tracking-tight">
            {tabout('whyTitle')}
          </h2>
          <ul className="reveal reveal-up mt-8 grid gap-5 sm:grid-cols-2">
            {whyPoints.map((point) => (
              <li key={point} className="flex items-start gap-3 rounded border border-[#CFE3F1] bg-pure p-5 shadow-sm dark:border-white/10 dark:bg-surface">
                <svg
                  className="mt-0.5 h-5 w-5 flex-none text-softec"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  aria-hidden="true"
                >
                  <path d="M20 6 9 17l-5-5" />
                </svg>
                <p className="font-semibold leading-snug">{point}</p>
              </li>
            ))}
          </ul>
          <Link href="/about" className="reveal reveal-up mt-6 inline-flex font-bold text-blueprint hover:underline dark:text-skyline">
            {tnav('about')} →
          </Link>
        </div>
      </section>

      {/* FAQ — native <details>, so it works without JS; the same pairs feed the FAQPage schema */}
      <section id="faq" aria-labelledby="faq-title" className="bg-[#E3E9EE] dark:bg-canvas">
        <JsonLd data={faqSchema(faqItems)} />
        <div className="mx-auto grid max-w-shell gap-8 px-[clamp(20px,4.5vw,72px)] py-[clamp(40px,5vw,80px)] lg:grid-cols-[0.8fr_1.2fr] lg:gap-14">
          <div className="reveal reveal-left">
            <p className="mb-2 text-xs font-bold uppercase tracking-[0.12em] text-blueprint dark:text-skyline">
              {tfaq('eyebrow')}
            </p>
            <h2 id="faq-title" className="text-[clamp(1.8rem,3vw,2.6rem)] font-extrabold tracking-tight">
              {tfaq('title')}
            </h2>
            {/* darker than text-machine: machine grey is below AA contrast on this section's tint */}
            <p className="mt-2 max-w-md text-[#4A5259] dark:text-fog">{tfaq('body')}</p>
          </div>
          <div className="reveal reveal-up divide-y divide-line rounded-md border border-line bg-pure px-5 shadow-sm sm:px-7 dark:divide-white/10 dark:border-white/10 dark:bg-surface">
            {faqItems.map((item, i) => (
              <details key={i} open={i === 0} className="group">
                <summary className="flex min-h-[56px] cursor-pointer list-none items-center justify-between gap-4 py-4 hover:text-blueprint dark:hover:text-skyline [&::-webkit-details-marker]:hidden">
                  <h3 className="text-lg font-bold leading-snug">{item.q}</h3>
                  <svg
                    className="h-5 w-5 flex-none text-blueprint transition-transform duration-200 group-open:rotate-45 dark:text-skyline"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2.5"
                    strokeLinecap="round"
                    aria-hidden="true"
                  >
                    <path d="M12 5v14M5 12h14" />
                  </svg>
                </summary>
                <p className="max-w-[62ch] pb-5 pe-9 leading-relaxed text-machine dark:text-fog">{item.a}</p>
              </details>
            ))}
          </div>
        </div>
      </section>

      {/* Contact CTA */}
      <section id="contact" className="bg-pure dark:bg-surface">
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
