'use client';

import { useRef, useState, type CSSProperties, type HTMLAttributes, type KeyboardEvent, type PointerEvent, type ReactNode } from 'react';

const MAX_ANGLE = 14;

type Props = HTMLAttributes<HTMLDivElement> & {
  children: ReactNode;
  label: string;
  hint: string;
};

/** A gentle, interactive tilt of the real product photo. One photo cannot reveal unseen sides. */
export default function HeroProductMotion({ children, label, hint, className, style, ...attributes }: Props) {
  const [angle, setAngle] = useState(0);
  const [manual, setManual] = useState(false);
  const drag = useRef<{ x: number; angle: number } | null>(null);

  const clamp = (value: number) => Math.max(-MAX_ANGLE, Math.min(MAX_ANGLE, value));

  const onPointerDown = (event: PointerEvent<HTMLDivElement>) => {
    if (event.button !== 0 || document.body.dataset.editing === 'true') return;
    setManual(true);
    drag.current = { x: event.clientX, angle };
    event.currentTarget.setPointerCapture(event.pointerId);
  };

  const onPointerMove = (event: PointerEvent<HTMLDivElement>) => {
    if (!drag.current) return;
    const width = event.currentTarget.clientWidth || 1;
    setAngle(clamp(drag.current.angle + ((event.clientX - drag.current.x) / width) * MAX_ANGLE * 3));
  };

  const onPointerUp = () => {
    drag.current = null;
  };

  const onKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    if (event.key !== 'ArrowLeft' && event.key !== 'ArrowRight') return;
    event.preventDefault();
    setManual(true);
    setAngle((current) => clamp(current + (event.key === 'ArrowRight' ? 2 : -2)));
  };

  return (
    <div
      {...attributes}
      role="slider"
      tabIndex={0}
      aria-label={label}
      aria-valuemin={-14}
      aria-valuemax={MAX_ANGLE}
      aria-valuenow={angle}
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerUp}
      onPointerCancel={onPointerUp}
      onKeyDown={onKeyDown}
      className={`home-hero__motion ${manual ? 'home-hero__motion--manual' : ''} ${className ?? ''}`}
      style={{ ...style, '--hero-angle': `${angle}deg` } as CSSProperties}
    >
      <div className="home-hero__motion-image">{children}</div>
      <span className="home-hero__motion-hint" aria-hidden="true">{hint}</span>
    </div>
  );
}
