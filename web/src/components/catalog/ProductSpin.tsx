'use client';

import { useRef, useState, type KeyboardEvent, type PointerEvent } from 'react';

/**
 * Drag-to-rotate product viewer: a set of pre-rendered frames the visitor
 * swipes left/right (or arrows through) to turn the product. The frames cover
 * only the front half, so the range is clamped at both ends rather than looping
 * — the invented back of a reconstructed model is never shown. All frames are
 * stacked and preloaded on mount (the component only mounts once its tab is
 * opened), so turning is instant with no flicker.
 */
export default function ProductSpin({ frames, alt, label }: { frames: string[]; alt: string; label: string }) {
  const last = frames.length - 1;
  const [index, setIndex] = useState(Math.floor(last / 2)); // start facing front
  const [hinted, setHinted] = useState(false);
  const drag = useRef<{ x: number; from: number } | null>(null);
  const box = useRef<HTMLDivElement>(null);

  const clamp = (i: number) => setIndex(Math.max(0, Math.min(last, i)));

  const onPointerDown = (e: PointerEvent) => {
    try {
      (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
    } catch {
      /* capture is a nicety, not required */
    }
    drag.current = { x: e.clientX, from: index };
    setHinted(true);
  };
  const onPointerMove = (e: PointerEvent) => {
    if (!drag.current || !box.current) return;
    // Sweep the whole range across ~1.2× the viewer's width.
    const span = (box.current.clientWidth || 1) * 1.2;
    clamp(drag.current.from + Math.round(((e.clientX - drag.current.x) / span) * last));
  };
  const onPointerUp = () => {
    drag.current = null;
  };
  const onKeyDown = (e: KeyboardEvent) => {
    if (e.key === 'ArrowRight' || e.key === 'ArrowUp') {
      e.preventDefault();
      setHinted(true);
      clamp(index + 1);
    } else if (e.key === 'ArrowLeft' || e.key === 'ArrowDown') {
      e.preventDefault();
      setHinted(true);
      clamp(index - 1);
    }
  };

  return (
    <div
      ref={box}
      role="slider"
      tabIndex={0}
      aria-label={label}
      aria-valuemin={0}
      aria-valuemax={last}
      aria-valuenow={index}
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerUp}
      onPointerCancel={onPointerUp}
      onKeyDown={onKeyDown}
      className="relative h-full w-full cursor-ew-resize touch-none select-none focus-visible:outline focus-visible:outline-2 focus-visible:outline-blueprint"
    >
      {frames.map((src, i) => (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          key={src}
          src={src}
          alt={i === index ? alt : ''}
          aria-hidden={i === index ? undefined : true}
          draggable={false}
          className={`absolute inset-0 h-full w-full object-contain p-2 ${i === index ? '' : 'invisible'}`}
        />
      ))}
      {!hinted && (
        <span className="pointer-events-none absolute bottom-3 start-1/2 flex -translate-x-1/2 items-center gap-1.5 rounded-full bg-black/55 px-3 py-1 text-xs font-semibold text-white/90 backdrop-blur">
          <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <path d="M8 7l-4 5 4 5M16 7l4 5-4 5" />
          </svg>
          {label}
        </span>
      )}
      <span
        aria-hidden="true"
        className="pointer-events-none absolute bottom-0 start-0 h-0.5 bg-blueprint transition-[width] duration-75 dark:bg-skyline"
        style={{ width: `${(index / last) * 100}%` }}
      />
    </div>
  );
}
