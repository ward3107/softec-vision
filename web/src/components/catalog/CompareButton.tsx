'use client';

import { useTranslations } from 'next-intl';
import { useCompare } from './CompareProvider';

export default function CompareButton({ code }: { code: string }) {
  const t = useTranslations('compare');
  const { has, toggle, atLimit } = useCompare();
  const selected = has(code);

  return (
    <button
      type="button"
      aria-pressed={selected}
      onClick={() => toggle(code)}
      disabled={!selected && atLimit}
      className="inline-flex min-h-[44px] items-center rounded border border-line px-3 text-sm font-semibold text-graphite hover:bg-paper disabled:cursor-not-allowed disabled:opacity-50 aria-pressed:border-blueprint aria-pressed:bg-paper"
    >
      {selected ? t('remove') : t('add')}
    </button>
  );
}
