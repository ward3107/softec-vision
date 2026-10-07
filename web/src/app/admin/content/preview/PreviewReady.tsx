'use client';

import { useEffect } from 'react';

export default function PreviewReady({ locale }: { locale: 'he' | 'en' }) {
  useEffect(() => {
    // Let React finish hydrating before the editor applies its local DOM draft.
    const frame = requestAnimationFrame(() => {
      document.documentElement.lang = locale;
      document.documentElement.dir = locale === 'he' ? 'rtl' : 'ltr';
      document.documentElement.dataset.cmsReady = 'true';
      window.parent.postMessage({ type: 'softec-preview-ready' }, window.location.origin);
    });
    return () => { cancelAnimationFrame(frame); delete document.documentElement.dataset.cmsReady; };
  }, [locale]);
  return null;
}
