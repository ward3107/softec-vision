'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { useTranslations } from 'next-intl';
import { Link } from '@/i18n/navigation';

type ToggleKey = 'contrast' | 'links' | 'readable' | 'nomotion';

const TOGGLES: ToggleKey[] = ['contrast', 'links', 'readable', 'nomotion'];
const FONT_MIN = -2;
const FONT_MAX = 5;

function storageGet(key: string, fallback = '') {
  try {
    return localStorage.getItem(key) ?? fallback;
  } catch {
    return fallback;
  }
}
function storageSet(key: string, value: string) {
  try {
    localStorage.setItem(key, value);
  } catch {
    /* private mode / blocked storage — settings just won't persist */
  }
}

/**
 * Accessibility helper. Adjusts the display (text size, contrast, link
 * emphasis, readable font, motion) and persists the choices. These are
 * genuine display aids only — the widget makes no claim of full WCAG
 * conformance, and the panel links to the accessibility statement for the
 * real detail and contact route.
 */
export default function AccessibilityWidget() {
  const t = useTranslations('a11y');
  const [open, setOpen] = useState(false);
  const [font, setFont] = useState(0);
  const [toggles, setToggles] = useState<Record<ToggleKey, boolean>>({
    contrast: false,
    links: false,
    readable: false,
    nomotion: false
  });

  const panelRef = useRef<HTMLDivElement>(null);
  const fabRef = useRef<HTMLButtonElement>(null);

  // Hydrate UI state from what the pre-paint boot script already applied.
  useEffect(() => {
    setFont(parseInt(storageGet('a11y-font', '0'), 10) || 0);
    setToggles({
      contrast: storageGet('a11y-contrast') === '1',
      links: storageGet('a11y-links') === '1',
      readable: storageGet('a11y-readable') === '1',
      nomotion: storageGet('a11y-nomotion') === '1'
    });
  }, []);

  const applyFont = useCallback((next: number) => {
    const clamped = Math.max(FONT_MIN, Math.min(FONT_MAX, next));
    setFont(clamped);
    document.documentElement.style.fontSize = clamped === 0 ? '' : `${100 + clamped * 8}%`;
    storageSet('a11y-font', String(clamped));
  }, []);

  const applyToggle = useCallback((key: ToggleKey, value: boolean) => {
    setToggles((prev) => ({ ...prev, [key]: value }));
    document.body.classList.toggle(`a11y-${key}`, value);
    storageSet(`a11y-${key}`, value ? '1' : '0');
    // Turning motion back on should re-reveal, off should force-show.
    if (key === 'nomotion' && value) {
      document.querySelectorAll('.reveal').forEach((el) => el.classList.add('is-visible'));
    }
  }, []);

  const reset = useCallback(() => {
    applyFont(0);
    TOGGLES.forEach((k) => applyToggle(k, false));
  }, [applyFont, applyToggle]);

  // Close on Escape, and trap focus while the dialog is open.
  useEffect(() => {
    if (!open) return;
    const panel = panelRef.current;
    const focusables = () =>
      Array.from(
        panel?.querySelectorAll<HTMLElement>('a[href],button:not([disabled]),input,[tabindex]:not([tabindex="-1"])') ?? []
      );
    focusables()[0]?.focus();

    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.stopPropagation();
        setOpen(false);
        fabRef.current?.focus();
        return;
      }
      if (e.key !== 'Tab') return;
      const items = focusables();
      if (items.length === 0) return;
      const first = items[0];
      const last = items[items.length - 1];
      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    };
    document.addEventListener('keydown', onKey, true);
    return () => document.removeEventListener('keydown', onKey, true);
  }, [open]);

  // Close when clicking outside the panel/button.
  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent) => {
      const target = e.target as Node;
      if (!panelRef.current?.contains(target) && !fabRef.current?.contains(target)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', onDown);
    return () => document.removeEventListener('mousedown', onDown);
  }, [open]);

  const btn =
    'flex h-9 w-9 items-center justify-center rounded border border-line bg-pure text-base font-bold text-graphite hover:border-blueprint hover:bg-paper';

  return (
    <div className="relative">
      {open && (
        <div
          ref={panelRef}
          role="dialog"
          aria-modal="true"
          aria-label={t('title')}
          className="absolute bottom-14 end-0 w-[min(20rem,calc(100vw-2rem))] rounded-lg border border-line bg-pure p-5 text-graphite shadow-[0_24px_60px_-18px_rgba(0,0,0,0.42)]"
        >
          <h2 className="text-base font-bold">{t('heading')}</h2>
          <p className="mb-4 mt-0.5 text-xs text-machine">{t('body')}</p>

          <div className="mb-3 flex items-center justify-between gap-2">
            <span className="text-sm font-medium">{t('textSize')}</span>
            <div className="flex items-center gap-1.5">
              <button type="button" className={btn} aria-label={t('decrease')} onClick={() => applyFont(font - 1)}>
                A−
              </button>
              <button type="button" className={btn} aria-label={t('normal')} onClick={() => applyFont(0)}>
                A
              </button>
              <button type="button" className={btn} aria-label={t('increase')} onClick={() => applyFont(font + 1)}>
                A+
              </button>
            </div>
          </div>

          {TOGGLES.map((key) => (
            <button
              key={key}
              type="button"
              role="switch"
              aria-checked={toggles[key]}
              onClick={() => applyToggle(key, !toggles[key])}
              className="flex min-h-[44px] w-full items-center justify-between gap-3 border-t border-line py-2 text-start text-sm font-medium"
            >
              <span>{t(key)}</span>
              <span
                aria-hidden="true"
                className={`relative h-6 w-10 flex-none rounded-full transition-colors ${
                  toggles[key] ? 'bg-softec' : 'bg-line'
                }`}
              >
                <span
                  className={`absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition-[inset-inline-start] ${
                    toggles[key] ? 'start-[18px]' : 'start-0.5'
                  }`}
                />
              </span>
            </button>
          ))}

          <button
            type="button"
            onClick={reset}
            className="mt-3 min-h-[44px] w-full rounded text-sm font-semibold text-blueprint hover:underline"
          >
            {t('reset')}
          </button>
          <Link
            href="/legal/accessibility"
            className="mt-1 block min-h-[44px] py-2 text-center text-sm font-semibold text-blueprint underline underline-offset-2"
            onClick={() => setOpen(false)}
          >
            {t('statement')}
          </Link>
        </div>
      )}

      <button
        ref={fabRef}
        type="button"
        aria-expanded={open}
        aria-haspopup="dialog"
        aria-label={t('open')}
        onClick={() => setOpen((v) => !v)}
        className="flex h-12 w-12 items-center justify-center rounded-full bg-graphite text-pure shadow-lg ring-1 ring-black/5 hover:bg-blueprint focus-visible:outline-offset-2"
      >
        {/* Universal access glyph */}
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" aria-hidden="true">
          <circle cx="12" cy="4" r="2" fill="currentColor" />
          <path
            d="M3 8h18M12 8v5m0 0l-3 7m3-7l3 7"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </button>
    </div>
  );
}
