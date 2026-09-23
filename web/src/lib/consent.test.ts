import { describe, expect, it } from 'vitest';
import {
  analyticsAllowed,
  CONSENT_TTL_MS,
  parseConsentRecord,
  serializeConsentRecord,
  shouldShowBanner
} from './consent';

const NOW = 1_700_000_000_000;

describe('parseConsentRecord', () => {
  it('reads back what serializeConsentRecord wrote', () => {
    const raw = serializeConsentRecord('granted', NOW);
    expect(parseConsentRecord(raw, NOW)).toEqual({ choice: 'granted', timestamp: NOW });
  });

  it('returns null for nothing stored', () => {
    expect(parseConsentRecord(null, NOW)).toBeNull();
  });

  it('returns null for malformed JSON', () => {
    expect(parseConsentRecord('{not json', NOW)).toBeNull();
  });

  it('returns null for a record missing required fields', () => {
    expect(parseConsentRecord(JSON.stringify({ choice: 'granted' }), NOW)).toBeNull();
    expect(parseConsentRecord(JSON.stringify({ timestamp: NOW }), NOW)).toBeNull();
  });

  it('returns null for an invalid choice value', () => {
    expect(parseConsentRecord(JSON.stringify({ choice: 'yes', timestamp: NOW }), NOW)).toBeNull();
  });

  it('treats an expired record as no choice', () => {
    const raw = serializeConsentRecord('granted', NOW);
    expect(parseConsentRecord(raw, NOW + CONSENT_TTL_MS + 1)).toBeNull();
  });

  it('keeps a record right up to the expiry boundary', () => {
    const raw = serializeConsentRecord('granted', NOW);
    expect(parseConsentRecord(raw, NOW + CONSENT_TTL_MS)).not.toBeNull();
  });
});

describe('analyticsAllowed', () => {
  it('allows analytics only with a granted, non-expired record and no GPC', () => {
    expect(analyticsAllowed({ choice: 'granted', timestamp: NOW }, false)).toBe(true);
  });

  it('refuses without a stored choice', () => {
    expect(analyticsAllowed(null, false)).toBe(false);
  });

  it('refuses a denied choice', () => {
    expect(analyticsAllowed({ choice: 'denied', timestamp: NOW }, false)).toBe(false);
  });

  it('GPC overrides even a granted choice', () => {
    expect(analyticsAllowed({ choice: 'granted', timestamp: NOW }, true)).toBe(false);
  });
});

describe('shouldShowBanner', () => {
  it('shows the banner when there is no stored choice', () => {
    expect(shouldShowBanner(null, false)).toBe(true);
  });

  it('never shows the banner once a choice is stored', () => {
    expect(shouldShowBanner({ choice: 'granted', timestamp: NOW }, false)).toBe(false);
    expect(shouldShowBanner({ choice: 'denied', timestamp: NOW }, false)).toBe(false);
  });

  it('never shows the banner when GPC is set, granted or not', () => {
    expect(shouldShowBanner(null, true)).toBe(false);
    expect(shouldShowBanner({ choice: 'granted', timestamp: NOW }, true)).toBe(false);
  });
});
