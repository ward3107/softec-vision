'use client';

import { useCallback, useEffect, useId, useRef, useState, type PointerEvent, type ReactNode } from 'react';

/** A dedicated product carousel: categories and subcategories remain grids. */
export default function ProductScroller({
  children,
  caption,
  labels
}: {
  children: ReactNode;
  caption?: ReactNode;
  labels: { region: string; previous: string; next: string };
}) {
  return (
    <ProductRow caption={caption} labels={labels}>
      {children}
    </ProductRow>
  );
}

const arrowButton =
  'inline-flex h-11 w-11 items-center justify-center rounded-full border-2 border-blueprint bg-pure text-blueprint shadow-sm transition-[background-color,color,transform] hover:-translate-y-0.5 hover:bg-blueprint hover:text-pure disabled:cursor-not-allowed disabled:opacity-30 disabled:hover:translate-y-0 disabled:hover:bg-pure disabled:hover:text-blueprint';

function Chevron({ direction }: { direction: 'previous' | 'next' }) {
  // Drawn for LTR and mirrored in RTL, where "previous" is to the right.
  return (
    <svg
      viewBox="0 0 24 24"
      className="h-5 w-5 rtl:-scale-x-100"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.75"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d={direction === 'previous' ? 'M15 18l-6-6 6-6' : 'M9 18l6-6-6-6'} />
    </svg>
  );
}

function ProductRow({
  children,
  caption,
  labels
}: {
  children: ReactNode;
  caption?: ReactNode;
  labels: { region: string; previous: string; next: string };
}) {
  const id = useId();
  const ref = useRef<HTMLDivElement>(null);
  const [edges, setEdges] = useState({ start: true, end: false });
  const drag = useRef<{ x: number; left: number; moved: boolean } | null>(null);
  // Survives pointerup so the click the browser fires right after a drag doesn't open a product.
  const dragged = useRef(false);

  // |scrollLeft| grows from 0 towards the end in both LTR and RTL (RTL is negative).
  const update = useCallback(() => {
    const el = ref.current;
    if (!el) return;
    const pos = Math.abs(el.scrollLeft);
    setEdges({ start: pos <= 2, end: pos + el.clientWidth >= el.scrollWidth - 2 });
  }, []);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    update();
    const observer = new ResizeObserver(update);
    observer.observe(el);
    return () => observer.disconnect();
  }, [update]);

  function step(direction: 1 | -1) {
    const el = ref.current;
    if (!el) return;
    const rtl = getComputedStyle(el).direction === 'rtl';
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    el.scrollBy({ left: direction * (rtl ? -1 : 1) * el.clientWidth * 0.85, behavior: reduce ? 'auto' : 'smooth' });
  }

  function onPointerDown(event: PointerEvent<HTMLDivElement>) {
    if (event.pointerType !== 'mouse' || event.button !== 0 || !ref.current) return;
    drag.current = { x: event.clientX, left: ref.current.scrollLeft, moved: false };
  }

  function onPointerMove(event: PointerEvent<HTMLDivElement>) {
    const el = ref.current;
    const d = drag.current;
    if (!el || !d) return;
    const dx = event.clientX - d.x;
    if (!d.moved) {
      if (Math.abs(dx) < 6) return; // a click, not a drag (yet)
      d.moved = true;
      el.setPointerCapture(event.pointerId);
      el.style.scrollSnapType = 'none'; // snapping fights a hand-held scroll
    }
    el.scrollLeft = d.left - dx;
  }

  function endDrag(event: PointerEvent<HTMLDivElement>) {
    const el = ref.current;
    const d = drag.current;
    drag.current = null;
    if (!el || !d?.moved) return;
    if (el.hasPointerCapture(event.pointerId)) el.releasePointerCapture(event.pointerId);
    el.style.scrollSnapType = '';
    dragged.current = true;
    setTimeout(() => {
      dragged.current = false;
    }, 0);
  }

  return (
    <div className="mt-4 sm:mt-8">
      <div className="flex items-center justify-between gap-4">
        <p className="text-base font-extrabold text-blueprint">{caption}</p>
        <div className={`flex flex-none gap-2 ${edges.start && edges.end ? 'invisible' : ''}`}>
          <button type="button" className={arrowButton} onClick={() => step(-1)} disabled={edges.start} aria-controls={id} aria-label={labels.previous}>
            <Chevron direction="previous" />
          </button>
          <button type="button" className={arrowButton} onClick={() => step(1)} disabled={edges.end} aria-controls={id} aria-label={labels.next}>
            <Chevron direction="next" />
          </button>
        </div>
      </div>
      <div
        id={id}
        ref={ref}
        role="region"
        aria-label={labels.region}
        onScroll={update}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={endDrag}
        onPointerCancel={endDrag}
        onClickCapture={(event) => {
          if (dragged.current) {
            event.preventDefault();
            event.stopPropagation();
          }
        }}
        onDragStart={(event) => event.preventDefault()}
        className="mt-2 -mx-[clamp(20px,4.5vw,72px)] flex select-none snap-x snap-mandatory gap-4 overflow-x-auto px-[clamp(20px,4.5vw,72px)] pb-4 pt-1 sm:pb-6 sm:mt-4 scroll-px-[clamp(20px,4.5vw,72px)] [-webkit-overflow-scrolling:touch] [scrollbar-color:#1683C7_#E6F2F9] [scrollbar-width:thin] [&>*]:w-[82%] [&>*]:shrink-0 [&>*]:snap-start sm:mx-0 sm:scroll-px-0 sm:gap-6 sm:px-0 sm:[&>*]:w-[46%] lg:[&>*]:w-[31%] xl:[&>*]:w-[23.5%]"
      >
        {children}
      </div>
    </div>
  );
}
