import { describe, expect, it } from 'vitest';
import { parseContentBlockForm, resolveText, rowsToContentBlocks } from './blocks';

describe('rowsToContentBlocks', () => {
  it('maps known blocks by locale', () => {
    const blocks = rowsToContentBlocks([
      {
        key: 'home.hero',
        content_block_translations: [
          { locale: 'he', data: { eyebrow: 'א', title: 'ב', body: 'ג' } },
          { locale: 'en', data: { eyebrow: 'A', title: 'B', body: 'C' } }
        ]
      }
    ]);
    expect(blocks['home.hero']?.he).toEqual({ eyebrow: 'א', title: 'ב', body: 'ג' });
    expect(blocks['home.hero']?.en).toEqual({ eyebrow: 'A', title: 'B', body: 'C' });
  });

  it('ignores a block key the app no longer defines', () => {
    const blocks = rowsToContentBlocks([{ key: 'no.longer.used', content_block_translations: [] }]);
    expect(blocks).toEqual({});
  });

  it('defaults a missing locale to an empty object', () => {
    const blocks = rowsToContentBlocks([
      { key: 'home.capabilities', content_block_translations: [{ locale: 'he', data: { custom: 'x' } }] }
    ]);
    expect(blocks['home.capabilities']?.en).toEqual({});
  });
});

describe('resolveText', () => {
  const blocks = rowsToContentBlocks([
    {
      key: 'home.hero',
      content_block_translations: [
        { locale: 'he', data: { eyebrow: '  ', title: 'כותרת מותאמת' } },
        { locale: 'en', data: { title: 'Custom title' } }
      ]
    }
  ]);

  it('uses the owner override when it is set and non-blank', () => {
    expect(resolveText(blocks, 'home.hero', 'en', 'title', 'Shipped title')).toBe('Custom title');
  });

  it('falls back when the field was never saved', () => {
    expect(resolveText(blocks, 'home.hero', 'en', 'body', 'Shipped body')).toBe('Shipped body');
  });

  it('falls back when the saved value is only whitespace', () => {
    expect(resolveText(blocks, 'home.hero', 'he', 'eyebrow', 'ברירת מחדל')).toBe('ברירת מחדל');
  });

  it('falls back entirely for a block the database has nothing for', () => {
    expect(resolveText(blocks, 'home.capabilities', 'en', 'custom', 'Custom Manufacturing')).toBe('Custom Manufacturing');
  });
});

describe('parseContentBlockForm', () => {
  it('reads only the fields the block declares, trimmed', () => {
    const fd = new FormData();
    fd.set('he.eyebrow', '  שלום  ');
    fd.set('he.title', 'כותרת');
    fd.set('he.body', 'טקסט');
    fd.set('en.eyebrow', '  Hi  ');
    fd.set('en.title', 'Title');
    fd.set('en.body', 'Body');
    fd.set('he.custom', 'should be ignored — not a hero field');
    const parsed = parseContentBlockForm(fd, 'home.hero');
    expect(parsed.he).toEqual({ eyebrow: 'שלום', title: 'כותרת', body: 'טקסט' });
    expect(parsed.en).toEqual({ eyebrow: 'Hi', title: 'Title', body: 'Body' });
  });

  it('defaults a missing field to an empty string rather than rejecting the form', () => {
    const parsed = parseContentBlockForm(new FormData(), 'home.capabilities');
    expect(parsed.he).toEqual({ custom: '', av: '', accessible: '' });
    expect(parsed.en).toEqual({ custom: '', av: '', accessible: '' });
  });

  it('caps each field length', () => {
    const fd = new FormData();
    fd.set('en.title', 'x'.repeat(1000));
    const parsed = parseContentBlockForm(fd, 'home.hero');
    expect(parsed.en.title.length).toBe(600);
  });
});
