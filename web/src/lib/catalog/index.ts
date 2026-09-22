import type { AppLocale } from '@/i18n/routing';
import { CATEGORIES, PRODUCTS, WA_NUMBER } from './seed';
import { localized, type CatalogState, type Category, type Product } from './types';

export * from './types';

/*
 * Catalog data access. Backed by the in-repo seed today; the same async surface
 * will be served from Supabase (RLS-filtered, published only) in a later phase
 * without changing any page.
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
  return PRODUCTS.filter(
    (product) =>
      visibleKeys.has(product.cat) &&
      (cat === 'all' || product.cat === cat) &&
      (sub === 'all' || product.sub === sub)
  );
}

export async function getProduct(code: string): Promise<Product | undefined> {
  return PRODUCTS.find((product) => product.code === code);
}

export async function getProductsByCodes(codes: string[]): Promise<Product[]> {
  return codes
    .map((code) => PRODUCTS.find((product) => product.code === code))
    .filter((product): product is Product => Boolean(product));
}

export async function getRelatedProducts(
  product: Product,
  locale: AppLocale,
  limit = 3
): Promise<Product[]> {
  const visibleKeys = new Set(
    CATEGORIES.filter((category) => category.visibleIn.includes(locale)).map((category) => category.key)
  );
  return PRODUCTS.filter(
    (candidate) =>
      candidate.code !== product.code &&
      candidate.cat === product.cat &&
      visibleKeys.has(candidate.cat)
  ).slice(0, limit);
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
