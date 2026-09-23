import { beforeEach, describe, expect, it, vi } from 'vitest';
import { submitInquiry, type SubmitDeps } from './submit';
import { createRateLimiter, signFormToken } from './spam';
import type { InquiryNotifier, InquiryStore } from './types';

const SECRET = 'secret';
const NOW = 1_800_000_000_000;
const JPEG = new Uint8Array([0xff, 0xd8, 0xff, 0xe0, 0, 0x10]);
const EXE = new Uint8Array([0x4d, 0x5a, 0x90, 0x00]);

function form(overrides: Record<string, string | File | null> = {}) {
  const fields: Record<string, string | File | null> = {
    name: 'Dana Levi',
    company: 'Example University',
    email: 'dana@example.com',
    phone: '+972 54-123-4567',
    country: 'Israel',
    projectType: 'lecture-hall',
    product: 'RAV-500',
    roomDimensions: '8 x 12 m',
    requirements: 'Two accessible lecturer stations for a 120-seat hall.',
    consent: 'on',
    locale: 'en',
    website: '',
    token: signFormToken(NOW - 30_000, SECRET),
    ...overrides
  };
  const fd = new FormData();
  for (const [k, v] of Object.entries(fields)) if (v !== null) fd.set(k, v);
  return fd;
}

let store: InquiryStore & { save: ReturnType<typeof vi.fn>; countRecent: ReturnType<typeof vi.fn> };
let notifier: InquiryNotifier & { send: ReturnType<typeof vi.fn> };
let deps: SubmitDeps;
const ctx = { ip: '203.0.113.7', userAgent: 'test-agent', now: NOW };

beforeEach(() => {
  store = {
    save: vi.fn().mockResolvedValue({ reference: '3f2a9c1e-0000-4000-8000-000000000000' }),
    countRecent: vi.fn().mockResolvedValue(0)
  };
  notifier = { send: vi.fn().mockResolvedValue(undefined) };
  deps = {
    store,
    notifier,
    secret: SECRET,
    limiter: createRateLimiter({ limit: 5, windowMs: 600_000 }),
    productName: (code) => (code === 'RAV-500' ? 'Accessible Lecturer Station' : undefined)
  };
});

describe('submitInquiry', () => {
  it('reports the service unavailable when nothing can receive inquiries', async () => {
    const result = await submitInquiry(form(), ctx, { ...deps, store: undefined, notifier: undefined });
    expect(result.status).toBe(503);
  });

  it('stores and notifies a valid request, returning a reference', async () => {
    const result = await submitInquiry(form(), ctx, deps);
    expect(result).toEqual({ status: 200, body: { ok: true, reference: '3F2A9C1E' } });

    const [record] = store.save.mock.calls[0];
    expect(record).toMatchObject({
      name: 'Dana Levi',
      email: 'dana@example.com',
      product: 'RAV-500',
      productName: 'Accessible Lecturer Station',
      userAgent: 'test-agent'
    });
    // The raw IP address is never stored.
    expect(JSON.stringify(record)).not.toContain('203.0.113.7');
    expect(record.ipHash).toMatch(/^[a-f0-9]{64}$/);

    expect(notifier.send).toHaveBeenCalledWith(
      expect.objectContaining({ email: 'dana@example.com' }),
      expect.objectContaining({ reference: '3f2a9c1e-0000-4000-8000-000000000000', attachmentStored: false })
    );
  });

  it('silently discards honeypot submissions without storing them', async () => {
    const result = await submitInquiry(form({ website: 'http://spam.example' }), ctx, deps);
    expect(result.status).toBe(200);
    expect(store.save).not.toHaveBeenCalled();
    expect(notifier.send).not.toHaveBeenCalled();
  });

  it('rejects missing or forged form tokens', async () => {
    expect((await submitInquiry(form({ token: null }), ctx, deps)).body).toEqual({ ok: false, error: 'token' });
    expect((await submitInquiry(form({ token: 'bad.token' }), ctx, deps)).status).toBe(400);
    expect(store.save).not.toHaveBeenCalled();
  });

  it('asks bots that submit instantly to slow down', async () => {
    const result = await submitInquiry(form({ token: signFormToken(NOW - 500, SECRET) }), ctx, deps);
    expect(result).toEqual({ status: 400, body: { ok: false, error: 'tooFast' } });
  });

  it('returns field errors for invalid input without storing', async () => {
    const result = await submitInquiry(form({ email: 'nope', consent: null }), ctx, deps);
    expect(result.status).toBe(422);
    expect(result.body).toEqual({ ok: false, errors: { email: 'invalidEmail', consent: 'consentRequired' } });
    expect(store.save).not.toHaveBeenCalled();
  });

  it('rate-limits repeated submissions from one address', async () => {
    const limited = { ...deps, limiter: createRateLimiter({ limit: 1, windowMs: 600_000 }) };
    expect((await submitInquiry(form(), ctx, limited)).status).toBe(200);
    expect((await submitInquiry(form(), ctx, limited)).status).toBe(429);
  });

  it('applies the durable per-address limit from storage', async () => {
    store.countRecent.mockResolvedValue(10);
    const result = await submitInquiry(form(), ctx, deps);
    expect(result.status).toBe(429);
    expect(store.save).not.toHaveBeenCalled();
  });

  it('drops product codes that are not in the catalog', async () => {
    await submitInquiry(form({ product: 'FAKE-1' }), ctx, deps);
    expect(store.save.mock.calls[0][0].product).toBe('');
  });

  it('passes a valid attachment to storage', async () => {
    const file = new File([JPEG], 'room.jpg', { type: 'image/jpeg' });
    const result = await submitInquiry(form({ attachment: file }), ctx, deps);
    expect(result.status).toBe(200);
    const [, attachment] = store.save.mock.calls[0];
    expect(attachment).toMatchObject({ name: 'room.jpg', mime: 'image/jpeg', ext: 'jpg' });
    expect(notifier.send.mock.calls[0][1].attachmentStored).toBe(true);
  });

  it('rejects a disguised or oversized attachment with a field error', async () => {
    const fake = new File([EXE], 'plan.pdf', { type: 'application/pdf' });
    const result = await submitInquiry(form({ attachment: fake }), ctx, deps);
    expect(result).toEqual({ status: 422, body: { ok: false, errors: { attachment: 'badType' } } });
  });

  it('ignores an empty file input', async () => {
    const empty = new File([], '', { type: 'application/octet-stream' });
    const result = await submitInquiry(form({ attachment: empty }), ctx, deps);
    expect(result.status).toBe(200);
    expect(store.save.mock.calls[0][1]).toBeUndefined();
  });

  it('still captures the lead by email when storage fails', async () => {
    store.save.mockRejectedValue(new Error('db down'));
    const file = new File([JPEG], 'room.jpg', { type: 'image/jpeg' });
    const result = await submitInquiry(form({ attachment: file }), ctx, deps);
    expect(result.status).toBe(200);
    // Without storage, the file travels with the email instead.
    expect(notifier.send.mock.calls[0][1]).toMatchObject({ attachmentStored: false });
    expect(notifier.send.mock.calls[0][1].attachment).toMatchObject({ name: 'room.jpg' });
  });

  it('succeeds when stored even if the email notification fails', async () => {
    notifier.send.mockRejectedValue(new Error('smtp down'));
    expect((await submitInquiry(form(), ctx, deps)).status).toBe(200);
  });

  it('fails only when no channel captured the lead', async () => {
    store.save.mockRejectedValue(new Error('db down'));
    notifier.send.mockRejectedValue(new Error('smtp down'));
    expect(await submitInquiry(form(), ctx, deps)).toEqual({ status: 500, body: { ok: false, error: 'failed' } });
  });

  it('works with email notification alone', async () => {
    const result = await submitInquiry(form(), ctx, { ...deps, store: undefined });
    expect(result).toEqual({ status: 200, body: { ok: true } });
    expect(notifier.send).toHaveBeenCalledOnce();
  });
});
