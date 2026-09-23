import type { AppLocale } from '@/i18n/routing';
import { CATEGORIES, WA_NUMBER } from './seed';
import { loadProducts } from './source';
import {
  isPlaceholder,
  localized,
  type CatalogState,
  type Category,
  type Product,
  type SpecEntry
} from './types';

export * from './types';

/*
 * Catalog data access. Categories are defined in code; products come from
 * Supabase (published only, edited in the owner admin) once the catalog has
 * been imported, and from the built-in catalog until then.
 */

export async function getVisibleCategories(locale: AppLocale): Promise<Category[]> {
  return CATEGORIES.filter((category) => category.visibleIn.includes(locale));
}

export async function getCategory(key: string): Promise<Category | undefined> {
  return CATEGORIES.find((category) => category.key === key);
}

/** Clamp arbitrary input to a valid, locale-appropriate catalog state. */
export function normalizeCatalogState(input: Partial<CatalogState>): CatalogState {
  const lang: AppLocale = input.lang === 'en' ? 'en' : 'he';
  const categories = CATEGORIES.filter((category) => category.visibleIn.includes(lang));
  const requested = categories.find((category) => category.key === input.cat);
  const cat = requested?.key ?? 'all';
  const category = categories.find((item) => item.key === cat);
  const sub = category?.subs?.some((item) => item.key === input.sub) ? (input.sub as string) : 'all';
  return { lang, cat, sub };
}

export async function filterProducts(input: Partial<CatalogState>): Promise<Product[]> {
  const { lang, cat, sub } = normalizeCatalogState(input);
  const visibleKeys = new Set(
    CATEGORIES.filter((category) => category.visibleIn.includes(lang)).map((category) => category.key)
  );
  return (await loadProducts()).filter(
    (product) =>
      visibleKeys.has(product.cat) &&
      (cat === 'all' || product.cat === cat) &&
      (sub === 'all' || product.sub === sub)
  );
}

/** Every published product, whatever its category's languages. */
export async function getAllProducts(): Promise<Product[]> {
  return loadProducts();
}

export async function getProduct(code: string): Promise<Product | undefined> {
  return (await loadProducts()).find((product) => product.code === code);
}

export async function getProductsByCodes(codes: string[]): Promise<Product[]> {
  const products = await loadProducts();
  return codes
    .map((code) => products.find((product) => product.code === code))
    .filter((product): product is Product => Boolean(product));
}

const specIsConfirmed = (spec: SpecEntry) =>
  !isPlaceholder(spec.value.he) && !isPlaceholder(spec.value.en);

/**
 * Specs a visitor may see. Values the owner has not yet confirmed stay in the
 * data (so they are tracked) but are never published.
 */
export function publicSpecs(product: Product): SpecEntry[] {
  return product.specs.filter(specIsConfirmed);
}

/** Spec keys still awaiting owner confirmation, in catalog order. */
export function missingSpecKeys(product: Product): string[] {
  return product.specs.filter((spec) => !specIsConfirmed(spec)).map((spec) => spec.key);
}

/**
 * Related products visible in this locale: same subcategory first, then the
 * same category, then the rest of the catalog — so a product that is alone in
 * its family still gets suggestions.
 */
export async function getRelatedProducts(
  product: Product,
  locale: AppLocale,
  limit = 3
): Promise<Product[]> {
  const visibleKeys = new Set(
    CATEGORIES.filter((category) => category.visibleIn.includes(locale)).map((category) => category.key)
  );
  const rank = (candidate: Product) => {
    if (product.sub && candidate.cat === product.cat && candidate.sub === product.sub) return 0;
    if (candidate.cat === product.cat) return 1;
    return 2;
  };
  return (await loadProducts())
    .filter((candidate) => candidate.code !== product.code && visibleKeys.has(candidate.cat))
    .map((candidate, index) => ({ candidate, index, score: rank(candidate) }))
    .sort((a, b) => a.score - b.score || a.index - b.index)
    .slice(0, limit)
    .map(({ candidate }) => candidate);
}

/** Localized WhatsApp inquiry link (general when no product is given). */
export function buildInquiryUrl(product: Product | null, locale: AppLocale): string {
  const message = !product
    ? locale === 'en'
      ? 'Hello, I would like a quote for a project with Softec Vision.'
      : 'שלום, אשמח לקבל הצעת מחיר לפרויקט עם Softec Vision.'
    : locale === 'en'
      ? `Hello, I would like details about ${localized(product.name, locale)} (${product.code}).`
      : `שלום, אשמח לקבל פרטים על ${localized(product.name, locale)} (${product.code}).`;
  return `https://wa.me/${WA_NUMBER}?text=${encodeURIComponent(message)}`;
}
