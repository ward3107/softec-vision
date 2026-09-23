'use client';

import { useEffect, useState } from 'react';
import { useTranslations } from 'next-intl';

/**
 * Share the current page. Uses the native Web Share sheet where the browser
 * offers it (most mobiles), and falls back to copying the link to the
 * clipboard with a short "copied" confirmation elsewhere.
 */
export default function ShareButton({ title, text }: { title: string; text?: string }) {
  const t = useTranslations('share');
  const [url, setUrl] = useState('');
  const [copied, setCopied] = useState(false);
  const [canShare, setCanShare] = useState(false);

  useEffect(() => {
    setUrl(window.location.href);
    setCanShare(typeof navigator !== 'undefined' && typeof navigator.share === 'function');
  }, []);

  async function onShare() {
    const shareUrl = url || window.location.href;
    try {
      if (canShare) {
        await navigator.share({ title, text, url: shareUrl });
        return;
      }
      await navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
    } catch {
      /* user dismissed the share sheet, or clipboard was blocked — no-op */
    }
  }

  return (
    <button
      type="button"
      onClick={onShare}
      aria-label={canShare ? t('share') : t('copy')}
      className="inline-flex min-h-[48px] items-center gap-2 rounded border border-line px-4 font-bold text-graphite hover:border-machine hover:bg-pure dark:border-white/10 dark:text-ink dark:hover:border-white/25 dark:hover:bg-surface"
    >
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
        <path
          d="M8.7 13.3l6.6 3.4M15.3 7.3L8.7 10.7M18 8a2.5 2.5 0 1 0 0-5 2.5 2.5 0 0 0 0 5zM6 14.5a2.5 2.5 0 1 0 0-5 2.5 2.5 0 0 0 0 5zM18 21a2.5 2.5 0 1 0 0-5 2.5 2.5 0 0 0 0 5z"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
      <span aria-live="polite">{copied ? t('copied') : t('label')}</span>
    </button>
  );
}
