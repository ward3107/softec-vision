import { BRAND, BRAND_ALIASES, SITE_URL, localeUrl } from '@/lib/seo';
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
      '@id': `${SITE_URL}/#organization`,
      name: 'Softec Vision Ltd',
      alternateName: [BRAND, ...BRAND_ALIASES],
      description: locale === 'he'
        ? 'סופטק ויזן מתכננת ומייצרת עמדות מרצה, בקרה ותצוגה בהתאמה אישית.'
        : 'Softec Vision designs and manufactures custom lecturer, control and display stations.',
      url: SITE_URL,
      logo: `${SITE_URL}/brand/softec-vision-logo.png`,
      email: EMAIL,
      telephone: PHONE,
      areaServed: 'IL',
      knowsAbout: ['Lecturer stations', 'Control-room workstations', 'AV integration', 'Accessible technology furniture'],
      availableLanguage: ['he', 'en'],
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
      '@id': `${SITE_URL}/#website`,
      name: BRAND,
      alternateName: BRAND_ALIASES,
      url: `${SITE_URL}/`,
      inLanguage: ['he', 'en'],
      publisher: { '@id': `${SITE_URL}/#organization` }
    }
  ];
}

/** FAQPage from the question/answer pairs visible on the page (must match what is shown). */
export function faqSchema(items: { q: string; a: string }[]) {
  return {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: items.map((item) => ({
      '@type': 'Question',
      name: item.q,
      acceptedAnswer: { '@type': 'Answer', text: item.a }
    }))
  };
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

/** BlogPosting schema for the visible, research-backed knowledge articles. */
export function articleSchema({
  locale,
  slug,
  title,
  description,
  image,
  publishedAt,
  updatedAt
}: {
  locale: AppLocale;
  slug: string;
  title: string;
  description: string;
  image: string;
  publishedAt: string;
  updatedAt: string;
}) {
  const url = localeUrl(locale, `/blog/${slug}`);
  return {
    '@context': 'https://schema.org',
    '@type': 'BlogPosting',
    headline: title,
    description,
    url,
    mainEntityOfPage: { '@type': 'WebPage', '@id': url },
    inLanguage: locale,
    datePublished: publishedAt,
    dateModified: updatedAt,
    image: { '@type': 'ImageObject', url: `${SITE_URL}${image}` },
    author: { '@type': 'Organization', name: 'Softec Vision Engineering Team', url: localeUrl(locale, '/about') },
    publisher: {
      '@type': 'Organization',
      name: 'Softec Vision Ltd',
      logo: { '@type': 'ImageObject', url: `${SITE_URL}/brand/softec-vision-logo.png` }
    }
  };
}
