'use client';

/**
 * Thin bridge to GA4 via gtag.js, driven entirely by consent.ts. The script
 * is never injected until the visitor has actively granted analytics
 * consent — not merely defaulted to "denied" and left loading anyway. If no
 * measurement ID is configured, every function here is a safe no-op.
 */

declare global {
  interface Window {
    dataLayer?: unknown[];
    gtag?: (...args: unknown[]) => void;
  }
}

function gtag(...args: unknown[]) {
  if (typeof window === 'undefined') return;
  window.dataLayer = window.dataLayer || [];
  window.dataLayer.push(args);
}

/**
 * Stage the Consent Mode v2 defaults. Safe to call even if gtag.js never
 * loads — it just primes the dataLayer queue for if/when it does. We do not
 * use ads or personalization, so those signals are always denied.
 */
export function setDefaultConsent() {
  gtag('consent', 'default', {
    analytics_storage: 'denied',
    ad_storage: 'denied',
    ad_user_data: 'denied',
    ad_personalization: 'denied'
  });
}

let scriptLoaded = false;
let loadedMeasurementId: string | null = null;

/** Inject gtag.js and configure GA4 — call only after consent is granted. */
export function loadAnalytics(measurementId: string) {
  if (typeof document === 'undefined' || !measurementId) return;
  gtag('consent', 'update', { analytics_storage: 'granted' });
  if (scriptLoaded) return;
  scriptLoaded = true;
  loadedMeasurementId = measurementId;
  const script = document.createElement('script');
  script.async = true;
  script.src = `https://www.googletagmanager.com/gtag/js?id=${encodeURIComponent(measurementId)}`;
  document.head.appendChild(script);
  gtag('js', new Date());
  // anonymize_ip is GA4's default and kept explicit for clarity; no ad signals are ever sent.
  gtag('config', measurementId, { anonymize_ip: true });
}

/** Withdraw consent: tell gtag (if it ever loaded) to stop, going forward. */
export function revokeAnalytics() {
  gtag('consent', 'update', { analytics_storage: 'denied' });
}

/**
 * Record a product-analytics event. No-ops (no dataLayer push at all)
 * unless analytics is currently allowed, so nothing is queued pre-consent.
 */
export function trackEvent(allowed: boolean, name: string, params?: Record<string, string | number | boolean>) {
  if (!allowed) return;
  if (!loadedMeasurementId) return; // script never loaded (e.g. no measurement ID configured)
  gtag('event', name, params ?? {});
}
