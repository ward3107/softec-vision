import Image from 'next/image';
import { getLocale, getTranslations } from 'next-intl/server';
import { Link } from '@/i18n/navigation';
import { localized, publicSpecs, type Product } from '@/lib/catalog';
import type { AppLocale } from '@/i18n/routing';
import CompareButton from './CompareButton';

export default async function ProductCard({ product }: { product: Product }) {
  const locale = (await getLocale()) as AppLocale;
  const t = await getTranslations('catalog');
  const name = localized(product.name, locale);
  const firstSpec = publicSpecs(product)[0];
  const cue = firstSpec ? localized(firstSpec.value, locale) : '';
  const imageAlt = product.imageAlt
    ? localized(product.imageAlt, locale)
    : `${name} (${product.code}) — ${t('productImage')}`;

  return (
    <article className="flex h-full flex-col gap-3">
      <Link href={`/product/${product.code}`} className="group block">
        <div className="aspect-[4/3] overflow-hidden rounded border border-line bg-pure">
          <Image
            src={product.image}
            alt={imageAlt}
            width={640}
            height={480}
            className="h-full w-full object-contain transition-transform duration-300 group-hover:scale-[1.02]"
          />
        </div>
        <div className="mt-3">
          <span className="text-xs font-semibold text-machine" dir="ltr">
            {product.code}
          </span>
          <h3 className="text-lg font-bold leading-snug">{name}</h3>
          <p className="mt-1 text-sm text-machine">{cue}</p>
        </div>
      </Link>
      <div className="mt-auto flex flex-wrap items-center gap-2 pt-1">
        <Link
          href={`/product/${product.code}`}
          className="inline-flex min-h-[44px] items-center rounded bg-blueprint px-4 text-sm font-bold text-pure hover:bg-graphite"
        >
          {t('details')}
        </Link>
        <CompareButton code={product.code} />
      </div>
    </article>
  );
}
