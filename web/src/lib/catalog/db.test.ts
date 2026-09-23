import { describe, expect, it } from 'vitest';
import { buildImportPayload, rowsToProducts, type DbProductRow } from './db';
import { CATEGORIES, PRODUCTS, SPEC_LABELS } from './seed';
import { isPlaceholder, type Product } from './types';

const base: Product = {
  code: 'X-1',
  cat: 'podium',
  sub: 'smart',
  name: { he: 'שם', en: 'Name' },
  desc: { he: 'תיאור', en: 'Description' },
  image: '/products/x.jpg',
  imageAlt: { he: 'חלופי', en: 'Alt' },
  gallery: [{ src: '/products/x-2.jpg', alt: { he: 'צד', en: 'Side' } }],
  specs: [],
  model3d: '/models/x.glb'
};

const row = (overrides: Partial<DbProductRow> = {}): DbProductRow => ({
  code: 'X-1',
  sort: 0,
  category: { slug: 'podium' },
  sub: { slug: 'smart' },
  product_translations: [
    { locale: 'he', name: 'שם מעודכן', description: 'תיאור מעודכן', alt_text: 'טקסט חלופי' },
    { locale: 'en', name: 'Updated name', description: 'Updated description', alt_text: 'Alt text' }
  ],
  product_specs: [
    { value_translations: { he: '40 ק"ג', en: '40 kg' }, spec_field: { key: 'weight', sort: 3 } },
    { value_translations: { he: '2 מסכים', en: '2 displays' }, spec_field: { key: 'displays', sort: 0 } }
  ],
  ...overrides
});

describe('rowsToProducts', () => {
  it('takes text and specs from the database and media from the built-in catalog', () => {
    const [product] = rowsToProducts([row()], [base]);
    expect(product.name).toEqual({ he: 'שם מעודכן', en: 'Updated name' });
    expect(product.desc).toEqual({ he: 'תיאור מעודכן', en: 'Updated description' });
    expect(product.imageAlt).toEqual({ he: 'טקסט חלופי', en: 'Alt text' });
    expect(product.image).toBe(base.image);
    expect(product.gallery).toEqual(base.gallery);
    expect(product.model3d).toBe(base.model3d);
    expect(product.cat).toBe('podium');
    expect(product.sub).toBe('smart');
  });

  it('orders specs by field order and labels them from the canonical list', () => {
    const [product] = rowsToProducts([row()], [base]);
    expect(product.specs.map((s) => s.key)).toEqual(['displays', 'weight']);
    expect(product.specs[0].label).toEqual(SPEC_LABELS.displays);
  });

  it('drops specs missing a language, holding a placeholder, or with an unknown field', () => {
    const [product] = rowsToProducts(
      [
        row({
          product_specs: [
            { value_translations: { he: 'לבן', en: '' }, spec_field: { key: 'finish', sort: 1 } },
            { value_translations: { he: '[למילוי]', en: '[To be completed]' }, spec_field: { key: 'power', sort: 4 } },
            { value_translations: { he: 'x', en: 'x' }, spec_field: { key: 'not-a-field', sort: 9 } },
            { value_translations: null, spec_field: null }
          ]
        })
      ],
      [base]
    );
    expect(product.specs).toEqual([]);
  });

  it('falls back to built-in text when a translation row is missing', () => {
    const [product] = rowsToProducts(
      [row({ product_translations: [{ locale: 'he', name: 'רק עברית', description: 'ת', alt_text: '' }] })],
      [base]
    );
    expect(product.name).toEqual({ he: 'רק עברית', en: 'Name' });
    expect(product.imageAlt).toEqual({ he: 'חלופי', en: 'Alt' });
  });

  it('skips products that have no built-in image yet, keeping database order', () => {
    const other: Product = { ...base, code: 'Y-2' };
    const products = rowsToProducts(
      [row({ code: 'Y-2', sort: 0 }), row({ code: 'UNKNOWN', sort: 1 }), row({ code: 'X-1', sort: 2 })],
      [base, other]
    );
    expect(products.map((p) => p.code)).toEqual(['Y-2', 'X-1']);
  });

  it('treats a missing subcategory as none', () => {
    const [product] = rowsToProducts([row({ sub: null })], [base]);
    expect(product.sub).toBeUndefined();
  });

  it('keeps the built-in image and gallery when no supabase URL is given, even with uploaded media', () => {
    const [product] = rowsToProducts(
      [row({ product_media: [{ storage_path: 'X-1/image-1.webp', kind: 'image', sort: 0, alt_translations: null }] })],
      [base]
    );
    expect(product.image).toBe(base.image);
    expect(product.gallery).toEqual(base.gallery);
  });

  it('prefers an owner-uploaded primary image over the built-in one', () => {
    const [product] = rowsToProducts(
      [
        row({
          product_media: [
            { storage_path: 'X-1/image-2.webp', kind: 'image', sort: 1, alt_translations: null },
            { storage_path: 'X-1/image-1.webp', kind: 'image', sort: 0, alt_translations: null }
          ]
        })
      ],
      [base],
      undefined,
      'https://proj.supabase.co'
    );
    expect(product.image).toBe('https://proj.supabase.co/storage/v1/object/public/product-media/X-1/image-1.webp');
  });

  it('prefers an owner-uploaded gallery over the built-in one, ordered and with per-image alt text', () => {
    const [product] = rowsToProducts(
      [
        row({
          product_media: [
            { storage_path: 'X-1/g-2.webp', kind: 'gallery', sort: 1, alt_translations: { he: 'תמונה 2', en: 'View 2' } },
            { storage_path: 'X-1/g-1.webp', kind: 'gallery', sort: 0, alt_translations: null }
          ]
        })
      ],
      [base],
      undefined,
      'https://proj.supabase.co'
    );
    expect(product.gallery).toEqual([
      {
        src: 'https://proj.supabase.co/storage/v1/object/public/product-media/X-1/g-1.webp',
        alt: { he: 'טקסט חלופי', en: 'Alt text' }
      },
      {
        src: 'https://proj.supabase.co/storage/v1/object/public/product-media/X-1/g-2.webp',
        alt: { he: 'תמונה 2', en: 'View 2' }
      }
    ]);
  });

  it('falls back to the built-in image when no primary image was uploaded, even with a supabase URL', () => {
    const [product] = rowsToProducts([row()], [base], undefined, 'https://proj.supabase.co');
    expect(product.image).toBe(base.image);
    expect(product.gallery).toEqual(base.gallery);
  });
});

describe('buildImportPayload', () => {
  const payload = buildImportPayload(CATEGORIES, PRODUCTS, SPEC_LABELS);

  it('includes every category and subcategory, subcategories after their parent', () => {
    const slugs = payload.categories.map((c) => c.slug);
    for (const category of CATEGORIES) {
      expect(slugs).toContain(category.key);
      for (const sub of category.subs ?? []) {
        const entry = payload.categories.find((c) => c.slug === sub.key)!;
        expect(entry.parent).toBe(category.key);
        expect(entry.visible_in).toEqual(category.visibleIn);
        expect(slugs.indexOf(sub.key)).toBeGreaterThan(slugs.indexOf(category.key));
      }
    }
  });

  it('includes every product in catalog order with both languages', () => {
    expect(payload.products.map((p) => p.code)).toEqual(PRODUCTS.map((p) => p.code));
    payload.products.forEach((p, index) => {
      expect(p.sort).toBe(index);
      expect(p.translations.he.name).toBeTruthy();
      expect(p.translations.en.name).toBeTruthy();
    });
  });

  it('never imports unconfirmed spec values', () => {
    for (const product of payload.products) {
      for (const spec of product.specs) {
        expect(isPlaceholder(spec.value.he)).toBe(false);
        expect(isPlaceholder(spec.value.en)).toBe(false);
      }
    }
    const withPlaceholders = PRODUCTS.find((p) => p.specs.some((s) => isPlaceholder(s.value.en)))!;
    const imported = payload.products.find((p) => p.code === withPlaceholders.code)!;
    expect(imported.specs.length).toBeLessThan(withPlaceholders.specs.length);
  });

  it('lists the canonical spec fields in order', () => {
    expect(payload.specFields.map((f) => f.key)).toEqual(Object.keys(SPEC_LABELS));
    expect(payload.specFields[0].sort).toBe(0);
  });

  it('declares both site languages', () => {
    expect(payload.locales.map((l) => l.code)).toEqual(['he', 'en']);
  });
});
