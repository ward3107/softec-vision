'use client';

import { useEffect, useRef } from 'react';
import { useConsent } from '@/components/consent/ConsentProvider';

/**
 * Fires the "product viewed" event once consent is resolved. Renders
 * nothing. Consent starts unresolved on mount (ConsentProvider still needs
 * to read localStorage in its own effect), so this waits for `allowed` to
 * settle rather than firing on the very first render — otherwise the event
 * is silently dropped by a mount-order race between the two effects.
 */
export default function ProductViewTracker({ code }: { code: string }) {
  const { allowed, track } = useConsent();
  const trackedFor = useRef<string | null>(null);

  useEffect(() => {
    if (!allowed || trackedFor.current === code) return;
    trackedFor.current = code;
    track('product_viewed', { product: code });
  }, [code, allowed, track]);

  return null;
}
