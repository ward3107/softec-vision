'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useTranslations } from 'next-intl';
import { Link } from '@/i18n/navigation';

/** Toggles applied as a body class + matching CSS in globals.css. */
const CSS_KEYS = [
  'contrast',
  'grayscale',
  'invert',
  'links',
  'headings',
  'readable',
  'linespacing',
  'letterspacing',
  'bigcursor',
  'hideimages',
  'nomotion'
] as const;
/** Toggles driven by JS overlays that follow the pointer. */
const JS_KEYS = ['guide', 'mask'] as const;
const ALL_KEYS = [...CSS_KEYS, ...JS_KEYS] as const;

type ToggleKey = (typeof ALL_KEYS)[number];
type ToggleState = Record<ToggleKey, boolean>;

const FONT_MIN = -2;
const FONT_MAX = 5;
const MASK_GAP = 90; // clear reading strip height, px

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

const emptyState = (): ToggleState =>
  ALL_KEYS.reduce((acc, k) => ({ ...acc, [k]: false }), {} as ToggleState);

/**
 * Accessibility helper. Offers 14 display aids — text size, high contrast,
 * grayscale, colour inversion, link and heading emphasis, a readable font,
 * line and letter spacing, a big cursor, hide-images, a reading guide, a
 * reading mask, and a motion switch — each persisted and re-applied on
 * return. These are genuine display aids only: the widget makes no claim of
 * full WCAG conformance, and links to the accessibility statement for the
 * real detail and contact route.
 */
export default function AccessibilityWidget() {
  const t = useTranslations('a11y');
  const [open, setOpen] = useState(false);
  const [font, setFont] = useState(0);
  const [toggles, setToggles] = useState<ToggleState>(emptyState);

  const panelRef = useRef<HTMLDivElement>(null);
  const fabRef = useRef<HTMLButtonElement>(null);

  // Hydrate UI state from what the pre-paint boot script / storage hold.
  useEffect(() => {
    setFont(parseInt(storageGet('a11y-font', '0'), 10) || 0);
    setToggles(
      ALL_KEYS.reduce(
        (acc, k) => ({ ...acc, [k]: storageGet(`a11y-${k}`) === '1' }),
        {} as ToggleState
      )
    );
  }, []);

  const applyFont = useCallback((next: number) => {
    const clamped = Math.max(FONT_MIN, Math.min(FONT_MAX, next));
    setFont(clamped);
    document.documentElement.style.fontSize = clamped === 0 ? '' : `${100 + clamped * 8}%`;
    storageSet('a11y-font', String(clamped));
  }, []);

  const applyToggle = useCallback((key: ToggleKey, value: boolean) => {
    setToggles((prev) => ({ ...prev, [key]: value }));
    if ((CSS_KEYS as readonly string[]).includes(key)) {
      document.body.classList.toggle(`a11y-${key}`, value);
    }
    storageSet(`a11y-${key}`, value ? '1' : '0');
    if (key === 'nomotion' && value) {
      document.querySelectorAll('.reveal').forEach((el) => el.classList.add('is-visible'));
    }
  }, []);

  const reset = useCallback(() => {
    applyFont(0);
    ALL_KEYS.forEach((k) => applyToggle(k, false));
  }, [applyFont, applyToggle]);

  // Reading guide: a thin high-contrast bar that tracks the pointer.
  useEffect(() => {
    if (!toggles.guide) return;
    const bar = document.createElement('div');
    bar.style.cssText =
      'position:fixed;left:0;right:0;height:3px;background:#0C5E91;box-shadow:0 0 0 1px rgba(255,255,255,.6);pointer-events:none;z-index:55;top:50%';
    document.body.appendChild(bar);
    const move = (e: PointerEvent) => {
      bar.style.top = `${e.clientY}px`;
    };
    window.addEventListener('pointermove', move);
    return () => {
      window.removeEventListener('pointermove', move);
      bar.remove();
    };
  }, [toggles.guide]);

  // Reading mask: dims the page except a strip around the pointer.
  useEffect(() => {
    if (!toggles.mask) return;
    const base = 'position:fixed;left:0;right:0;background:rgba(0,0,0,.55);pointer-events:none;z-index:55;';
    const top = document.createElement('div');
    const bottom = document.createElement('div');
    top.style.cssText = `${base}top:0;height:0`;
    bottom.style.cssText = `${base}bottom:0;height:0`;
    document.body.append(top, bottom);
    const move = (e: PointerEvent) => {
      const y = e.clientY;
      top.style.height = `${Math.max(0, y - MASK_GAP / 2)}px`;
      bottom.style.height = `${Math.max(0, window.innerHeight - y - MASK_GAP / 2)}px`;
    };
    window.addEventListener('pointermove', move);
    return () => {
      window.removeEventListener('pointermove', move);
      top.remove();
      bottom.remove();
    };
  }, [toggles.mask]);

  // Escape closes; focus is trapped while the dialog is open.
  useEffect(() => {
    if (!open) return;
    const panel = panelRef.current;
    const focusables = () =>
      Array.from(
        panel?.querySelectorAll<HTMLElement>(
          'a[href],button:not([disabled]),input,[tabindex]:not([tabindex="-1"])'
        ) ?? []
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

  // Close on outside click.
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

  const groups = useMemo(
    () => [
      { label: t('groupText'), keys: ['readable', 'linespacing', 'letterspacing'] as ToggleKey[] },
      { label: t('groupColor'), keys: ['contrast', 'grayscale', 'invert', 'links', 'headings'] as ToggleKey[] },
      { label: t('groupTools'), keys: ['bigcursor', 'hideimages', 'guide', 'mask', 'nomotion'] as ToggleKey[] }
    ],
    [t]
  );

  const sizeBtn =
    'flex h-9 w-9 items-center justify-center rounded border border-line bg-pure text-base font-bold text-graphite hover:border-blueprint hover:bg-paper dark:border-white/10 dark:bg-surface dark:text-ink dark:hover:border-skyline dark:hover:bg-white/5';

  const renderToggle = (key: ToggleKey) => (
    <button
      key={key}
      type="button"
      role="switch"
      aria-checked={toggles[key]}
      onClick={() => applyToggle(key, !toggles[key])}
      className="flex min-h-[44px] w-full items-center justify-between gap-3 border-t border-line py-2 text-start text-sm font-medium dark:border-white/10"
    >
      <span>{t(key)}</span>
      <span
        aria-hidden="true"
        className={`relative h-6 w-10 flex-none rounded-full transition-colors ${
          toggles[key] ? 'bg-softec' : 'bg-line dark:bg-white/15'
        }`}
      >
        <span
          className={`absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition-[inset-inline-start] ${
            toggles[key] ? 'start-[18px]' : 'start-0.5'
          }`}
        />
      </span>
    </button>
  );

  return (
    <div className="relative">
      {open && (
        <div
          ref={panelRef}
          role="dialog"
          aria-modal="true"
          aria-label={t('title')}
          className="absolute bottom-14 right-0 max-h-[min(74vh,600px)] w-[min(20rem,calc(100vw-2rem))] overflow-y-auto overscroll-contain rounded-lg border border-line bg-pure p-5 text-graphite shadow-[0_24px_60px_-18px_rgba(0,0,0,0.42)] dark:border-white/10 dark:bg-surface dark:text-ink"
        >
          <h2 className="text-base font-bold">{t('heading')}</h2>
          <p className="mb-4 mt-0.5 text-xs text-machine dark:text-fog">{t('body')}</p>

          <div className="flex items-center justify-between gap-2">
            <span className="text-sm font-medium">{t('textSize')}</span>
            <div className="flex items-center gap-1.5">
              <button type="button" className={sizeBtn} aria-label={t('decrease')} onClick={() => applyFont(font - 1)}>
                A−
              </button>
              <button type="button" className={sizeBtn} aria-label={t('normal')} onClick={() => applyFont(0)}>
                A
              </button>
              <button type="button" className={sizeBtn} aria-label={t('increase')} onClick={() => applyFont(font + 1)}>
                A+
              </button>
            </div>
          </div>

          {groups.map((group) => (
            <section key={group.label} className="mt-4">
              <h3 className="text-[0.7rem] font-bold uppercase tracking-[0.1em] text-machine dark:text-fog">{group.label}</h3>
              <div className="mt-1">{group.keys.map(renderToggle)}</div>
            </section>
          ))}

          <button
            type="button"
            onClick={reset}
            className="mt-4 min-h-[44px] w-full rounded border border-line text-sm font-semibold text-blueprint hover:bg-paper dark:border-white/10 dark:text-skyline dark:hover:bg-white/5"
          >
            {t('reset')}
          </button>
          <Link
            href="/legal/accessibility"
            className="mt-1 block min-h-[44px] py-2 text-center text-sm font-semibold text-blueprint underline underline-offset-2 dark:text-skyline"
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
