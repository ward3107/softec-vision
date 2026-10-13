import { afterEach, describe, expect, it, vi } from 'vitest';
import { organizationSchema } from '@/components/JsonLd';
import robots from '@/app/robots';
import { altLanguages, metaAlternates } from './seo';

afterEach(() => vi.unstubAllEnvs());

describe('search identity on the connected domain', () => {
  it('keeps old hosting environment values out of public search URLs', async () => {
    vi.stubEnv('NEXT_PUBLIC_SITE_URL', 'https://softecvision.vercel.app');
    vi.stubEnv('VERCEL_PROJECT_PRODUCTION_URL', 'softecvision.vercel.app');
    vi.resetModules();
    const { SITE_URL, localeUrl } = await import('./seo');
    expect(SITE_URL).toBe('https://www.softec.co.il');
    expect(localeUrl('he', '/contact')).toBe('https://www.softec.co.il/he/contact');
    expect(localeUrl('en', '/product/LS-1000LPT')).toBe('https://www.softec.co.il/en/product/LS-1000LPT');
  });

  it('keeps language alternates reciprocal and each language self-canonical', () => {
    const he = metaAlternates('he', '/about');
    const en = metaAlternates('en', '/about');
    expect(he?.canonical).toBe('https://www.softec.co.il/he/about');
    expect(en?.canonical).toBe('https://www.softec.co.il/en/about');
    expect(he?.languages).toEqual(en?.languages);
    expect(altLanguages('/catalog/charging-carts', ['en'])).toEqual({
      en: 'https://www.softec.co.il/en/catalog/charging-carts',
      'x-default': 'https://www.softec.co.il/en/catalog/charging-carts'
    });
  });

  it('identifies the same website and Hebrew brand names in both languages', () => {
    for (const locale of ['he', 'en'] as const) {
      const [organization, website] = organizationSchema(locale);
      expect(organization.alternateName).toEqual(expect.arrayContaining(['Softec Vision', 'סופטק ויזן', 'סופטיק ויזן', 'סופטק']));
      expect(website.url).toBe('https://www.softec.co.il/');
      expect(website['@id']).toBe('https://www.softec.co.il/#website');
      expect(website.publisher).toEqual({ '@id': organization['@id'] });
      expect(website.inLanguage).toEqual(['he', 'en']);
    }
  });

  it('advertises the sitemap on the verified domain', () => {
    expect(robots().sitemap).toBe('https://www.softec.co.il/sitemap.xml');
  });
});
