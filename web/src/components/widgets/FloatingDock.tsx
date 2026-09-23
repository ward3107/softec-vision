'use client';

import { useEffect, useState } from 'react';
import { useTranslations } from 'next-intl';
import AccessibilityWidget from '@/components/a11y/AccessibilityWidget';

/**
 * Fixed controls split across the physical screen edges: WhatsApp and the
 * back-to-top control stay on the left, while accessibility stays on the
 * right in both RTL and LTR. Sits above the compare tray when it is showing.
 */
export default function FloatingDock({ waNumber }: { waNumber: string }) {
  const t = useTranslations('dock');
  const [showTop, setShowTop] = useState(false);

  useEffect(() => {
    const onScroll = () => setShowTop(window.scrollY > 600);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  const toTop = () => {
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    window.scrollTo({ top: 0, behavior: reduce ? 'auto' : 'smooth' });
  };

  return (
    <>
      <div className="fixed bottom-5 left-4 z-[60] flex flex-col items-center gap-3 print:hidden">
        {showTop && (
          <button
            type="button"
            onClick={toTop}
            aria-label={t('backToTop')}
            className="flex h-11 w-11 items-center justify-center rounded-full border border-line bg-pure text-graphite shadow-md hover:border-blueprint hover:bg-paper"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden="true">
              <path d="M12 19V6m0 0l-6 6m6-6l6 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </button>
        )}

        <a
          href={`https://wa.me/${waNumber}`}
          target="_blank"
          rel="noopener noreferrer"
          aria-label={t('whatsapp')}
          className="flex h-12 w-12 items-center justify-center rounded-full bg-[#15803d] text-white shadow-lg ring-1 ring-black/5 hover:bg-[#166534]"
        >
          <svg width="26" height="26" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
            <path d="M12.04 2C6.58 2 2.13 6.45 2.13 11.91c0 1.75.46 3.45 1.32 4.95L2 22l5.25-1.38a9.9 9.9 0 0 0 4.79 1.22h.01c5.46 0 9.91-4.45 9.91-9.91C21.96 6.45 17.5 2 12.04 2zm5.8 14.03c-.24.68-1.42 1.33-1.95 1.38-.5.05-.97.24-3.28-.68-2.77-1.09-4.53-3.92-4.67-4.1-.13-.18-1.12-1.49-1.12-2.84 0-1.35.71-2.01.96-2.29.24-.27.53-.34.71-.34.18 0 .35 0 .51.01.16.01.39-.06.6.46.24.58.79 2 .86 2.14.07.14.12.3.02.48-.09.18-.14.29-.28.45-.14.16-.29.36-.42.48-.14.14-.28.29-.12.57.16.27.71 1.17 1.53 1.9 1.05.93 1.94 1.22 2.22 1.36.27.14.43.12.59-.07.16-.18.68-.79.86-1.06.18-.27.36-.23.6-.14.24.09 1.55.73 1.81.86.27.14.45.2.51.31.07.11.07.64-.17 1.31z" />
          </svg>
        </a>
      </div>

      <div className="fixed bottom-5 right-4 z-[60] print:hidden">
        <AccessibilityWidget />
      </div>
    </>
  );
}
