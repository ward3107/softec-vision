import type { Metadata } from 'next';
import { getTranslations, setRequestLocale } from 'next-intl/server';
import { filterProducts, getVisibleCategories, localized } from '@/lib/catalog';
import type { AppLocale } from '@/i18n/routing';
import { pageMetadata } from '@/lib/seo';
import ProductCard from '@/components/catalog/ProductCard';
import ProductScroller from '@/components/catalog/ProductScroller';
import CategoryScroller from '@/components/catalog/CategoryScroller';

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
      <CategoryScroller
        categories={categories.map((category) => ({
          key: category.key,
          label: localized(category.label, l),
          description: localized(category.description, l),
          image: categoryImage(category.key),
          count: category.subs?.length
            ? `${category.subs.length} ${t('subcategoryCount')}`
            : undefined
        }))}
        labels={{ region: t('title'), previous: t('scrollPrevious'), next: t('scrollNext') }}
      />

      {/* All products */}
      <ProductScroller
        caption={`${products.length} ${t('statusCount')}`}
        labels={{ region: t('title'), previous: t('scrollPrevious'), next: t('scrollNext') }}
      >
        {products.map((product) => (
          <ProductCard key={product.code} product={product} />
        ))}
      </ProductScroller>
    </div>
  );
}
