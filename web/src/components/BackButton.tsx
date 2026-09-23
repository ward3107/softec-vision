'use client';

import { Link, useRouter } from '@/i18n/navigation';
import { canGoBackInApp, markReplace } from '@/lib/navHistory';

/**
 * Prominent "Back" button. Returns to the previous page on this site when
 * there is one; otherwise (visitor landed here directly) it moves up to
 * `fallbackHref`, the logical parent step, replacing the current history
 * entry so repeated presses keep climbing instead of bouncing back. A real
 * link underneath, so it also works without JS and for middle-click.
 */
export default function BackButton({ fallbackHref, label }: { fallbackHref: string; label: string }) {
  const router = useRouter();

  return (
    <Link
      href={fallbackHref}
      onClick={(event) => {
        if (event.metaKey || event.ctrlKey || event.shiftKey || event.button !== 0) return;
        event.preventDefault();
        if (canGoBackInApp()) {
          router.back();
        } else {
          markReplace();
          router.replace(fallbackHref);
        }
      }}
      className="inline-flex min-h-[48px] items-center gap-2 rounded border-2 border-blueprint bg-pure px-5 text-base font-extrabold text-blueprint shadow-sm transition-colors hover:bg-blueprint hover:text-pure dark:border-skyline dark:bg-surface dark:text-skyline dark:hover:bg-skyline dark:hover:text-canvas"
    >
      <svg
        viewBox="0 0 24 24"
        className="h-5 w-5 flex-none rtl:-scale-x-100"
        fill="none"
        stroke="currentColor"
        strokeWidth="2.75"
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden="true"
      >
        <path d="M19 12H5M12 19l-7-7 7-7" />
      </svg>
      {label}
    </Link>
  );
}
