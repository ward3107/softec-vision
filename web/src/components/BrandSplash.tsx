'use client';

import { useEffect, useState } from 'react';
import BrandLogo from './BrandLogo';

const STORAGE_KEY = 'softec-brand-intro-seen';

export default function BrandSplash() {
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    const root = document.documentElement;
    let alreadySeen = root.classList.contains('brand-splash-seen');

    try {
      alreadySeen = alreadySeen || localStorage.getItem(STORAGE_KEY) === '1';
    } catch {
      // Storage is optional; the intro still works for this page view.
    }

    if (alreadySeen) {
      setVisible(false);
      return;
    }

    document.body.classList.add('brand-splash-open');
    const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const timer = window.setTimeout(() => {
      try {
        localStorage.setItem(STORAGE_KEY, '1');
      } catch {
        // Keep the site usable when storage is unavailable.
      }
      root.classList.add('brand-splash-seen');
      document.body.classList.remove('brand-splash-open');
      setVisible(false);
    }, reduceMotion ? 700 : 2800);

    return () => {
      window.clearTimeout(timer);
      document.body.classList.remove('brand-splash-open');
    };
  }, []);

  if (!visible) return null;

  return (
    <div className="brand-splash" aria-hidden="true">
      <div className="brand-splash__card">
        <BrandLogo priority className="brand-splash__logo" />
        <span className="brand-splash__line" />
      </div>
    </div>
  );
}
