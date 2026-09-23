'use client';

import { useCallback, useEffect, useRef, useState } from 'react';

type Img = { src: string; alt: string };
export type LightboxLabels = {
  close: string;
  previous: string;
  next: string;
  zoomIn: string;
  zoomOut: string;
  hint: string;
};

const ctrl =
  'absolute z-10 flex h-11 w-11 items-center justify-center rounded-full bg-black/50 text-2xl text-white/90 backdrop-blur transition-colors hover:bg-black/75 focus-visible:outline focus-visible:outline-2 focus-visible:outline-white';

/**
 * Full-screen viewer for product photos. Opens at `index` (null = closed),
 * fits the photo to the screen, and a click (or the zoom button) toggles the
 * image to its native pixel size — scroll/drag to inspect fine detail — using
 * a plain <img> so the original file is shown at full resolution rather than a
 * resized copy. Escape closes; arrows page through a multi-photo set.
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
  const [zoomed, setZoomed] = useState(false);
  const closeRef = useRef<HTMLButtonElement>(null);
  const restoreRef = useRef<Element | null>(null);

  useEffect(() => setZoomed(false), [index]);

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
      else if (event.key === 'ArrowRight') go(1);
      else if (event.key === 'ArrowLeft') go(-1);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, go, onClose]);

  if (index === null) return null;
  const image = images[index];
  const multiple = images.length > 1;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={image.alt}
      onClick={onClose}
      className="fixed inset-0 z-[100] flex items-center justify-center bg-black/90 p-4"
    >
      <button ref={closeRef} type="button" onClick={onClose} aria-label={labels.close} className={`${ctrl} end-4 top-4`}>
        ✕
      </button>
      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          setZoomed((z) => !z);
        }}
        aria-label={zoomed ? labels.zoomOut : labels.zoomIn}
        className={`${ctrl} start-4 top-4 text-lg`}
      >
        {zoomed ? '−' : '+'}
      </button>
      {multiple && (
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
      <div className={`max-h-full max-w-full ${zoomed ? 'overflow-auto' : ''}`} onClick={(e) => e.stopPropagation()}>
        {/* Plain img: shows the original file at full resolution (Next/Image would serve a resized copy). */}
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={image.src}
          alt={image.alt}
          onClick={() => setZoomed((z) => !z)}
          className={
            zoomed
              ? 'max-w-none cursor-zoom-out'
              : 'max-h-[88vh] max-w-[92vw] cursor-zoom-in object-contain'
          }
        />
      </div>
      {!zoomed && (
        <p className="pointer-events-none absolute bottom-4 start-0 end-0 text-center text-xs text-white/70">{labels.hint}</p>
      )}
    </div>
  );
}
