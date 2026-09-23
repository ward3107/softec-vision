import type { AppLocale } from '@/i18n/routing';

export type Localized = { he: string; en: string };

export interface Subcategory {
  key: string;
  label: Localized;
}

export interface Category {
  key: string;
  label: Localized;
  description: Localized;
  /** Languages this category is shown in (charging-carts is English-only). */
  visibleIn: AppLocale[];
  subs?: Subcategory[];
}

export interface SpecEntry {
  /** Canonical key, so the comparison table can align rows across models. */
  key: string;
  label: Localized;
  value: Localized;
}

export interface Product {
  code: string;
  cat: string;
  sub?: string;
  name: Localized;
  desc: Localized;
  /** Public path under /public (Supabase Storage in production). */
  image: string;
  /** A product-specific alternative description for the primary image. */
  imageAlt?: Localized;
  /** Additional product views. The primary image remains the catalog thumbnail. */
  gallery?: Array<{ src: string; alt: Localized }>;
  specs: SpecEntry[];
  model3d?: string;
  /** Ordered frames for a drag-to-rotate viewer (front-half only), when one exists. */
  spin?: string[];
}

export interface CatalogState {
  lang: AppLocale;
  cat: string;
  sub: string;
}

/** Resolve a localized value with a safe fallback to Hebrew. */
export function localized(value: Localized, locale: AppLocale): string {
  return value[locale] || value.he || '';
}

const PLACEHOLDERS = ['[למילוי]', '[To be completed]'];
export function isPlaceholder(value: string): boolean {
  return PLACEHOLDERS.some((token) => value.includes(token));
}
