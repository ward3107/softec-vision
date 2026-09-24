'use client';

import { useEffect, useRef, useState, type KeyboardEvent, type PointerEvent } from 'react';

/**
 * Hero showpiece: the RAV-500 rendered as a set of transparent front-half
 * frames the visitor drags left/right (or arrows through) to turn the model —
 * the same "3D feel" as the product page, but built from images so it stays
 * light on the landing page. The range is clamped at both ends (never loops),
 * so the reconstructed model's weaker back is never shown.
 *
 * LCP guard: until the component hydrates on the client, only the front frame
 * is in the DOM, so the hero's Largest Contentful Paint stays a single image.
 * The remaining frames mount a tick later and turning is then instant.
 */
export default function HeroSpin({
  frames,
  alt,
  label,
  className = ''
}: {
  frames: string[];
  alt: string;
  label: string;
  className?: string;
}) {
  const last = frames.length - 1;
  const front = Math.floor(last / 2); // middle frame faces front
  const [index, setIndex] = useState(front);
  const [hydrated, setHydrated] = useState(false);
  const [hinted, setHinted] = useState(false);
  const drag = useRef<{ x: number; from: number } | null>(null);
  const box = useRef<HTMLDivElement>(null);

  // Mount the full frame stack only after hydration (keeps LCP to one image).
  useEffect(() => setHydrated(true), []);

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
      // touch-pan-y: vertical swipes still scroll the page (this fills a large
      // area of the hero); only horizontal drags turn the model.
      className={`group cursor-ew-resize touch-pan-y select-none focus-visible:outline focus-visible:outline-2 focus-visible:outline-blueprint ${className}`}
    >
      {frames.map((src, i) => {
        if (!hydrated && i !== front) return null;
        const visible = i === index;
        return (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            key={src}
            src={src}
            alt={visible ? alt : ''}
            aria-hidden={visible ? undefined : true}
            draggable={false}
            // The front frame is the hero's LCP image; load it eagerly.
            loading={i === front ? 'eager' : 'lazy'}
            fetchPriority={i === front ? 'high' : 'low'}
            decoding="async"
            className={`h-full w-full object-contain object-center ${visible ? '' : 'invisible'}`}
            style={i === front ? undefined : { position: 'absolute', inset: 0 }}
          />
        );
      })}
      {!hinted && (
        <span className="pointer-events-none absolute bottom-3 start-1/2 z-[3] flex -translate-x-1/2 items-center gap-1.5 rounded-full bg-black/55 px-3 py-1 text-xs font-semibold text-white/90 backdrop-blur transition-opacity duration-300 group-hover:opacity-0">
          <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <path d="M8 7l-4 5 4 5M16 7l4 5-4 5" />
          </svg>
          {label}
        </span>
      )}
    </div>
  );
}
