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
import ProductCard from '@/components/catalog/ProductCard';

export default async function CategoryPage({
  params,
  searchParams
}: {
  params: Promise<{ locale: string; category: string }>;
  searchParams: Promise<{ sub?: string }>;
}) {
  const { locale, category } = await params;
  const { sub } = await searchParams;
  setRequestLocale(locale);
  const l = locale as AppLocale;

  const visible = await getVisibleCategories(l);
  const cat = visible.find((c) => c.key === category);
  if (!cat) notFound();

  const state = normalizeCatalogState({ lang: l, cat: category, sub });
  const products = await filterProducts(state);
  const t = await getTranslations('catalog');

  const subs = cat.subs ?? [];
  const subLinkClass = (active: boolean) =>
    `inline-flex min-h-[40px] items-center rounded border px-4 text-sm font-semibold hover:bg-paper ${
      active ? 'border-blueprint bg-paper' : 'border-line'
    }`;

  return (
    <div className="mx-auto max-w-shell px-[clamp(20px,4.5vw,72px)] py-[clamp(36px,5vw,72px)] pb-28">
      <nav className="text-sm text-machine">
        <Link href="/catalog" className="hover:text-blueprint">
          {t('title')}
        </Link>
        <span className="px-2">/</span>
        <span className="text-graphite">{localized(cat.label, l)}</span>
      </nav>

      <h1 className="mt-3 text-[clamp(1.8rem,3.2vw,2.6rem)] font-extrabold tracking-tight">
        {localized(cat.label, l)}
      </h1>
      <p className="mt-2 max-w-2xl text-machine">{localized(cat.description, l)}</p>

      {subs.length > 0 && (
        <ul className="mt-6 flex flex-wrap gap-2">
          <li>
            <Link
              href={`/catalog/${cat.key}`}
              aria-current={state.sub === 'all' ? 'page' : undefined}
              className={subLinkClass(state.sub === 'all')}
            >
              {t('all')}
            </Link>
          </li>
          {subs.map((s) => (
            <li key={s.key}>
              <Link
                href={`/catalog/${cat.key}?sub=${s.key}`}
                aria-current={state.sub === s.key ? 'page' : undefined}
                className={subLinkClass(state.sub === s.key)}
              >
                {localized(s.label, l)}
              </Link>
            </li>
          ))}
        </ul>
      )}

      {products.length > 0 ? (
        <>
          <p className="mt-8 text-sm font-semibold text-machine">
            {products.length} {t('statusCount')}
          </p>
          <div className="mt-4 grid gap-x-6 gap-y-10 sm:grid-cols-2 lg:grid-cols-3">
            {products.map((product) => (
              <ProductCard key={product.code} product={product} />
            ))}
          </div>
        </>
      ) : (
        <div className="mt-8 rounded border border-line bg-paper p-8">
          <p className="text-lg font-bold">{t('emptyTitle')}</p>
          <p className="mt-1 text-machine">
            {t('emptyBody')}{' '}
            <Link href="/contact" className="font-bold text-blueprint hover:underline">
              {t('customAction')}
            </Link>
          </p>
        </div>
      )}
    </div>
  );
}
