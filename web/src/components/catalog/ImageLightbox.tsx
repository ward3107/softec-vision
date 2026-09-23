'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';

type Img = { src: string; alt: string };
export type LightboxLabels = {
  close: string;
  previous: string;
  next: string;
  zoomIn: string;
  zoomOut: string;
  hint: string;
  /** Shown instead of `hint` on touch devices, where there are no zoom buttons. */
  hintTouch: string;
};

const MIN = 1;
const MAX = 4;
const STEP = 0.5;

const ctrl =
  'absolute z-10 flex h-11 w-11 items-center justify-center rounded-full bg-black/55 text-2xl text-white/90 backdrop-blur transition-colors hover:bg-black/80 focus-visible:outline focus-visible:outline-2 focus-visible:outline-white disabled:opacity-40';

/**
 * Full-screen product-photo viewer with zoom and pan: the image fits the
 * screen at 1× and magnifies up to 4× so fine detail can be inspected. On a
 * mouse it zooms with the +/− buttons, the wheel or a click; on a touch screen
 * with a two-finger pinch (the buttons are hidden there) or a tap. Drag — or,
 * mid-pinch, the fingers' midpoint — pans when zoomed. A plain <img> shows the
 * original file (no resized copy). Escape closes; arrows page through the set
 * when not zoomed.
 */
export default function ImageLightbox({
  images,
  index,
  onClose,
  onNavigate,
  labels
}: {
  images: Img[];
  index: number | null;
  onClose: () => void;
  onNavigate: (i: number) => void;
  labels: LightboxLabels;
}) {
  const open = index !== null;
  const [scale, setScale] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const drag = useRef<{ x: number; y: number; ox: number; oy: number } | null>(null);
  // Every pointer currently on the image, so two of them can drive a pinch.
  const pointers = useRef<Map<number, { x: number; y: number }>>(new Map());
  const pinch = useRef<{ dist: number; scale: number; ox: number; oy: number; mx: number; my: number } | null>(null);
  // Survives pointerup so the click the browser fires right after a drag/pinch doesn't also zoom.
  const dragged = useRef(false);
  const closeRef = useRef<HTMLButtonElement>(null);
  const restoreRef = useRef<Element | null>(null);

  const reset = useCallback(() => {
    setScale(1);
    setPan({ x: 0, y: 0 });
  }, []);

  useEffect(() => {
    reset();
  }, [index, reset]);

  useEffect(() => {
    if (!open) return;
    restoreRef.current = document.activeElement;
    const previous = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    closeRef.current?.focus();
    return () => {
      document.body.style.overflow = previous;
      (restoreRef.current as HTMLElement | null)?.focus?.();
    };
  }, [open]);

  const clampPan = useCallback((x: number, y: number, s: number) => {
    if (typeof window === 'undefined' || s <= 1) return { x: 0, y: 0 };
    const maxX = ((s - 1) * window.innerWidth) / 2;
    const maxY = ((s - 1) * window.innerHeight) / 2;
    return { x: Math.max(-maxX, Math.min(maxX, x)), y: Math.max(-maxY, Math.min(maxY, y)) };
  }, []);

  const zoomTo = useCallback(
    (next: number) => {
      const s = Math.min(MAX, Math.max(MIN, Math.round(next * 100) / 100));
      setScale(s);
      setPan((p) => clampPan(p.x, p.y, s));
    },
    [clampPan]
  );

  const go = useCallback(
    (delta: number) => {
      if (index === null) return;
      onNavigate((index + delta + images.length) % images.length);
    },
    [index, images.length, onNavigate]
  );

  useEffect(() => {
    if (!open) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose();
      else if (event.key === '+' || event.key === '=') zoomTo(scale + STEP);
      else if (event.key === '-') zoomTo(scale - STEP);
      else if (scale === 1 && event.key === 'ArrowRight') go(1);
      else if (scale === 1 && event.key === 'ArrowLeft') go(-1);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, go, onClose, zoomTo, scale]);

  if (index === null) return null;
  const image = images[index];
  const multiple = images.length > 1;

  const onWheel = (e: React.WheelEvent) => zoomTo(scale + (e.deltaY < 0 ? STEP : -STEP));

  const twoPoints = () => [...pointers.current.values()] as [{ x: number; y: number }, { x: number; y: number }];
  const gap = (a: { x: number; y: number }, b: { x: number; y: number }) => Math.hypot(a.x - b.x, a.y - b.y);

  const onPointerDown = (e: React.PointerEvent) => {
    dragged.current = false;
    try {
      (e.target as HTMLElement).setPointerCapture(e.pointerId);
    } catch {
      // A stray pointerId (e.g. the element just re-rendered) — capture is a nicety, not required.
    }
    pointers.current.set(e.pointerId, { x: e.clientX, y: e.clientY });
    if (pointers.current.size === 2) {
      // Two fingers down → start a pinch (works from 1× too, so fingers alone zoom in).
      const [a, b] = twoPoints();
      pinch.current = { dist: gap(a, b), scale, ox: pan.x, oy: pan.y, mx: (a.x + b.x) / 2, my: (a.y + b.y) / 2 };
      drag.current = null;
    } else if (pointers.current.size === 1 && scale > 1) {
      drag.current = { x: e.clientX, y: e.clientY, ox: pan.x, oy: pan.y };
    }
  };
  const onPointerMove = (e: React.PointerEvent) => {
    if (!pointers.current.has(e.pointerId)) return;
    pointers.current.set(e.pointerId, { x: e.clientX, y: e.clientY });
    if (pinch.current && pointers.current.size >= 2) {
      const [a, b] = twoPoints();
      const next = Math.min(MAX, Math.max(MIN, (pinch.current.scale * gap(a, b)) / pinch.current.dist));
      // Follow the fingers' midpoint so the pinch also nudges the pan.
      const dmx = (a.x + b.x) / 2 - pinch.current.mx;
      const dmy = (a.y + b.y) / 2 - pinch.current.my;
      dragged.current = true;
      setScale(next);
      setPan(clampPan(pinch.current.ox + dmx, pinch.current.oy + dmy, next));
      return;
    }
    if (!drag.current) return;
    const dx = e.clientX - drag.current.x;
    const dy = e.clientY - drag.current.y;
    if (Math.abs(dx) > 3 || Math.abs(dy) > 3) dragged.current = true;
    setPan(clampPan(drag.current.ox + dx, drag.current.oy + dy, scale));
  };
  const onPointerUp = (e: React.PointerEvent) => {
    pointers.current.delete(e.pointerId);
    if (pointers.current.size < 2) pinch.current = null;
    // Lifting one finger of a pinch → keep panning smoothly with the one that remains.
    const [only] = twoPoints();
    drag.current = pointers.current.size === 1 && scale > 1 && only ? { x: only.x, y: only.y, ox: pan.x, oy: pan.y } : null;
  };
  const onImageClick = () => {
    if (dragged.current) {
      dragged.current = false;
      return;
    }
    zoomTo(scale >= MAX ? 1 : scale === 1 ? 2.5 : scale + STEP);
  };

  // Portal to <body>: the product column animates in with a CSS transform, and
  // a transformed ancestor would otherwise confine this fixed overlay to it.
  return createPortal(
    <div
      role="dialog"
      aria-modal="true"
      aria-label={image.alt}
      onClick={onClose}
      onWheel={onWheel}
      className="fixed inset-0 z-[100] flex items-center justify-center overflow-hidden bg-black/[0.97] p-4"
    >
      <button ref={closeRef} type="button" onClick={onClose} aria-label={labels.close} className={`${ctrl} end-4 top-4`}>
        ✕
      </button>
      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          zoomTo(scale + STEP);
        }}
        disabled={scale >= MAX}
        aria-label={labels.zoomIn}
        className={`${ctrl} start-4 top-4 text-lg [@media(pointer:coarse)]:hidden`}
      >
        +
      </button>
      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          zoomTo(scale - STEP);
        }}
        disabled={scale <= MIN}
        aria-label={labels.zoomOut}
        className={`${ctrl} start-4 top-[4.5rem] text-lg [@media(pointer:coarse)]:hidden`}
      >
        −
      </button>
      {multiple && scale === 1 && (
        <>
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              go(-1);
            }}
            aria-label={labels.previous}
            className={`${ctrl} start-3 top-1/2 -translate-y-1/2`}
          >
            ‹
          </button>
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              go(1);
            }}
            aria-label={labels.next}
            className={`${ctrl} end-3 top-1/2 -translate-y-1/2`}
          >
            ›
          </button>
        </>
      )}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={image.src}
        alt={image.alt}
        onClick={(e) => {
          e.stopPropagation();
          onImageClick();
        }}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerCancel={onPointerUp}
        draggable={false}
        style={{ transform: `translate(${pan.x}px, ${pan.y}px) scale(${scale})` }}
        className={`max-h-[92vh] max-w-[94vw] touch-none object-contain ${
          drag.current || pinch.current ? '' : 'transition-transform duration-150'
        } ${scale === 1 ? 'cursor-zoom-in' : drag.current ? 'cursor-grabbing' : 'cursor-grab'}`}
      />
      <p className="pointer-events-none absolute bottom-4 start-0 end-0 text-center text-xs text-white/70">
        {scale > 1 ? (
          `${Math.round(scale * 100)}%`
        ) : (
          <>
            <span className="[@media(pointer:coarse)]:hidden">{labels.hint}</span>
            <span className="hidden [@media(pointer:coarse)]:inline">{labels.hintTouch}</span>
          </>
        )}
      </p>
    </div>,
    document.body
  );
}
