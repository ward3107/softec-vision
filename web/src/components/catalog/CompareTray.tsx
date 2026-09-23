'use client';

import { useTranslations } from 'next-intl';
import { Link } from '@/i18n/navigation';
import { useCompare } from './CompareProvider';

export default function CompareTray() {
  const t = useTranslations('compare');
  const { codes, clear } = useCompare();

  if (codes.length === 0) return null;
  const ready = codes.length >= 2;

  return (
    <div
      role="region"
      aria-label={t('title')}
      className="fixed inset-x-0 bottom-0 z-40 border-t border-line bg-graphite text-paper dark:border-white/10"
    >
      <div className="mx-auto flex max-w-shell flex-wrap items-center justify-between gap-3 px-[clamp(20px,4.5vw,72px)] py-3">
        <ul className="flex flex-wrap gap-2">
          {codes.map((code) => (
            <li key={code} className="rounded bg-pure/10 px-3 py-1 text-sm font-semibold" dir="ltr">
              {code}
            </li>
          ))}
        </ul>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={clear}
            className="min-h-[44px] rounded px-3 text-sm font-semibold text-paper hover:underline"
          >
            {t('clear')}
          </button>
          <Link
            href={`/compare?ids=${codes.join(',')}`}
            aria-disabled={!ready}
            className={`inline-flex min-h-[44px] items-center rounded bg-softec px-4 text-sm font-bold text-pure hover:bg-blueprint ${
              ready ? '' : 'pointer-events-none opacity-50'
            }`}
          >
            {t('open')} ({codes.length})
          </Link>
        </div>
      </div>
    </div>
  );
}
