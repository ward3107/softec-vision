import { describe, expect, it } from 'vitest';
import { echoFormValues, parseProductForm, PRODUCT_LIMITS, valuesFromParsedForm } from './productForm';

const SPEC_KEYS = ['displays', 'dimensions', 'weight'];

function form(overrides: Record<string, string> = {}) {
  const fd = new FormData();
  const values: Record<string, string> = {
    status: 'published',
    'name.he': 'עמדת מרצה',
    'name.en': 'Lecturer Station',
    'description.he': 'תיאור בעברית',
    'description.en': 'English description',
    'alt.he': '',
    'alt.en': '',
    'spec.displays.he': '',
    'spec.displays.en': '',
    'spec.dimensions.he': '',
    'spec.dimensions.en': '',
    'spec.weight.he': '',
    'spec.weight.en': '',
    ...overrides
  };
  for (const [key, value] of Object.entries(values)) fd.set(key, value);
  return fd;
}

describe('parseProductForm', () => {
  it('accepts a complete product and trims text', () => {
    const result = parseProductForm(
      form({ 'name.en': '  Lecturer Station  ', 'spec.weight.he': ' 40 ק"ג ', 'spec.weight.en': '40 kg' }),
      SPEC_KEYS
    );
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.data.status).toBe('published');
    expect(result.data.translations.en.name).toBe('Lecturer Station');
    expect(result.data.translations.he.alt_text).toBe('');
    expect(result.data.specs).toEqual([{ key: 'weight', value: { he: '40 ק"ג', en: '40 kg' } }]);
  });

  it('keeps specs in canonical order and leaves out empty ones', () => {
    const result = parseProductForm(
      form({
        'spec.weight.he': '40', 'spec.weight.en': '40',
        'spec.displays.he': '2', 'spec.displays.en': '2'
      }),
      SPEC_KEYS
    );
    expect(result.ok && result.data.specs.map((s) => s.key)).toEqual(['displays', 'weight']);
  });

  it('requires names and descriptions in both languages', () => {
    const result = parseProductForm(form({ 'name.he': ' ', 'description.en': '' }), SPEC_KEYS);
    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.errors).toEqual({ 'name.he': 'required', 'description.en': 'required' });
  });

  it('requires a spec value in both languages or neither', () => {
    const result = parseProductForm(form({ 'spec.dimensions.he': '100×60 ס"מ' }), SPEC_KEYS);
    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.errors).toEqual({ 'spec.dimensions.en': 'bothLanguages' });
  });

  it('refuses placeholder text so unconfirmed values are never published', () => {
    const result = parseProductForm(
      form({ 'spec.weight.he': '[למילוי]', 'spec.weight.en': '[To be completed]', 'alt.en': 'x [To be completed]' }),
      SPEC_KEYS
    );
    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.errors).toMatchObject({
      'spec.weight.he': 'placeholder',
      'spec.weight.en': 'placeholder',
      'alt.en': 'placeholder'
    });
  });

  it('enforces length limits', () => {
    const result = parseProductForm(
      form({
        'name.he': 'א'.repeat(PRODUCT_LIMITS.name + 1),
        'spec.weight.he': 'x'.repeat(PRODUCT_LIMITS.spec + 1),
        'spec.weight.en': 'ok'
      }),
      SPEC_KEYS
    );
    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.errors).toMatchObject({ 'name.he': 'tooLong', 'spec.weight.he': 'tooLong' });
  });

  it('keeps names on one line', () => {
    const result = parseProductForm(form({ 'name.en': 'Lecturer\nStation' }), SPEC_KEYS);
    expect(result.ok && result.data.translations.en.name).toBe('Lecturer Station');
  });

  it('rejects an unknown status', () => {
    const result = parseProductForm(form({ status: 'deleted' }), SPEC_KEYS);
    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.errors).toEqual({ status: 'invalid' });
  });

  it('ignores spec fields that are not canonical', () => {
    const fd = form();
    fd.set('spec.injected.he', 'x');
    fd.set('spec.injected.en', 'x');
    const result = parseProductForm(fd, SPEC_KEYS);
    expect(result.ok && result.data.specs).toEqual([]);
  });
});

describe('echoFormValues', () => {
  it('returns exactly what was submitted, without validating it', () => {
    const fd = form({ 'description.he': '   ', 'spec.weight.he': '[למילוי]', 'spec.weight.en': '' });
    const values = echoFormValues(fd, SPEC_KEYS);
    expect(values['description.he']).toBe('');
    expect(values['spec.weight.he']).toBe('[למילוי]');
    expect(values['name.he']).toBe('עמדת מרצה');
  });

  it('only echoes canonical spec keys', () => {
    const fd = form();
    fd.set('spec.injected.he', 'x');
    expect(Object.keys(echoFormValues(fd, SPEC_KEYS))).not.toContain('spec.injected.he');
  });
});

describe('valuesFromParsedForm', () => {
  it('flattens the parsed, saved data back into field values, blank for removed specs', () => {
    const result = parseProductForm(form({ 'spec.weight.he': '40 ק"ג', 'spec.weight.en': '40 kg' }), SPEC_KEYS);
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    const values = valuesFromParsedForm(result.data, SPEC_KEYS);
    expect(values).toMatchObject({
      status: 'published',
      'name.en': 'Lecturer Station',
      'spec.weight.he': '40 ק"ג',
      'spec.weight.en': '40 kg',
      'spec.displays.he': '',
      'spec.dimensions.en': ''
    });
  });
});
