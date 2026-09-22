import { getTranslations, setRequestLocale } from 'next-intl/server';
import { Link } from '@/i18n/navigation';
import { filterProducts, getVisibleCategories, localized } from '@/lib/catalog';
import type { AppLocale } from '@/i18n/routing';
import ProductCard from '@/components/catalog/ProductCard';

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

  return (
    <div className="mx-auto max-w-shell px-[clamp(20px,4.5vw,72px)] py-[clamp(36px,5vw,72px)] pb-28">
      <header className="max-w-2xl">
        <h1 className="text-[clamp(2rem,3.5vw,3rem)] font-extrabold tracking-tight">{t('title')}</h1>
        <p className="mt-3 text-lg text-machine">{t('body')}</p>
      </header>

      {/* Product families */}
      <ul className="mt-10 grid gap-px overflow-hidden rounded border border-line bg-line sm:grid-cols-2 lg:grid-cols-3">
        {categories.map((category) => (
          <li key={category.key}>
            <Link
              href={`/catalog/${category.key}`}
              className="flex h-full flex-col gap-2 border-s-[3px] border-transparent bg-pure p-6 hover:border-blueprint hover:bg-paper"
            >
              <span className="text-lg font-bold">{localized(category.label, l)}</span>
              <span className="text-sm text-machine">{localized(category.description, l)}</span>
              {category.subs?.length ? (
                <span className="mt-auto pt-2 text-xs font-semibold text-blueprint">
                  {category.subs.length} {t('subcategoryCount')}
                </span>
              ) : null}
            </Link>
          </li>
        ))}
      </ul>

      {/* All products */}
      <p className="mt-12 text-sm font-semibold text-machine">
        {products.length} {t('statusCount')}
      </p>
      <div className="mt-4 grid gap-x-6 gap-y-10 sm:grid-cols-2 lg:grid-cols-3">
        {products.map((product) => (
          <ProductCard key={product.code} product={product} />
        ))}
      </div>
    </div>
  );
}
