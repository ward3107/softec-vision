import { describe, expect, it } from 'vitest';
import { checkFormToken, createRateLimiter, hashIp, isSameOrigin, signFormToken } from './spam';

const SECRET = 'test-secret';
const T0 = 1_800_000_000_000;

describe('form token', () => {
  it('accepts a token after a human-plausible delay', () => {
    const token = signFormToken(T0, SECRET);
    expect(checkFormToken(token, T0 + 20_000, SECRET)).toBe('ok');
  });

  it('flags submissions faster than a person could type', () => {
    const token = signFormToken(T0, SECRET);
    expect(checkFormToken(token, T0 + 1_000, SECRET)).toBe('too-fast');
  });

  it('expires stale tokens', () => {
    const token = signFormToken(T0, SECRET);
    expect(checkFormToken(token, T0 + 25 * 60 * 60 * 1000, SECRET)).toBe('expired');
  });

  it('rejects missing, malformed, forged or re-timed tokens', () => {
    const token = signFormToken(T0, SECRET);
    expect(checkFormToken(undefined, T0 + 20_000, SECRET)).toBe('invalid');
    expect(checkFormToken('garbage', T0 + 20_000, SECRET)).toBe('invalid');
    expect(checkFormToken(signFormToken(T0, 'other-secret'), T0 + 20_000, SECRET)).toBe('invalid');
    const [, sig] = token.split('.');
    expect(checkFormToken(`${T0 - 60_000}.${sig}`, T0 + 20_000, SECRET)).toBe('invalid');
  });

  it('rejects tokens issued in the future', () => {
    const token = signFormToken(T0 + 60_000, SECRET);
    expect(checkFormToken(token, T0, SECRET)).toBe('invalid');
  });
});

describe('rate limiter', () => {
  it('allows up to the limit per key within the window, then blocks', () => {
    const limiter = createRateLimiter({ limit: 3, windowMs: 60_000 });
    expect([1, 2, 3].map(() => limiter.hit('1.2.3.4', T0))).toEqual([true, true, true]);
    expect(limiter.hit('1.2.3.4', T0 + 1)).toBe(false);
    expect(limiter.hit('5.6.7.8', T0 + 1)).toBe(true); // other visitors unaffected
  });

  it('resets once the window has passed', () => {
    const limiter = createRateLimiter({ limit: 1, windowMs: 60_000 });
    expect(limiter.hit('ip', T0)).toBe(true);
    expect(limiter.hit('ip', T0 + 30_000)).toBe(false);
    expect(limiter.hit('ip', T0 + 61_000)).toBe(true);
  });
});

describe('isSameOrigin', () => {
  it('accepts posts from the site itself', () => {
    expect(isSameOrigin('https://softecvision.vercel.app', 'softecvision.vercel.app')).toBe(true);
    expect(isSameOrigin('http://localhost:3000', 'localhost:3000')).toBe(true);
  });

  it('rejects posts from other sites', () => {
    expect(isSameOrigin('https://evil.example', 'softecvision.vercel.app')).toBe(false);
    expect(isSameOrigin('not a url', 'softecvision.vercel.app')).toBe(false);
  });

  it('allows requests without an Origin header (the form token still applies)', () => {
    expect(isSameOrigin(null, 'softecvision.vercel.app')).toBe(true);
  });
});

describe('hashIp', () => {
  it('is stable, keyed and does not reveal the address', () => {
    const a = hashIp('203.0.113.7', SECRET);
    expect(a).toBe(hashIp('203.0.113.7', SECRET));
    expect(a).not.toContain('203.0.113.7');
    expect(a).not.toBe(hashIp('203.0.113.7', 'other'));
  });
});
