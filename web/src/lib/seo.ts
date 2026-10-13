import type { Metadata } from 'next';
import { routing, type AppLocale } from '@/i18n/routing';

/**
 * The verified public domain is the single source of truth for search URLs.
 * Deployment aliases and old environment values must not replace it: doing so
 * makes the custom domain canonicalize to a different site in search engines.
 */
export const SITE_URL = 'https://www.softec.co.il';

export const BRAND = 'Softec Vision';
export const BRAND_HE = 'סופטק ויזן';
/** Hebrew spellings supplied by the owner; these describe one organization. */
export const BRAND_ALIASES = [BRAND_HE, 'סופטיק ויזן', 'סופטק'];

/** OG locale codes for each app locale. */
export const OG_LOCALE: Record<AppLocale, string> = { he: 'he_IL', en: 'en_US' };

/** Locale-prefixed absolute URL for a path like '/catalog' ('' = home). */
export function localeUrl(locale: AppLocale, path = ''): string {
  const suffix = !path || path === '/' ? '' : `/${path.replace(/^\//, '')}`;
  return `${SITE_URL}/${locale}${suffix}`;
}

/**
 * hreflang alternates for a path, restricted to the locales it actually exists
 * in (some catalog entries are English-only). Includes a self-referential entry
 * per locale plus x-default pointing at the default locale when available.
 */
export function altLanguages(path = '', locales: readonly AppLocale[] = routing.locales): Record<string, string> {
  const languages: Record<string, string> = {};
  for (const locale of locales) languages[locale] = localeUrl(locale, path);
  const fallback = locales.includes(routing.defaultLocale) ? routing.defaultLocale : locales[0];
  if (fallback) languages['x-default'] = localeUrl(fallback, path);
  return languages;
}

export function metaAlternates(
  locale: AppLocale,
  path = '',
  locales: readonly AppLocale[] = routing.locales
): Metadata['alternates'] {
  return { canonical: localeUrl(locale, path), languages: altLanguages(path, locales) };
}

/**
 * Standard per-page metadata: title (brand appended via the layout template),
 * description, canonical + hreflang, and matching Open Graph / Twitter fields.
 */
export function pageMetadata(opts: {
  locale: AppLocale;
  path?: string;
  title: string;
  description: string;
  /** Restrict hreflang to these locales (defaults to all). */
  locales?: readonly AppLocale[];
  /** Override the shared OG image (e.g. a product photo). */
  image?: string;
}): Metadata {
  const { locale, path = '', title, description, locales, image } = opts;
  return {
    title,
    description,
    alternates: metaAlternates(locale, path, locales),
    openGraph: {
      type: 'website',
      siteName: BRAND,
      locale: OG_LOCALE[locale],
      url: localeUrl(locale, path),
      title,
      description,
      ...(image ? { images: [{ url: image }] } : {})
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      ...(image ? { images: [image] } : {})
    }
  };
}
