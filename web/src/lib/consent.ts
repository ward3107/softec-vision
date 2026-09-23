/**
 * Analytics consent state — pure logic, no DOM access, so it is fully unit
 * testable. The UI (ConsentBanner) and the gtag bridge (analytics.ts) both
 * build on this.
 *
 * Consent is required everywhere, not just in regions that legally require
 * it: the banner always asks first, and nothing analytics-related loads
 * until the visitor answers.
 */

export type ConsentChoice = 'granted' | 'denied';

export interface ConsentRecord {
  choice: ConsentChoice;
  /** When the choice was made (ms since epoch). */
  timestamp: number;
}

/** After this long a stored choice is treated as if it were never made (matches the privacy policy's 12-month commitment). */
export const CONSENT_TTL_MS = 365 * 24 * 60 * 60 * 1000;

const isConsentChoice = (value: unknown): value is ConsentChoice => value === 'granted' || value === 'denied';

/** Parse whatever was in storage; anything malformed or expired is treated as "no choice yet". */
export function parseConsentRecord(raw: string | null, now: number): ConsentRecord | null {
  if (!raw) return null;
  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch {
    return null;
  }
  if (
    typeof parsed !== 'object' ||
    parsed === null ||
    !isConsentChoice((parsed as Record<string, unknown>).choice) ||
    typeof (parsed as Record<string, unknown>).timestamp !== 'number'
  ) {
    return null;
  }
  const record = parsed as ConsentRecord;
  if (now - record.timestamp > CONSENT_TTL_MS) return null; // expired: ask again
  return record;
}

export function serializeConsentRecord(choice: ConsentChoice, now: number): string {
  return JSON.stringify({ choice, timestamp: now } satisfies ConsentRecord);
}

/**
 * Global Privacy Control is a browser/extension opt-out signal (a proposed
 * standard already recognized under CCPA/CPRA and referenced by some EU
 * guidance) that we must honor automatically, without asking. It always
 * wins over a previously stored "granted" choice.
 */
export function analyticsAllowed(record: ConsentRecord | null, gpc: boolean): boolean {
  if (gpc) return false;
  return record?.choice === 'granted';
}

/**
 * Whether the banner should be shown. A GPC signal is itself the visitor's
 * answer (an opt-out) — respected silently, with no repeat prompt; they can
 * still change it later from the persistent preferences control.
 */
export function shouldShowBanner(record: ConsentRecord | null, gpc: boolean): boolean {
  if (gpc) return false;
  return record === null;
}
