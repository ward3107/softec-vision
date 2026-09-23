import type { ReactNode } from 'react';

/**
 * Product grid that turns into a horizontal, snap-scrolling row on mobile so
 * the images are easy to swipe through, and reverts to the usual multi-column
 * grid from the `sm` breakpoint up. Purely presentational — direct children
 * (e.g. ProductCard) are sized via arbitrary child selectors, so nothing about
 * the cards themselves changes. On mobile it bleeds to the screen edges for a
 * natural swipe; the negative margin matches the page's side gutter.
 */
export default function ProductScroller({ children }: { children: ReactNode }) {
  return (
    <div
      className="mt-4 -mx-[clamp(20px,4.5vw,72px)] flex snap-x snap-mandatory gap-4 overflow-x-auto px-[clamp(20px,4.5vw,72px)] pb-3 [-webkit-overflow-scrolling:touch] [&>*]:w-[76%] [&>*]:shrink-0 [&>*]:snap-start sm:mx-0 sm:grid sm:grid-cols-2 sm:gap-x-6 sm:gap-y-10 sm:overflow-visible sm:px-0 sm:pb-0 sm:[&>*]:w-auto sm:[&>*]:shrink lg:grid-cols-3"
    >
      {children}
    </div>
  );
}
