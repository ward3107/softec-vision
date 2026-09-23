import { BRAND, SITE_URL, localeUrl } from '@/lib/seo';
import type { AppLocale } from '@/i18n/routing';

const PHONE = '+972-3-696-8777';
const EMAIL = 'Alon@softec.co.il';

/**
 * Renders a JSON-LD block. Data is server-built from trusted app content, and
 * JSON.stringify escapes the payload; we additionally escape "<" so the script
 * can never be broken out of.
 */
export default function JsonLd({ data }: { data: Record<string, unknown> | Record<string, unknown>[] }) {
  const json = JSON.stringify(data).replace(/</g, '\\u003c');
  return <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: json }} />;
}

/** Organization + WebSite — emitted once, in the root layout. */
export function organizationSchema(locale: AppLocale) {
  return [
    {
      '@context': 'https://schema.org',
      '@type': 'Organization',
      name: 'Softec Vision Ltd',
      alternateName: BRAND,
      url: SITE_URL,
      logo: `${SITE_URL}/icon.svg`,
      email: EMAIL,
      telephone: PHONE,
      areaServed: 'IL',
      contactPoint: [
        {
          '@type': 'ContactPoint',
          contactType: 'sales',
          telephone: PHONE,
          email: EMAIL,
          availableLanguage: ['he', 'en']
        }
      ]
    },
    {
      '@context': 'https://schema.org',
      '@type': 'WebSite',
      name: BRAND,
      url: localeUrl(locale, ''),
      inLanguage: locale
    }
  ];
}

/** BreadcrumbList from an ordered list of {name, path}. */
export function breadcrumbSchema(locale: AppLocale, items: { name: string; path: string }[]) {
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: items.map((item, i) => ({
      '@type': 'ListItem',
      position: i + 1,
      name: item.name,
      item: localeUrl(locale, item.path)
    }))
  };
}
