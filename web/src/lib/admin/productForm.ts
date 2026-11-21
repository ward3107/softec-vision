// Shared between the server (validation, DB mapping) and the client edit
// form. Deliberately has no 'server-only' import so ProductForm.tsx (a
// Client Component) can import types and pure functions from here.
import { isPlaceholder } from '@/lib/catalog/types';

export const PRODUCT_STATUSES = ['draft', 'published', 'archived'] as const;
export type ProductStatus = (typeof PRODUCT_STATUSES)[number];

/** Character limits mirrored from the form so client and server agree. */
export const PRODUCT_LIMITS = { name: 120, description: 2000, alt: 200, spec: 300 } as const;

export type ProductFormError = 'required' | 'tooLong' | 'placeholder' | 'bothLanguages' | 'invalid';

export interface ParsedProductForm {
  status: ProductStatus;
  category?: string;
  subcategory?: string;
  translations: {
    he: { name: string; description: string; alt_text: string };
    en: { name: string; description: string; alt_text: string };
  };
  specs: Array<{ key: string; value: { he: string; en: string } }>;
}

export interface AdminProductRow {
  code: string;
  status: ProductStatus;
  category: string;
  name: string;
  missing: string[]; // spec keys still unconfirmed (no owner value yet)
}

export interface AdminProductDetail {
  code: string;
  status: ProductStatus;
  cat: string;
  sub: string | null;
  translations: ParsedProductForm['translations'];
  specs: Record<string, { he: string; en: string }>;
}

/** Collapse newlines/whitespace to keep short text fields on one line. */
export const normalizeFieldValue = (value: string) => value.replace(/\s*\r?\n\s*/g, ' ').trim();

/**
 * Validate and normalize a product-edit form. Placeholder text ("[to be
 * completed]") is refused outright so an unconfirmed value can never be
 * published by mistake; incomplete spec translations can be saved and completed later.
 */
export function parseProductForm(
  fd: FormData,
  specKeys: string[]
): { ok: true; data: ParsedProductForm } | { ok: false; errors: Record<string, ProductFormError> } {
  const errors: Record<string, ProductFormError> = {};
  const status = String(fd.get('status') ?? '');
  if (!PRODUCT_STATUSES.includes(status as ProductStatus)) errors.status = 'invalid';

  const field = (key: string, limit: number, required: boolean) => {
    const raw = normalizeFieldValue(String(fd.get(key) ?? ''));
    if (required && raw === '') errors[key] = 'required';
    else if (raw.length > limit) errors[key] = 'tooLong';
    else if (isPlaceholder(raw)) errors[key] = 'placeholder';
    return raw;
  };

  const translations = {
    he: {
      name: field('name.he', PRODUCT_LIMITS.name, status === 'published'),
      description: field('description.he', PRODUCT_LIMITS.description, status === 'published'),
      alt_text: field('alt.he', PRODUCT_LIMITS.alt, false)
    },
    en: {
      name: field('name.en', PRODUCT_LIMITS.name, status === 'published'),
      description: field('description.en', PRODUCT_LIMITS.description, status === 'published'),
      alt_text: field('alt.en', PRODUCT_LIMITS.alt, false)
    }
  };

  const specs: ParsedProductForm['specs'] = [];
  for (const key of specKeys) {
    const he = field(`spec.${key}.he`, PRODUCT_LIMITS.spec, false);
    const en = field(`spec.${key}.en`, PRODUCT_LIMITS.spec, false);
    if (errors[`spec.${key}.he`] || errors[`spec.${key}.en`]) continue;
    if (he === '' && en === '') continue;
    // An untranslated specification stays hidden publicly until completed.
    specs.push({ key, value: { he, en } });
  }

  if (Object.keys(errors).length > 0) return { ok: false, errors };
  return { ok: true, data: { status: status as ProductStatus, translations, specs, category: String(fd.get('category') ?? '') || undefined, subcategory: String(fd.get('subcategory') ?? '') } };
}

const TEXT_FIELD_NAMES = ['code', 'status', 'category', 'subcategory', 'name.he', 'name.en', 'description.he', 'description.en', 'alt.he', 'alt.en'] as const;

/**
 * Echo back whatever was submitted (unvalidated), so a rejected submission
 * never silently loses what the owner typed.
 */
export function echoFormValues(fd: FormData, specKeys: string[]): Record<string, string> {
  const names = [...TEXT_FIELD_NAMES, ...specKeys.flatMap((key) => [`spec.${key}.he`, `spec.${key}.en`])];
  return Object.fromEntries(names.map((name) => [name, normalizeFieldValue(String(fd.get(name) ?? ''))]));
}

/** The flat field values a successfully saved form produced (for redisplay). */
export function valuesFromParsedForm(data: ParsedProductForm, specKeys: string[]): Record<string, string> {
  const bySpec = Object.fromEntries(data.specs.map((s) => [s.key, s.value]));
  const values: Record<string, string> = {
    status: data.status,
    category: data.category ?? '',
    subcategory: data.subcategory ?? '',
    'name.he': data.translations.he.name,
    'name.en': data.translations.en.name,
    'description.he': data.translations.he.description,
    'description.en': data.translations.en.description,
    'alt.he': data.translations.he.alt_text,
    'alt.en': data.translations.en.alt_text
  };
  for (const key of specKeys) {
    values[`spec.${key}.he`] = bySpec[key]?.he ?? '';
    values[`spec.${key}.en`] = bySpec[key]?.en ?? '';
  }
  return values;
}

export function validProductCode(code: string): boolean {
  return /^[A-Za-z0-9][A-Za-z0-9_-]{0,63}$/.test(code) && code.toLowerCase() !== 'new';
}
