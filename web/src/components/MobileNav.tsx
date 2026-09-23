'use client';

import { useEffect, useRef, useState } from 'react';
import { Link, usePathname } from '@/i18n/navigation';

export interface MobileNavLink {
  href: string;
  label: string;
}

/**
 * Compact menu for screens below the `lg` breakpoint, where the primary nav
 * is otherwise unreachable. A disclosure, not a modal: focus is trapped and
 * Escape/outside-click close it, matching AccessibilityWidget's pattern, but
 * the rest of the page stays interactive underneath.
 */
export default function MobileNav({
  links,
  primaryLabel,
  openLabel,
  closeLabel
}: {
  links: MobileNavLink[];
  primaryLabel: string;
  openLabel: string;
  closeLabel: string;
}) {
  const [open, setOpen] = useState(false);
  const panelRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const pathname = usePathname();

  // A navigation (e.g. the browser back/forward buttons) should close it.
  useEffect(() => {
    setOpen(false);
  }, [pathname]);

  // Escape closes; focus is trapped while the panel is open.
  useEffect(() => {
    if (!open) return;
    const panel = panelRef.current;
    const focusables = () =>
      Array.from(panel?.querySelectorAll<HTMLElement>('a[href],button:not([disabled])') ?? []);
    focusables()[0]?.focus();
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.stopPropagation();
        setOpen(false);
        buttonRef.current?.focus();
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

  // Close on outside click (but not on the toggle button itself).
  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent) => {
      const target = e.target as Node;
      if (!panelRef.current?.contains(target) && !buttonRef.current?.contains(target)) setOpen(false);
    };
    document.addEventListener('mousedown', onDown);
    return () => document.removeEventListener('mousedown', onDown);
  }, [open]);

  return (
    <div className="lg:hidden">
      <button
        ref={buttonRef}
        type="button"
        aria-expanded={open}
        aria-controls="mobile-nav-panel"
        aria-label={open ? closeLabel : openLabel}
        onClick={() => setOpen((v) => !v)}
        className="flex h-11 w-11 flex-none items-center justify-center rounded border border-line text-graphite hover:border-blueprint dark:border-white/10 dark:text-ink dark:hover:border-skyline"
      >
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" aria-hidden="true">
          {open ? (
            <path d="M6 6l12 12M18 6L6 18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
          ) : (
            <path d="M4 7h16M4 12h16M4 17h16" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
          )}
        </svg>
      </button>

      {open && (
        <div
          id="mobile-nav-panel"
          ref={panelRef}
          className="absolute inset-x-0 top-full z-40 border-b border-line bg-pure shadow-[0_16px_40px_-16px_rgba(0,0,0,0.25)] dark:border-white/10 dark:bg-surface"
        >
          <nav aria-label={primaryLabel} className="mx-auto max-w-shell px-[clamp(16px,4.5vw,72px)] py-2">
            <ul>
              {links.map((link) => (
                <li key={link.href} className="border-b border-line last:border-b-0 dark:border-white/10">
                  <Link
                    href={link.href}
                    onClick={() => setOpen(false)}
                    className="flex min-h-[48px] items-center text-base font-semibold text-graphite hover:text-blueprint dark:text-ink dark:hover:text-skyline"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>
        </div>
      )}
    </div>
  );
}
