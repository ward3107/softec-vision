import { describe, expect, it } from 'vitest';
import { BLOCK_KEYS, changedBlocks, isAllowedImage, parseEditorDocument } from './editor';
import { CONTENT_BLOCKS, contentAttributes, isContentHidden, resolveText } from './blocks';
import { SHIPPED_TEXT } from './defaults';
import { PRODUCTS } from '@/lib/catalog/seed';

const empty = () => Object.fromEntries(BLOCK_KEYS.map(key => [key, { he: {}, en: {} }]));
const origin = 'https://example.supabase.co';

describe('visual editor contract', () => {
  it('accepts every image offered by the shipped product library', () => {
    for (const product of PRODUCTS) expect(isAllowedImage(product.image, origin), product.code).toBe(true);
  });
  it('has defaults for every declared field and locale', () => {
    for (const key of BLOCK_KEYS) for (const l of ['he', 'en'] as const) {
      expect(Object.keys(SHIPPED_TEXT[key][l])).toEqual([...CONTENT_BLOCKS[key]]);
      expect(Object.values(SHIPPED_TEXT[key][l]).every(Boolean)).toBe(true);
    }
  });
  it('normalizes defaults without inventing changes', () => {
    const doc = parseEditorDocument(empty());
    expect(changedBlocks(doc, structuredClone(doc))).toEqual([]);
  });
  it('distinguishes removed content from reset-to-default, per language', () => {
    const doc = parseEditorDocument(empty());
    const modified = structuredClone(doc);
    modified['home.hero'].he['_hide.title'] = 'true';
    modified['home.hero'].he._hidden = 'true';
    expect(resolveText(modified, 'home.hero', 'he', 'title', 'Original')).toBe('');
    expect(resolveText(modified, 'home.hero', 'en', 'title', 'Original')).toBe('Original');
    expect(isContentHidden(modified, 'home.hero', 'he')).toBe(true);
    expect(contentAttributes(modified, 'home.hero', 'he').style).toEqual({ display: 'none' });
    expect(changedBlocks(doc, modified)).toEqual(['home.hero']);
    delete modified['home.hero'].he['_hide.title'];
    expect(resolveText(modified, 'home.hero', 'he', 'title', 'Original')).toBe('Original');
  });
  it('rejects unknown blocks, field names, missing languages and oversized text', () => {
    expect(() => parseEditorDocument(JSON.parse('{"__proto__":{}}'))).toThrow();
    expect(() => parseEditorDocument({ ...empty(), unknown: {} })).toThrow();
    const doc = parseEditorDocument(empty());
    doc['home.hero'].he.title = 'x'.repeat(601);
    expect(() => parseEditorDocument(doc)).toThrow();
    doc['home.hero'].he.title = 'okay'; doc['home.hero'].he.html = '<script>';
    expect(() => parseEditorDocument(doc)).toThrow();
    expect(() => parseEditorDocument({ ...empty(), 'home.hero': { he: {} } })).toThrow();
  });
  it('rejects invalid visibility and unsafe media URLs', () => {
    const doc = parseEditorDocument(empty());
    doc['home.hero'].he._hidden = 'yes';
    expect(() => parseEditorDocument(doc)).toThrow();
    delete doc['home.hero'].he._hidden;
    doc['home.hero'].he.image = 'https://evil.example/track.png';
    expect(() => parseEditorDocument(doc, origin)).toThrow();
  });
  it.each(['/products/RAV-500-transparent.webp', '/products/V-19W.webp', `${origin}/storage/v1/object/public/product-media/site/a.webp`])('accepts approved asset %s', src => {
    expect(isAllowedImage(src, origin)).toBe(true);
  });
  it.each(['javascript:alert(1)', '//evil.example/a.jpg', '/products/../a.png', 'data:image/svg+xml,x', `${origin}/storage/v1/object/public/private/a.png`, 'https://other.supabase.co/storage/v1/object/public/product-media/a.png'])('rejects untrusted asset %s', src => {
    expect(isAllowedImage(src, origin)).toBe(false);
  });
});
