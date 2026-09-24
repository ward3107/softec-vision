import type { ReactNode } from 'react';

/**
 * Root layout. It only passes children through: the real <html>/<body> live in
 * the segment layouts that know the locale (`[locale]/layout.tsx`, the RTL/LTR
 * admin layout) and in the self-contained `not-found.tsx`. Next.js still
 * requires this file to exist because there is a root-level `not-found.tsx`
 * and `error.tsx` — without it they "don't have a root layout" and render
 * unstyled. (This is the next-intl pattern for locale-prefixed routing.)
 */
export default function RootLayout({ children }: { children: ReactNode }) {
  return children;
}
