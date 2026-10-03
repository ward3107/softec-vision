import Image from 'next/image';
import { getLocale, getTranslations } from 'next-intl/server';
import { Link } from '@/i18n/navigation';
import { localized, publicSpecs, type Product } from '@/lib/catalog';
import type { AppLocale } from '@/i18n/routing';

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
    <article className="h-full">
      <Link
        href={`/product/${product.code}`}
        className="group flex h-full flex-col overflow-hidden rounded-[20px] border border-line bg-pure shadow-[0_10px_35px_rgba(12,32,48,0.07)] transition-[border-color,box-shadow,transform] hover:-translate-y-1 hover:border-softec hover:shadow-[0_18px_45px_rgba(12,94,145,0.14)]"
      >
        <div className="min-h-[148px] px-5 pb-3 pt-5 sm:px-6 sm:pt-6">
          <span className="text-xs font-bold tracking-[0.08em] text-blueprint" dir="ltr">
            {product.code}
          </span>
          <h3 className="mt-1 text-xl font-extrabold leading-snug text-graphite group-hover:text-blueprint">{name}</h3>
          {cue ? <p className="mt-2 text-sm leading-relaxed text-machine">{cue}</p> : null}
        </div>
        <div className="mt-auto aspect-[4/3] overflow-hidden border-t border-line bg-[#F8FBFD]">
          <Image
            src={product.image}
            alt={imageAlt}
            width={800}
            height={600}
            quality={90}
            sizes="(min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw"
            className="h-full w-full scale-[1.08] object-contain transition-transform duration-300 group-hover:scale-[1.12]"
          />
        </div>
      </Link>
    </article>
  );
}
