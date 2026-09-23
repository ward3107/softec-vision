import type { Metadata } from 'next';
import Image from 'next/image';
import { getTranslations, setRequestLocale } from 'next-intl/server';
import { Link } from '@/i18n/navigation';
import type { AppLocale } from '@/i18n/routing';
import {
  getProductsByCodes,
  localized,
  publicSpecs,
  type Localized
} from '@/lib/catalog';
import { pageMetadata } from '@/lib/seo';

export async function generateMetadata({
  params
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const c = await getTranslations({ locale, namespace: 'compare' });
  // The selected products vary by query string; every combination canonicalizes
  // to the clean /compare path so it is never treated as duplicate content.
  return pageMetadata({ locale: locale as AppLocale, path: '/compare', title: c('title'), description: c('instructions') });
}

export default async function ComparePage({
  params,
  searchParams
}: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ ids?: string }>;
}) {
  const { locale } = await params;
  const { ids } = await searchParams;
  setRequestLocale(locale);
  const l = locale as AppLocale;

  const t = await getTranslations('compare');
  const tp = await getTranslations('product');
  const codes = (ids ?? '').split(',').map((c) => c.trim()).filter(Boolean).slice(0, 3);
  const products = await getProductsByCodes(codes);

  if (products.length < 2) {
    return (
      <div className="mx-auto max-w-shell px-[clamp(20px,4.5vw,72px)] py-16">
        <h1 className="text-2xl font-extrabold">{t('title')}</h1>
        <p className="mt-3 text-machine">{t('minimum')}</p>
        <Link href="/catalog" className="mt-4 inline-block font-bold text-blueprint hover:underline">
          {tp('backToCatalog')}
        </Link>
      </div>
    );
  }

  // Union of confirmed spec keys in first-seen order, with a label per key.
  // Unconfirmed (placeholder) values are never published.
  const keys: string[] = [];
  const labels: Record<string, Localized> = {};
  for (const product of products) {
    for (const spec of publicSpecs(product)) {
      if (!keys.includes(spec.key)) {
        keys.push(spec.key);
        labels[spec.key] = spec.label;
      }
    }
  }
  const valueFor = (code: string, key: string): string => {
    const product = products.find((p) => p.code === code);
    const spec = product ? publicSpecs(product).find((s) => s.key === key) : undefined;
    return spec ? localized(spec.value, l) : '';
  };

  return (
    <div className="mx-auto max-w-shell px-[clamp(20px,4.5vw,72px)] py-[clamp(28px,4vw,56px)]">
      <h1 className="text-[clamp(1.8rem,3.2vw,2.6rem)] font-extrabold tracking-tight">{t('title')}</h1>
      <p className="mt-2 text-machine">{t('instructions')}</p>

      <div className="mt-8 overflow-x-auto" tabIndex={0} role="region" aria-label={t('title')}>
        <table className="w-full min-w-[560px] border-collapse text-sm">
          <thead>
            <tr>
              <th scope="col" className="w-40 py-3 text-start align-bottom">
                {tp('specifications')}
              </th>
              {products.map((product) => (
                <th key={product.code} scope="col" className="p-3 text-start align-bottom">
                  <span className="block overflow-hidden rounded border border-line bg-pure">
                    <Image
                      src={product.image}
                      alt=""
                      width={220}
                      height={165}
                      sizes="200px"
                      className="h-24 w-full object-contain"
                    />
                  </span>
                  <span className="mt-2 block text-xs font-semibold text-machine" dir="ltr">
                    {product.code}
                  </span>
                  <span className="block font-bold">{localized(product.name, l)}</span>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {keys.map((key) => (
              <tr key={key} className="border-t border-line">
                <th scope="row" className="py-3 pe-4 text-start font-medium text-machine">
                  {localized(labels[key], l)}
                </th>
                {products.map((product) => {
                  const value = valueFor(product.code, key);
                  return (
                    <td key={product.code} className={`py-3 pe-4 ${value ? 'text-graphite' : 'text-machine'}`}>
                      {value || (
                        <>
                          <span aria-hidden="true">—</span>
                          <span className="sr-only">{tp('notSpecified')}</span>
                        </>
                      )}
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <p className="mt-4 text-sm text-machine">{tp('detailsOnRequest')}</p>

      <Link href="/catalog" className="mt-6 inline-block font-bold text-blueprint hover:underline">
        {tp('backToCatalog')}
      </Link>
    </div>
  );
}
