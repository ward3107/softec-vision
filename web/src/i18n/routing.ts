import { defineRouting } from 'next-intl/routing';

/**
 * Locale routing. Hebrew is the default (matches the static site) and is served
 * RTL; English is LTR. Additional locales (ar, fr, de, es, ru, zh, ja) can be
 * added here as they are enabled — the infrastructure is built for many, but
 * translations are supplied separately.
 */
export const routing = defineRouting({
  locales: ['he', 'en'],
  defaultLocale: 'he',
  // First visit defaults to Hebrew regardless of the browser's Accept-Language,
  // matching the original site. Language is chosen explicitly via the switcher.
  localeDetection: false
});

export type AppLocale = (typeof routing.locales)[number];

export const localeDir: Record<AppLocale, 'rtl' | 'ltr'> = {
  he: 'rtl',
  en: 'ltr'
};
