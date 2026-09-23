'use client';

import { useCallback, useEffect, useState } from 'react';

function persist(dark: boolean) {
  document.documentElement.classList.toggle('dark', dark);
  try {
    localStorage.setItem('softec-theme', dark ? 'dark' : 'light');
  } catch {
    /* private mode / blocked storage — the choice just won't persist */
  }
}

/**
 * Light/dark toggle. The actual theme is decided before paint by the boot
 * script (reads `softec-theme`, else the OS preference) toggling `.dark` on
 * `<html>`; this button only reads that starting state back on mount (so
 * its icon matches what's already on screen) and flips it from then on.
 */
export default function ThemeToggle({
  toLightLabel,
  toDarkLabel
}: {
  toLightLabel: string;
  toDarkLabel: string;
}) {
  const [dark, setDark] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setDark(document.documentElement.classList.contains('dark'));
    setMounted(true);
  }, []);

  const toggle = useCallback(() => {
    setDark((prev) => {
      const next = !prev;
      persist(next);
      return next;
    });
  }, []);

  const showDark = mounted && dark;

  return (
    <button
      type="button"
      onClick={toggle}
      aria-pressed={showDark}
      aria-label={showDark ? toLightLabel : toDarkLabel}
      title={showDark ? toLightLabel : toDarkLabel}
      className="flex h-11 w-11 flex-none items-center justify-center rounded border border-line text-graphite hover:border-machine dark:border-white/10 dark:text-ink dark:hover:border-white/25"
    >
      {showDark ? (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden="true">
          <circle cx="12" cy="12" r="4.5" stroke="currentColor" strokeWidth="2" />
          <path
            d="M12 2.5v2M12 19.5v2M4.2 4.2l1.4 1.4M18.4 18.4l1.4 1.4M2.5 12h2M19.5 12h2M4.2 19.8l1.4-1.4M18.4 5.6l1.4-1.4"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
          />
        </svg>
      ) : (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden="true">
          <path
            d="M20.5 14.2A8.5 8.5 0 119.8 3.5a7 7 0 0010.7 10.7z"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinejoin="round"
          />
        </svg>
      )}
    </button>
  );
}
