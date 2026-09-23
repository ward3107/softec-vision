import type { Metadata } from 'next';
import { routing, type AppLocale } from '@/i18n/routing';

/**
 * Absolute base URL for canonical / hreflang / Open Graph. On Vercel this
 * resolves to the production domain automatically; override with
 * NEXT_PUBLIC_SITE_URL once the final domain is connected.
 */
export const SITE_URL = (
  process.env.NEXT_PUBLIC_SITE_URL ||
  (process.env.VERCEL_PROJECT_PRODUCTION_URL ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}` : '') ||
  'https://www.softec.co.il'
).replace(/\/$/, '');

export const BRAND = 'Softec Vision';

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
