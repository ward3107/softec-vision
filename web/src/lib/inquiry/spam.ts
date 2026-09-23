import 'server-only';
import { createHmac, timingSafeEqual } from 'node:crypto';

/**
 * Lightweight, service-free spam defences for the quote form. Used together
 * with a honeypot field; none of them collect anything about the visitor
 * beyond a keyed hash of the IP address.
 */

const MIN_FILL_MS = 3_000; // faster than any person can complete the form
const MAX_TOKEN_AGE_MS = 24 * 60 * 60 * 1000;

const sign = (payload: string, secret: string) => createHmac('sha256', secret).update(payload).digest('hex');

/** A token binding the time the form was issued, so instant or replayed submissions stand out. */
export function signFormToken(issuedAt: number, secret: string): string {
  return `${issuedAt}.${sign(`form:${issuedAt}`, secret)}`;
}

export type TokenCheck = 'ok' | 'invalid' | 'too-fast' | 'expired';

export function checkFormToken(token: string | null | undefined, now: number, secret: string): TokenCheck {
  if (!token) return 'invalid';
  const [issuedRaw, signature] = token.split('.');
  const issuedAt = Number(issuedRaw);
  if (!Number.isSafeInteger(issuedAt) || !signature || !/^[a-f0-9]{64}$/.test(signature)) return 'invalid';
  const expected = Buffer.from(sign(`form:${issuedAt}`, secret), 'hex');
  const given = Buffer.from(signature, 'hex');
  if (given.length !== expected.length || !timingSafeEqual(given, expected)) return 'invalid';
  const age = now - issuedAt;
  if (age < 0) return 'invalid';
  if (age < MIN_FILL_MS) return 'too-fast';
  if (age > MAX_TOKEN_AGE_MS) return 'expired';
  return 'ok';
}

/**
 * Fixed-window limiter. Per server instance only — a first line of defence;
 * the store adds a durable per-address check when Supabase is configured.
 */
export function createRateLimiter({ limit, windowMs }: { limit: number; windowMs: number }) {
  const windows = new Map<string, { start: number; count: number }>();
  return {
    hit(key: string, now: number): boolean {
      const current = windows.get(key);
      if (!current || now - current.start >= windowMs) {
        windows.set(key, { start: now, count: 1 });
        if (windows.size > 5_000) {
          for (const [k, w] of windows) if (now - w.start >= windowMs) windows.delete(k);
        }
        return true;
      }
      current.count += 1;
      return current.count <= limit;
    }
  };
}
export type RateLimiter = ReturnType<typeof createRateLimiter>;

/** Cross-site POST guard: an Origin header, when sent, must match this host. */
export function isSameOrigin(origin: string | null, host: string | null): boolean {
  if (!origin) return true;
  try {
    return new URL(origin).host.toLowerCase() === (host ?? '').toLowerCase();
  } catch {
    return false;
  }
}

/** Keyed hash so repeat senders can be limited without storing their address. */
export function hashIp(ip: string, secret: string): string {
  return sign(`ip:${ip}`, secret);
}
