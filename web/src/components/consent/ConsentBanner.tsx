'use client';

import { useTranslations } from 'next-intl';
import { Link } from '@/i18n/navigation';
import { useConsent } from './ConsentProvider';

/**
 * Shown once, before any choice is stored (or after it expires). A visitor
 * who dismisses it without choosing has not consented — analytics stays off
 * until they explicitly accept.
 */
export default function ConsentBanner() {
  const t = useTranslations('consentBanner');
  const { showBanner, decide } = useConsent();

  if (!showBanner) return null;

  return (
    <div
      role="region"
      aria-label={t('title')}
      className="fixed inset-x-0 bottom-0 z-[70] border-t border-line bg-pure px-5 py-4 shadow-[0_-12px_32px_-16px_rgba(0,0,0,0.25)] print:hidden dark:border-white/10 dark:bg-surface"
    >
      <div className="mx-auto flex max-w-shell flex-wrap items-center gap-4">
        <p className="flex-1 text-sm text-graphite dark:text-ink">
          {t.rich('message', {
            link: (chunks) => (
              <Link href="/legal/privacy" className="font-semibold text-blueprint underline underline-offset-2 dark:text-skyline">
                {chunks}
              </Link>
            )
          })}
        </p>
        <div className="flex flex-none flex-wrap gap-3">
          <button
            type="button"
            onClick={() => decide('denied')}
            className="min-h-[44px] rounded border border-line px-4 text-sm font-semibold text-graphite hover:border-machine dark:border-white/10 dark:text-ink dark:hover:border-white/25"
          >
            {t('reject')}
          </button>
          <button
            type="button"
            onClick={() => decide('granted')}
            className="min-h-[44px] rounded bg-blueprint px-4 text-sm font-bold text-pure hover:bg-graphite"
          >
            {t('accept')}
          </button>
        </div>
      </div>
    </div>
  );
}
