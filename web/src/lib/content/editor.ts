import { CONTENT_BLOCKS, CONTENT_LIMIT, type ContentBlockKey, type ContentBlocks } from './blocks';

export const BLOCK_KEYS = Object.keys(CONTENT_BLOCKS) as ContentBlockKey[];
export const LOCALES = ['he', 'en'] as const;
export const MAX_IMAGE_BYTES = 3 * 1024 * 1024;
export type EditorDocument = Required<ContentBlocks>;

export function isAllowedImage(src: string, storageOrigin?: string): boolean {
  if (/^\/products\/[a-zA-Z0-9_./% -]+\.(webp|png|jpe?g)$/i.test(src) && !src.includes('..')) return true;
  if (!storageOrigin) return false;
  try {
    const url = new URL(src);
    return url.origin === new URL(storageOrigin).origin && url.protocol === 'https:' &&
      url.pathname.startsWith('/storage/v1/object/public/product-media/') && !url.search && !url.hash;
  } catch { return false; }
}

/** Publish contract: fixed blocks/locales/fields, plain text, explicit visibility flags. */
export function parseEditorDocument(input: unknown, storageOrigin?: string): EditorDocument {
  if (!input || typeof input !== 'object' || Array.isArray(input)) throw new Error('Invalid document');
  const source = input as Record<string, unknown>;
  if (Object.keys(source).some(key => !Object.hasOwn(CONTENT_BLOCKS, key))) throw new Error('Unknown block');
  const result = {} as EditorDocument;
  for (const key of BLOCK_KEYS) {
    const block = source[key];
    if (!block || typeof block !== 'object' || Array.isArray(block)) throw new Error('Missing block');
    result[key] = { he: {}, en: {} };
    for (const locale of LOCALES) {
      const values = (block as Record<string, unknown>)[locale];
      if (!values || typeof values !== 'object' || Array.isArray(values)) throw new Error('Missing locale');
      const allowed = new Set<string>([...CONTENT_BLOCKS[key], '_hidden', ...CONTENT_BLOCKS[key].map(field => `_hide.${field}`)]);
      for (const [field, value] of Object.entries(values)) {
        if (!allowed.has(field) || typeof value !== 'string') throw new Error('Invalid field');
        if (field.startsWith('_')) {
          if (!['', 'true', 'false'].includes(value)) throw new Error('Invalid visibility');
          if (value === 'true') result[key][locale][field] = 'true';
        } else {
          if (value.length > (field === 'image' ? 2048 : CONTENT_LIMIT)) throw new Error('Text too long');
          if (field === 'image' && value && !isAllowedImage(value, storageOrigin)) throw new Error('Invalid image');
          result[key][locale][field] = value.trim();
        }
      }
      for (const field of CONTENT_BLOCKS[key]) result[key][locale][field] ??= '';
    }
  }
  return result;
}

export function changedBlocks(before: EditorDocument, after: EditorDocument): ContentBlockKey[] {
  return BLOCK_KEYS.filter(key => LOCALES.some(locale => {
    const fields = new Set([...Object.keys(before[key][locale]), ...Object.keys(after[key][locale])]);
    return [...fields].some(field => (before[key][locale][field] || '') !== (after[key][locale][field] || ''));
  }));
}
