import { expect, it, vi } from 'vitest';
import { categoryRowsToCatalog, type CategoryRow } from './categories';
import { productCategoryPath, type DbProductRow } from './db';
import { filterProducts, normalizeCatalogState } from './index';
import * as categories from './categories';
import * as products from './source';
import { PRODUCTS } from './seed';

const row = (id: string, parent_id: string | null, status: CategoryRow['status'] = 'published'): CategoryRow => ({
  id, parent_id, slug: id, sort: 0, status, visible_in: ['he', 'en'],
  category_translations: ['he', 'en'].map(locale => ({ locale, name: id, description: '' }))
});
const tree = categoryRowsToCatalog([row('family', null), row('sub', 'family'), row('leaf', 'sub'), row('hidden', 'sub', 'draft')]);

it('resolves legacy assignments and the published third level within the selected branch', () => {
  expect(tree[0].subs?.[0].children?.map(node => node.key)).toEqual(['leaf']);
  const assignment = (parent_id: string) => ({ category: { id: 'family', slug: 'family' }, sub: { slug: 'assigned', parent_id } }) as DbProductRow;
  expect(productCategoryPath(assignment('family'), new Map())).toEqual({ sub: 'assigned' });
  expect(productCategoryPath(assignment('sub'), new Map([['sub','sub']]))).toEqual({ sub: 'sub', leaf: 'assigned' });
  expect(normalizeCatalogState({ cat: 'family', sub: 'other', leaf: 'leaf' }, tree).leaf).toBeUndefined();
});

it('includes descendant models at the family and subcategory levels and filters the leaf exactly', async () => {
  vi.spyOn(categories, 'loadCategories').mockResolvedValue(tree);
  vi.spyOn(products, 'loadProducts').mockResolvedValue([
    { ...PRODUCTS[0], code: 'ROOT', cat: 'family', sub: undefined },
    { ...PRODUCTS[0], code: 'SUB', cat: 'family', sub: 'sub' },
    { ...PRODUCTS[0], code: 'LEAF', cat: 'family', sub: 'sub', leaf: 'leaf' }
  ]);
  try {
    for (const lang of ['he', 'en'] as const) {
      const codes = async (sub?: string, leaf?: string) => (await filterProducts({ lang, cat: 'family', sub, leaf })).map(p => p.code);
      expect(await codes()).toEqual(['ROOT', 'SUB', 'LEAF']);
      expect(await codes('sub')).toEqual(['SUB', 'LEAF']);
      expect(await codes('sub', 'leaf')).toEqual(['LEAF']);
    }
  } finally { vi.restoreAllMocks(); }
});
