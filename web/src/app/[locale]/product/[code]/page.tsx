import type { Metadata } from 'next';
import Image from 'next/image';
import { notFound } from 'next/navigation';
import { getTranslations, setRequestLocale } from 'next-intl/server';
import { Link } from '@/i18n/navigation';
import { routing } from '@/i18n/routing';
import type { AppLocale } from '@/i18n/routing';
import {
  buildInquiryUrl,
  getProduct,
  getRelatedProducts,
  isPlaceholder,
  localized
} from '@/lib/catalog';
import { PRODUCTS } from '@/lib/catalog/seed';
import CompareButton from '@/components/catalog/CompareButton';
import ProductCard from '@/components/catalog/ProductCard';
import ShareButton from '@/components/widgets/ShareButton';

export function generateStaticParams() {
  return routing.locales.flatMap((locale) => PRODUCTS.map((p) => ({ locale, code: p.code })));
}

export async function generateMetadata({
  params
}: {
  params: Promise<{ locale: string; code: string }>;
}): Promise<Metadata> {
  const { locale, code } = await params;
  const product = await getProduct(code);
  if (!product) return {};
  const l = locale as AppLocale;
  return {
    title: `${localized(product.name, l)} · ${product.code} — Softec Vision`,
    description: localized(product.desc, l)
  };
}

export default async function ProductPage({
  params
}: {
  params: Promise<{ locale: string; code: string }>;
}) {
  const { locale, code } = await params;
  setRequestLocale(locale);
  const l = locale as AppLocale;

  const product = await getProduct(code);
  if (!product) notFound();

  const t = await getTranslations('product');
  const tc = await getTranslations('catalog');
  const related = await getRelatedProducts(product, l);
  const name = localized(product.name, l);

  return (
    <div className="mx-auto max-w-shell px-[clamp(20px,4.5vw,72px)] py-[clamp(28px,4vw,56px)] pb-28">
      <nav className="text-sm text-machine">
        <Link href="/catalog" className="hover:text-blueprint">
          {t('backToCatalog')}
        </Link>
        <span className="px-2">/</span>
        <span className="text-graphite" dir="ltr">
          {product.code}
        </span>
      </nav>

      <div className="mt-6 grid gap-8 lg:grid-cols-2">
        <div className="reveal reveal-left overflow-hidden rounded border border-line bg-pure">
          <Image
            src={product.image}
            alt={`${name} (${product.code}) — ${tc('productImage')}`}
            width={900}
            height={675}
            priority
            className="h-full w-full object-contain"
          />
        </div>

        <div className="reveal reveal-right">
          <span className="text-sm font-semibold text-machine" dir="ltr">
            {product.code}
          </span>
          <h1 className="text-[clamp(1.8rem,3.2vw,2.6rem)] font-extrabold tracking-tight">{name}</h1>
          <p className="mt-3 text-machine">{localized(product.desc, l)}</p>

          {product.specs.length > 0 && (
            <table className="mt-6 w-full border-collapse text-sm">
              <caption className="sr-only">{t('specifications')}</caption>
              <tbody>
                {product.specs.map((spec) => {
                  const value = localized(spec.value, l);
                  const placeholder = isPlaceholder(value);
                  return (
                    <tr key={spec.key} className="border-b border-line">
                      <th scope="row" className="py-2 pe-4 text-start font-medium text-machine">
                        {localized(spec.label, l)}
                      </th>
                      <td className={`py-2 ${placeholder ? 'italic text-machine/70' : 'text-graphite'}`}>
                        {placeholder ? t('toBeCompleted') : value}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}

          <div className="mt-6 flex flex-wrap gap-3">
            <a
              href={buildInquiryUrl(product, l)}
              target="_blank"
              rel="noopener"
              className="inline-flex min-h-[48px] items-center rounded bg-[#25D366] px-5 font-bold text-white hover:brightness-95"
            >
              {t('inquiry')}
            </a>
            <Link
              href={`/contact?product=${product.code}`}
              className="inline-flex min-h-[48px] items-center rounded bg-blueprint px-5 font-bold text-pure hover:bg-graphite"
            >
              {t('quote')}
            </Link>
            <CompareButton code={product.code} />
            <ShareButton title={`${name} (${product.code}) — Softec Vision`} text={localized(product.desc, l)} />
          </div>
        </div>
      </div>

      {related.length > 0 && (
        <section className="mt-14">
          <h2 className="text-xl font-bold">{t('related')}</h2>
          <div className="mt-4 grid gap-x-6 gap-y-10 sm:grid-cols-2 lg:grid-cols-3">
            {related.map((r) => (
              <ProductCard key={r.code} product={r} />
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
