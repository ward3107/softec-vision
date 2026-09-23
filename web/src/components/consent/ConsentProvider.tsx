'use client';

import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from 'react';
import {
  analyticsAllowed,
  parseConsentRecord,
  serializeConsentRecord,
  shouldShowBanner,
  type ConsentChoice
} from '@/lib/consent';
import { loadAnalytics, revokeAnalytics, setDefaultConsent, trackEvent } from '@/lib/analytics';

const STORAGE_KEY = 'softec-consent';

interface ConsentContextValue {
  /** Whether analytics is currently allowed to run (granted, not expired, no GPC). */
  allowed: boolean;
  /** Whether there is anything to consent to at all (a measurement ID is configured). */
  hasAnalytics: boolean;
  showBanner: boolean;
  decide: (choice: ConsentChoice) => void;
  /** Reopen the banner (e.g. from a "Cookie settings" link) to change an earlier choice. */
  openPreferences: () => void;
  /** Record an analytics event; a safe no-op unless consent is currently granted. */
  track: (name: string, params?: Record<string, string | number | boolean>) => void;
}

const ConsentContext = createContext<ConsentContextValue | null>(null);

function readGpc(): boolean {
  if (typeof navigator === 'undefined') return false;
  return (navigator as Navigator & { globalPrivacyControl?: boolean }).globalPrivacyControl === true;
}

function readStoredChoice(): string | null {
  try {
    return localStorage.getItem(STORAGE_KEY);
  } catch {
    return null;
  }
}

function writeStoredChoice(choice: ConsentChoice) {
  try {
    localStorage.setItem(STORAGE_KEY, serializeConsentRecord(choice, Date.now()));
  } catch {
    /* private mode / blocked storage — the banner will simply ask again next visit */
  }
}

/**
 * Owns consent state for the whole app (GA4 via Consent Mode v2). Mounted
 * once near the root. Nothing analytics-related is ever requested before
 * the visitor answers the banner, and a Global Privacy Control signal is
 * honored automatically as a standing "no".
 */
export function ConsentProvider({ gaId, children }: { gaId: string; children: ReactNode }) {
  const [allowed, setAllowed] = useState(false);
  const [showBanner, setShowBanner] = useState(false);

  useEffect(() => {
    // Nothing to consent to without a measurement ID: no banner, nothing loads.
    if (!gaId) return;
    setDefaultConsent();
    const record = parseConsentRecord(readStoredChoice(), Date.now());
    const gpc = readGpc();
    const isAllowed = analyticsAllowed(record, gpc);
    setAllowed(isAllowed);
    setShowBanner(shouldShowBanner(record, gpc));
    if (isAllowed) loadAnalytics(gaId);
    // Only ever re-run this on a genuine measurement-id change (e.g. hot reload in dev).
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [gaId]);

  const decide = useCallback(
    (choice: ConsentChoice) => {
      writeStoredChoice(choice);
      setShowBanner(false);
      if (choice === 'granted') {
        setAllowed(true);
        if (gaId) loadAnalytics(gaId);
      } else {
        setAllowed(false);
        revokeAnalytics();
      }
    },
    [gaId]
  );

  const openPreferences = useCallback(() => {
    if (gaId) setShowBanner(true);
  }, [gaId]);
  const track = useCallback(
    (name: string, params?: Record<string, string | number | boolean>) => trackEvent(allowed, name, params),
    [allowed]
  );

  return (
    <ConsentContext.Provider value={{ allowed, hasAnalytics: Boolean(gaId), showBanner, decide, openPreferences, track }}>
      {children}
    </ConsentContext.Provider>
  );
}

export function useConsent(): ConsentContextValue {
  const ctx = useContext(ConsentContext);
  if (!ctx) throw new Error('useConsent must be used within a ConsentProvider');
  return ctx;
}
