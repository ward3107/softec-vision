import { describe, expect, it } from 'vitest';
import { CATEGORIES, PRODUCTS } from './seed';
import {
  getRelatedProducts,
  isPlaceholder,
  localized,
  missingSpecKeys,
  publicSpecs,
  type Product
} from './index';
import type { AppLocale } from '@/i18n/routing';

const LOCALES: AppLocale[] = ['he', 'en'];
const byCode = (code: string) => PRODUCTS.find((p) => p.code === code) as Product;
const visibleIn = (product: Product, locale: AppLocale) =>
  CATEGORIES.find((c) => c.key === product.cat)?.visibleIn.includes(locale) ?? false;

describe('publicSpecs', () => {
  it('never exposes placeholder values to visitors', () => {
    for (const product of PRODUCTS) {
      for (const spec of publicSpecs(product)) {
        for (const locale of LOCALES) {
          expect(isPlaceholder(localized(spec.value, locale)), `${product.code}.${spec.key}`).toBe(false);
        }
      }
    }
  });

  it('keeps confirmed specs in their original order', () => {
    expect(publicSpecs(byCode('LS-1000LPT')).map((s) => s.key)).toEqual(['displays', 'finish', 'cable']);
  });
});

describe('missingSpecKeys', () => {
  it('lists the specs still awaiting owner confirmation', () => {
    expect(missingSpecKeys(byCode('LS-1000LPT'))).toEqual(['dimensions', 'weight', 'power']);
  });

  it('is empty for a spec list with no placeholders', () => {
    const product = { ...byCode('LS-1000LPT'), specs: publicSpecs(byCode('LS-1000LPT')) };
    expect(missingSpecKeys(product)).toEqual([]);
  });
});

describe('catalog content integrity', () => {
  it('gives every product a real name and description in both languages', () => {
    for (const product of PRODUCTS) {
      for (const locale of LOCALES) {
        const name = localized(product.name, locale);
        const desc = localized(product.desc, locale);
        expect(name.length, `${product.code} name/${locale}`).toBeGreaterThan(3);
        expect(desc.length, `${product.code} desc/${locale}`).toBeGreaterThan(40);
        expect(isPlaceholder(name) || isPlaceholder(desc)).toBe(false);
      }
    }
  });

  it('gives every product descriptive primary-image alt text in both languages', () => {
    for (const product of PRODUCTS) {
      expect(product.imageAlt, `${product.code} imageAlt`).toBeDefined();
      for (const locale of LOCALES) {
        const alt = localized(product.imageAlt!, locale);
        // More than a label: it must describe what is shown.
        expect(alt.split(/\s+/).length, `${product.code} alt/${locale}`).toBeGreaterThanOrEqual(5);
        expect(isPlaceholder(alt)).toBe(false);
      }
    }
  });

  it('files every product under a real category and a subcategory of that category', () => {
    for (const product of PRODUCTS) {
      const category = CATEGORIES.find((c) => c.key === product.cat);
      expect(category, `${product.code} category`).toBeDefined();
      if (product.sub) {
        expect(category!.subs?.some((s) => s.key === product.sub), `${product.code} sub`).toBe(true);
      }
    }
  });

  it('makes no unverified standards or certification claims in specs', () => {
    for (const product of PRODUCTS) {
      for (const spec of product.specs) {
        for (const locale of LOCALES) {
          expect(localized(spec.value, locale), `${product.code}.${spec.key}`).not.toMatch(
            /standard|certif|compliant|תקן|תקני|מוסמך|אישור/i
          );
        }
      }
    }
  });
});

describe('getRelatedProducts', () => {
  it('never returns the product itself and caps at the limit', async () => {
    for (const product of PRODUCTS) {
      const related = await getRelatedProducts(product, 'en');
      expect(related.some((r) => r.code === product.code)).toBe(false);
      expect(related.length).toBeLessThanOrEqual(3);
    }
  });

  it('always suggests something for every product a visitor can open', async () => {
    for (const locale of LOCALES) {
      for (const product of PRODUCTS.filter((p) => visibleIn(p, locale))) {
        const related = await getRelatedProducts(product, locale);
        expect(related.length, `${product.code}/${locale}`).toBeGreaterThan(0);
      }
    }
  });

  it('prefers the same subcategory, then the same category', async () => {
    const related = await getRelatedProducts(byCode('RAV-500'), 'en');
    expect(related[0].code).toBe('ACCESSIBLE-TLV'); // only other accessible podium
    expect(related.every((r) => r.cat === 'podium')).toBe(true);
  });

  it('only suggests products whose category is shown in that language', async () => {
    for (const locale of LOCALES) {
      for (const product of PRODUCTS) {
        for (const related of await getRelatedProducts(product, locale)) {
          expect(visibleIn(related, locale), `${related.code}/${locale}`).toBe(true);
        }
      }
    }
  });
});
