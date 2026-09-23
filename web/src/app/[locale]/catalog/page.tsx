import type { Metadata } from 'next';
import Image from 'next/image';
import { getTranslations, setRequestLocale } from 'next-intl/server';
import { Link } from '@/i18n/navigation';
import { filterProducts, getVisibleCategories, localized } from '@/lib/catalog';
import type { AppLocale } from '@/i18n/routing';
import { pageMetadata } from '@/lib/seo';
import ProductCard from '@/components/catalog/ProductCard';
import ProductScroller from '@/components/catalog/ProductScroller';

export async function generateMetadata({
  params
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const nav = await getTranslations({ locale, namespace: 'nav' });
  const cat = await getTranslations({ locale, namespace: 'catalog' });
  return pageMetadata({ locale: locale as AppLocale, path: '/catalog', title: nav('products'), description: cat('body') });
}

export default async function CatalogPage({
  params
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const l = locale as AppLocale;

  const t = await getTranslations('catalog');
  const categories = await getVisibleCategories(l);
  const products = await filterProducts({ lang: l, cat: 'all', sub: 'all' });
  const categoryImage = (key: string) => products.find((p) => p.cat === key)?.image;

  return (
    <div className="mx-auto max-w-shell px-[clamp(20px,4.5vw,72px)] py-[clamp(36px,5vw,72px)] pb-28">
      <header className="max-w-2xl">
        <h1 className="text-[clamp(2rem,3.5vw,3rem)] font-extrabold tracking-tight">{t('title')}</h1>
        <p className="mt-3 text-lg text-machine dark:text-fog">{t('body')}</p>
      </header>

      {/* Product families */}
      <ul className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {categories.map((category) => {
          const image = categoryImage(category.key);
          return (
            <li key={category.key}>
              <Link
                href={`/catalog/${category.key}`}
                className="group flex h-full flex-col overflow-hidden rounded border border-line bg-pure hover:border-blueprint dark:border-white/10 dark:bg-surface dark:hover:border-skyline"
              >
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
                <div className="flex flex-1 flex-col gap-2 p-6">
                  <span className="text-lg font-bold">{localized(category.label, l)}</span>
                  <span className="text-sm text-machine dark:text-fog">{localized(category.description, l)}</span>
                  {category.subs?.length ? (
                    <span className="mt-auto pt-2 text-xs font-semibold text-blueprint dark:text-skyline">
                      {category.subs.length} {t('subcategoryCount')}
                    </span>
                  ) : null}
                </div>
              </Link>
            </li>
          );
        })}
      </ul>

      {/* All products */}
      <p className="mt-12 text-sm font-semibold text-machine dark:text-fog">
        {products.length} {t('statusCount')}
      </p>
      <ProductScroller>
        {products.map((product) => (
          <ProductCard key={product.code} product={product} />
        ))}
      </ProductScroller>
    </div>
  );
}
