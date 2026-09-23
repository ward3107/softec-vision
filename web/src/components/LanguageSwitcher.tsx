'use client';

import { useLocale, useTranslations } from 'next-intl';
import { usePathname, Link } from '@/i18n/navigation';
import { useConsent } from '@/components/consent/ConsentProvider';

/**
 * Switches between Hebrew and English while preserving the current path.
 * next-intl's Link handles the locale prefix and updates <html lang/dir>.
 */
export default function LanguageSwitcher() {
  const locale = useLocale();
  const pathname = usePathname();
  const t = useTranslations('nav');
  const { track } = useConsent();
  const other = locale === 'he' ? 'en' : 'he';

  return (
    <Link
      href={pathname}
      locale={other}
      lang={other}
      aria-label={t('switchTo')}
      onClick={() => track('language_switched', { from: locale, to: other })}
      className="inline-flex h-11 min-w-[44px] items-center justify-center rounded border border-line px-3 font-bold text-graphite hover:border-machine dark:border-white/10 dark:text-ink dark:hover:border-white/25"
    >
      {locale === 'he' ? 'EN' : 'עב'}
    </Link>
  );
}
