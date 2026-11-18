import type { Metadata } from 'next';
import Image from 'next/image';
import { notFound } from 'next/navigation';
import { getTranslations, setRequestLocale } from 'next-intl/server';
import { Link } from '@/i18n/navigation';
import {
  filterProducts,
  getVisibleCategories,
  localized,
  normalizeCatalogState
} from '@/lib/catalog';
import type { AppLocale } from '@/i18n/routing';
import { pageMetadata } from '@/lib/seo';
import BackButton from '@/components/BackButton';
import ProductCard from '@/components/catalog/ProductCard';
import ProductScroller from '@/components/catalog/ProductScroller';

export async function generateMetadata({
  params
}: {
  params: Promise<{ locale: string; category: string }>;
}): Promise<Metadata> {
  const { locale, category } = await params;
  const l = locale as AppLocale;
  const cat = (await getVisibleCategories(l)).find((c) => c.key === category);
  if (!cat) return {};
  return pageMetadata({
    locale: l,
    path: `/catalog/${category}`,
    title: localized(cat.label, l),
    description: localized(cat.description, l),
    locales: cat.visibleIn
  });
}

export default async function CategoryPage({
  params,
  searchParams
}: {
  params: Promise<{ locale: string; category: string }>;
  searchParams: Promise<{ sub?: string; leaf?: string }>;
}) {
  const { locale, category } = await params;
  const { sub, leaf } = await searchParams;
  setRequestLocale(locale);
  const l = locale as AppLocale;

  const visible = await getVisibleCategories(l);
  const cat = visible.find((c) => c.key === category);
  if (!cat) notFound();

  const state = normalizeCatalogState({ lang: l, cat: category, sub, leaf }, visible);
  const products = await filterProducts(state);
  const categoryProducts = await filterProducts({ lang: l, cat: category, sub: 'all' });
  const subImage = (subKey: string) => categoryProducts.find((p) => p.sub === subKey)?.image;
  const t = await getTranslations('catalog');

  const subs = cat.subs ?? [];
  const activeSub = subs.find(item => item.key === state.sub);
  const activeLeaf = activeSub?.children?.find(item => item.key === state.leaf);
  const rootHref = `/catalog/${cat.key}`;
  const parentHref = activeSub ? `${rootHref}?sub=${activeSub.key}` : rootHref;
  const title = localized((activeLeaf ?? activeSub ?? cat).label, l);
  const subLinkClass = (active: boolean) =>
    `inline-flex min-h-[44px] whitespace-nowrap items-center gap-2 rounded border px-2.5 text-sm font-semibold hover:bg-paper dark:hover:bg-canvas ${
      active ? 'border-blueprint bg-paper dark:border-skyline dark:bg-canvas' : 'border-line dark:border-white/10'
    }`;
  const subThumb = 'h-9 w-11 flex-none rounded-sm border border-line bg-pure object-contain dark:border-white/10 dark:bg-surface';

  return (
    <div className="mx-auto max-w-shell px-[clamp(20px,4.5vw,72px)] pt-4 pb-24 sm:py-[clamp(36px,5vw,72px)] sm:pb-28">
      <BackButton
        fallbackHref={activeLeaf ? parentHref : activeSub ? rootHref : '/catalog'}
        label={t('back')}
      />
      <nav className="mt-3 text-sm text-machine sm:mt-5 dark:text-fog">
        <Link href="/catalog" className="hover:text-blueprint dark:hover:text-skyline">
          {t('title')}
        </Link>
        <span className="px-2">/</span>
        {activeSub ? <Link href={rootHref}>{localized(cat.label, l)}</Link> : localized(cat.label, l)}
        {activeSub && <> / {activeLeaf ? <Link href={parentHref}>{localized(activeSub.label, l)}</Link> : localized(activeSub.label, l)}</>}
        {activeLeaf && <> / {localized(activeLeaf.label, l)}</>}
      </nav>

      <h1 className="mt-2 text-[clamp(1.8rem,3.2vw,2.6rem)] sm:mt-3 font-extrabold tracking-tight">
        {title}
      </h1>
      <p className="mt-1 max-w-2xl text-machine sm:mt-2 dark:text-fog">{localized(cat.description, l)}</p>

      {subs.length > 0 && (
        <ul className="mt-3 -mx-1 flex snap-x snap-mandatory flex-nowrap gap-2 overflow-x-auto overscroll-x-contain px-1 pb-1 sm:pb-2 [scrollbar-width:thin] [-webkit-overflow-scrolling:touch]">
          <li className="flex-none snap-start">
            <Link
              href={`/catalog/${cat.key}`}
              aria-current={state.sub === 'all' ? 'page' : undefined}
              className={`${subLinkClass(state.sub === 'all')} px-4`}
            >
              {t('all')}
            </Link>
          </li>
          {subs.map((s) => {
            const thumb = subImage(s.key);
            return (
              <li key={s.key} className="flex-none snap-start">
                <Link
                  href={`/catalog/${cat.key}?sub=${s.key}`}
                  aria-current={state.sub === s.key ? 'page' : undefined}
                  className={subLinkClass(state.sub === s.key)}
                >
                  {thumb ? (
                    <Image src={thumb} alt="" width={44} height={36} className={subThumb} />
                  ) : null}
                  {localized(s.label, l)}
                </Link>
              </li>
            );
          })}
        </ul>
      )}

      {activeSub?.children && activeSub.children.length > 0 && (
        <nav aria-label={localized(activeSub.label, l)} className="mt-3 flex flex-wrap gap-2">
          <Link href={parentHref} className={subLinkClass(!activeLeaf)} aria-current={!activeLeaf ? 'page' : undefined}>{t('all')}</Link>
          {activeSub.children.map(child => <Link key={child.key}
            href={`${parentHref}&leaf=${child.key}`} className={subLinkClass(child.key === state.leaf)}
            aria-current={child.key === state.leaf ? 'page' : undefined}>{localized(child.label, l)}</Link>)}
        </nav>
      )}

      {products.length > 0 ? (
        <ProductScroller
          caption={`${products.length} ${t('statusCount')}`}
          labels={{ region: localized(cat.label, l), previous: t('scrollPrevious'), next: t('scrollNext') }}
        >
          {products.map((product) => (
            <ProductCard key={product.code} product={product} />
          ))}
        </ProductScroller>
      ) : (
        <div className="mt-8 rounded border border-line bg-paper p-8 dark:border-white/10 dark:bg-canvas">
          <p className="text-lg font-bold">{t('emptyTitle')}</p>
          <p className="mt-1 text-machine dark:text-fog">
            {t('emptyBody')}{' '}
            <Link href="/contact" className="font-bold text-blueprint hover:underline dark:text-skyline">
              {t('customAction')}
            </Link>
          </p>
        </div>
      )}
    </div>
  );
}
