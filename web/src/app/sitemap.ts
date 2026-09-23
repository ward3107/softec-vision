import type { MetadataRoute } from 'next';
import { routing, type AppLocale } from '@/i18n/routing';
import { localeUrl } from '@/lib/seo';
import { getAllProducts } from '@/lib/catalog';
import { CATEGORIES } from '@/lib/catalog/seed';

/** Static routes present in every locale, with change/priority hints. */
const STATIC: { path: string; changeFrequency: MetadataRoute.Sitemap[number]['changeFrequency']; priority: number }[] = [
  { path: '', changeFrequency: 'weekly', priority: 1 },
  { path: '/catalog', changeFrequency: 'weekly', priority: 0.9 },
  { path: '/custom', changeFrequency: 'monthly', priority: 0.8 },
  { path: '/about', changeFrequency: 'monthly', priority: 0.6 },
  { path: '/contact', changeFrequency: 'monthly', priority: 0.7 },
  { path: '/legal/privacy', changeFrequency: 'yearly', priority: 0.3 },
  { path: '/legal/accessibility', changeFrequency: 'yearly', priority: 0.3 },
  { path: '/legal/terms', changeFrequency: 'yearly', priority: 0.3 }
];

function languagesFor(path: string, locales: readonly AppLocale[]): Record<string, string> {
  return Object.fromEntries(locales.map((l) => [l, localeUrl(l, path)]));
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const now = new Date();
  const entries: MetadataRoute.Sitemap = [];

  for (const { path, changeFrequency, priority } of STATIC) {
    const languages = languagesFor(path, routing.locales);
    for (const locale of routing.locales) {
      entries.push({ url: localeUrl(locale, path), lastModified: now, changeFrequency, priority, alternates: { languages } });
    }
  }

  // Categories — only in the locales they are shown in.
  for (const category of CATEGORIES) {
    const path = `/catalog/${category.key}`;
    const languages = languagesFor(path, category.visibleIn);
    for (const locale of category.visibleIn) {
      entries.push({ url: localeUrl(locale, path), lastModified: now, changeFrequency: 'monthly', priority: 0.6, alternates: { languages } });
    }
  }

  // Products — one entry per locale the product's category is visible in.
  for (const product of await getAllProducts()) {
    const path = `/product/${product.code}`;
    const productLocales = CATEGORIES.find((c) => c.key === product.cat)?.visibleIn ?? routing.locales;
    const languages = languagesFor(path, productLocales);
    for (const locale of productLocales) {
      entries.push({ url: localeUrl(locale, path), lastModified: now, changeFrequency: 'monthly', priority: 0.6, alternates: { languages } });
    }
  }

  return entries;
}
