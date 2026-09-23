import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { getTranslations, setRequestLocale } from 'next-intl/server';
import { Link } from '@/i18n/navigation';
import { routing } from '@/i18n/routing';
import type { AppLocale } from '@/i18n/routing';
import {
  buildInquiryUrl,
  getAllProducts,
  getProduct,
  getRelatedProducts,
  localized,
  publicSpecs
} from '@/lib/catalog';
import { CATEGORIES } from '@/lib/catalog/seed';
import { pageMetadata, SITE_URL, BRAND } from '@/lib/seo';
import CompareButton from '@/components/catalog/CompareButton';
import ProductCard from '@/components/catalog/ProductCard';
import ProductMediaSwitch from '@/components/catalog/ProductMediaSwitch';
import ProductViewTracker from '@/components/catalog/ProductViewTracker';
import ProductWhatsAppButton from '@/components/catalog/ProductWhatsAppButton';
import ShareButton from '@/components/widgets/ShareButton';
import JsonLd, { breadcrumbSchema } from '@/components/JsonLd';

const absoluteImage = (src: string) => (src.startsWith('http') ? src : `${SITE_URL}${src.startsWith('/') ? '' : '/'}${src}`);

export async function generateStaticParams() {
  const products = await getAllProducts();
  return routing.locales.flatMap((locale) => products.map((p) => ({ locale, code: p.code })));
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
  const cat = CATEGORIES.find((c) => c.key === product.cat);
  return pageMetadata({
    locale: l,
    path: `/product/${product.code}`,
    title: `${localized(product.name, l)} · ${product.code}`,
    description: localized(product.desc, l),
    locales: cat?.visibleIn,
    image: absoluteImage(product.image)
  });
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
  const tn = await getTranslations('nav');
  const related = await getRelatedProducts(product, l);
  const name = localized(product.name, l);
  const category = CATEGORIES.find((c) => c.key === product.cat);

  const productLd: Record<string, unknown> = {
    '@context': 'https://schema.org',
    '@type': 'Product',
    name,
    sku: product.code,
    mpn: product.code,
    image: [absoluteImage(product.image)],
    description: localized(product.desc, l),
    brand: { '@type': 'Brand', name: BRAND },
    manufacturer: { '@type': 'Organization', name: 'Softec Vision Ltd' },
    ...(category ? { category: localized(category.label, l) } : {})
  };
  const breadcrumbLd = breadcrumbSchema(l, [
    { name: BRAND, path: '' },
    { name: tn('products'), path: '/catalog' },
    ...(category ? [{ name: localized(category.label, l), path: `/catalog/${category.key}` }] : []),
    { name, path: `/product/${product.code}` }
  ]);
  const primaryAlt = product.imageAlt
    ? localized(product.imageAlt, l)
    : `${name} (${product.code}) — ${tc('productImage')}`;
  const gallery = product.gallery ?? [];
  const specs = publicSpecs(product);

  return (
    <div className="mx-auto max-w-shell px-[clamp(20px,4.5vw,72px)] py-[clamp(28px,4vw,56px)] pb-28">
      <JsonLd data={[productLd, breadcrumbLd]} />
      <ProductViewTracker code={product.code} />
      <nav className="text-sm text-machine dark:text-fog">
        <Link href="/catalog" className="hover:text-blueprint dark:hover:text-skyline">
          {t('backToCatalog')}
        </Link>
        <span className="px-2">/</span>
        <span className="text-graphite dark:text-ink" dir="ltr">
          {product.code}
        </span>
      </nav>

      <div className="mt-6 grid gap-8 lg:grid-cols-2">
        <div className="reveal reveal-left">
          <ProductMediaSwitch
            image={product.image}
            alt={primaryAlt}
            gallery={gallery.map((item) => ({ src: item.src, alt: localized(item.alt, l) }))}
            model3d={product.model3d}
            labels={{
              photos: t('viewPhotos'),
              model: t('view3D'),
              hint: t('media3dHint'),
              enlarge: t('enlarge'),
              lightbox: {
                close: t('close'),
                previous: t('previous'),
                next: t('next'),
                zoomIn: t('zoomIn'),
                zoomOut: t('zoomOut'),
                hint: t('zoomHint')
              }
            }}
          />
        </div>

        <div className="reveal reveal-right">
          <span className="text-sm font-semibold text-machine dark:text-fog" dir="ltr">
            {product.code}
          </span>
          <h1 className="text-[clamp(1.8rem,3.2vw,2.6rem)] font-extrabold tracking-tight">{name}</h1>
          <p className="mt-3 text-machine dark:text-fog">{localized(product.desc, l)}</p>

          {specs.length > 0 && (
            <section aria-labelledby="specs-title" className="mt-6">
              <h2 id="specs-title" className="text-base font-bold">
                {t('specifications')}
              </h2>
              <table className="mt-2 w-full border-collapse text-sm">
                <tbody>
                  {specs.map((spec) => (
                    <tr key={spec.key} className="border-b border-line dark:border-white/10">
                      <th scope="row" className="py-2 pe-4 text-start font-medium text-machine dark:text-fog">
                        {localized(spec.label, l)}
                      </th>
                      <td className="py-2 text-graphite dark:text-ink">{localized(spec.value, l)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </section>
          )}
          <p className="mt-3 text-sm text-machine dark:text-fog">{t('detailsOnRequest')}</p>

          <div className="mt-6 flex flex-wrap gap-3">
            <ProductWhatsAppButton href={buildInquiryUrl(product, l)} label={t('inquiry')} code={product.code} />
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
