import { publicMediaUrl } from './media';
import { SPEC_LABELS } from './seed';
import { isPlaceholder, type Category, type Localized, type Product, type SpecEntry } from './types';

/*
 * Mapping between the Supabase catalog tables and the site's Product shape.
 * Text and specs come from the database (edited in the owner admin). Images
 * and gallery come from the database when the owner has uploaded one (see
 * product_media, managed from /admin/products/[code]); otherwise they stay
 * with the built-in catalog, matched by code — so a product is never left
 * with no photo at all.
 */

/** Columns the public site reads (published products only, via RLS). */
export const PRODUCT_SELECT = [
  'code',
  'sort',
  'category:categories!products_category_id_fkey(slug)',
  'sub:categories!products_subcategory_id_fkey(slug)',
  'product_translations(locale, name, description, alt_text)',
  'product_specs(value_translations, spec_field:spec_fields(key, sort))',
  'product_media(storage_path, kind, sort, alt_translations)'
].join(', ');

export interface DbProductMediaRow {
  storage_path: string;
  kind: 'image' | 'gallery';
  sort: number;
  alt_translations: Partial<Localized> | null;
}

export interface DbProductRow {
  code: string;
  sort: number;
  category: { slug: string } | null;
  sub: { slug: string } | null;
  product_translations: Array<{ locale: string; name: string; description: string; alt_text: string }>;
  product_specs: Array<{
    value_translations: Partial<Localized> | null;
    spec_field: { key: string; sort: number } | null;
  }>;
  product_media?: DbProductMediaRow[];
}

const isFilled = (value: string | undefined): value is string =>
  typeof value === 'string' && value.trim() !== '' && !isPlaceholder(value);

export function rowsToProducts(
  rows: DbProductRow[],
  builtIn: Product[],
  specLabels: Record<string, Localized> = SPEC_LABELS,
  supabaseUrl?: string
): Product[] {
  const byCode = new Map(builtIn.map((product) => [product.code, product]));
  const products: Product[] = [];

  for (const row of rows) {
    const base = byCode.get(row.code);
    if (!base) continue; // no image for it yet — cannot be shown

    const he = row.product_translations.find((t) => t.locale === 'he');
    const en = row.product_translations.find((t) => t.locale === 'en');
    const pick = (value: string | undefined, fallback: string) => (value && value.trim() ? value : fallback);

    const alt = {
      he: pick(he?.alt_text, base.imageAlt?.he ?? ''),
      en: pick(en?.alt_text, base.imageAlt?.en ?? '')
    };

    // An owner-uploaded photo (via /admin/products/[code]) replaces the
    // built-in one; otherwise the site keeps showing the built-in catalog's
    // image so a product is never left without a photo.
    const media = row.product_media ?? [];
    const primaryMedia = media.filter((m) => m.kind === 'image').sort((a, b) => a.sort - b.sort)[0];
    const galleryMedia = media.filter((m) => m.kind === 'gallery').sort((a, b) => a.sort - b.sort);
    const image = supabaseUrl && primaryMedia ? publicMediaUrl(supabaseUrl, primaryMedia.storage_path) : base.image;
    const gallery =
      supabaseUrl && galleryMedia.length > 0
        ? galleryMedia.map((m) => ({
            src: publicMediaUrl(supabaseUrl, m.storage_path),
            alt: {
              he: pick(m.alt_translations?.he, alt.he),
              en: pick(m.alt_translations?.en, alt.en)
            }
          }))
        : base.gallery;

    const specs: SpecEntry[] = row.product_specs
      .filter((spec) => spec.spec_field && specLabels[spec.spec_field.key])
      .filter((spec) => isFilled(spec.value_translations?.he) && isFilled(spec.value_translations?.en))
      .sort((a, b) => a.spec_field!.sort - b.spec_field!.sort)
      .map((spec) => ({
        key: spec.spec_field!.key,
        label: specLabels[spec.spec_field!.key],
        value: { he: spec.value_translations!.he!.trim(), en: spec.value_translations!.en!.trim() }
      }));

    products.push({
      code: row.code,
      cat: row.category?.slug ?? base.cat,
      sub: row.sub?.slug ?? undefined,
      name: { he: pick(he?.name, base.name.he), en: pick(en?.name, base.name.en) },
      desc: { he: pick(he?.description, base.desc.he), en: pick(en?.description, base.desc.en) },
      image,
      imageAlt: alt.he || alt.en ? alt : undefined,
      gallery,
      specs,
      model3d: base.model3d
    });
  }
  return products;
}

type Translations<T> = { he: T; en: T };

export interface ImportPayload {
  locales: Array<{ code: 'he' | 'en'; name: string; dir: 'rtl' | 'ltr'; is_default: boolean; sort: number }>;
  categories: Array<{
    slug: string;
    parent: string | null;
    sort: number;
    visible_in: string[];
    translations: Translations<{ name: string; description: string }>;
  }>;
  specFields: Array<{ key: string; sort: number; labels: Localized }>;
  products: Array<{
    code: string;
    cat: string;
    sub: string | null;
    sort: number;
    translations: Translations<{ name: string; description: string; alt_text: string }>;
    specs: Array<{ key: string; value: Localized }>;
  }>;
}

/** The built-in catalog as one import_catalog() payload (confirmed specs only). */
export function buildImportPayload(
  categories: Category[],
  products: Product[],
  specLabels: Record<string, Localized>
): ImportPayload {
  return {
    locales: [
      { code: 'he', name: 'עברית', dir: 'rtl', is_default: true, sort: 0 },
      { code: 'en', name: 'English', dir: 'ltr', is_default: false, sort: 1 }
    ],
    categories: categories.flatMap((category, index) => [
      {
        slug: category.key,
        parent: null,
        sort: index,
        visible_in: [...category.visibleIn],
        translations: {
          he: { name: category.label.he, description: category.description.he },
          en: { name: category.label.en, description: category.description.en }
        }
      },
      ...(category.subs ?? []).map((sub, subIndex) => ({
        slug: sub.key,
        parent: category.key,
        sort: subIndex,
        visible_in: [...category.visibleIn],
        translations: {
          he: { name: sub.label.he, description: '' },
          en: { name: sub.label.en, description: '' }
        }
      }))
    ]),
    specFields: Object.entries(specLabels).map(([key, labels], sort) => ({ key, sort, labels })),
    products: products.map((product, sort) => ({
      code: product.code,
      cat: product.cat,
      sub: product.sub ?? null,
      sort,
      translations: {
        he: { name: product.name.he, description: product.desc.he, alt_text: product.imageAlt?.he ?? '' },
        en: { name: product.name.en, description: product.desc.en, alt_text: product.imageAlt?.en ?? '' }
      },
      specs: product.specs
        .filter((spec) => isFilled(spec.value.he) && isFilled(spec.value.en))
        .map((spec) => ({ key: spec.key, value: { he: spec.value.he, en: spec.value.en } }))
    }))
  };
}
