'use client';

import { useEffect } from 'react';
import { usePathname } from '@/i18n/navigation';

/**
 * Drives the scroll-reveal effect for every element tagged with the
 * `.reveal` class. Mounted once, globally. A single IntersectionObserver
 * watches all not-yet-revealed elements and unobserves each as it appears,
 * re-scanning after client-side navigation.
 *
 * Motion is opt-out, not opt-in: if the visitor prefers reduced motion (OS
 * setting) or has switched off animations in the accessibility widget, every
 * `.reveal` is marked visible immediately with no movement.
 */
export default function RevealController() {
  const pathname = usePathname();

  useEffect(() => {
    const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const motionOff = document.body.classList.contains('a11y-nomotion');
    const targets = Array.from(document.querySelectorAll<HTMLElement>('.reveal:not(.is-visible)'));

    if (prefersReduced || motionOff) {
      targets.forEach((el) => el.classList.add('is-visible'));
      return;
    }

    const observer = new IntersectionObserver(
      (entries, obs) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add('is-visible');
            obs.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.12, rootMargin: '0px 0px -8% 0px' }
    );

    targets.forEach((el) => {
      // Anything already in view on load reveals right away (no wait for scroll).
      const rect = el.getBoundingClientRect();
      if (rect.top < window.innerHeight * 0.92) {
        el.classList.add('is-visible');
      } else {
        observer.observe(el);
      }
    });

    return () => observer.disconnect();
  }, [pathname]);

  return null;
}
