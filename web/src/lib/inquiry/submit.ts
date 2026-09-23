import 'server-only';
import { checkAttachment, safeFilename } from './attachment';
import { shortReference } from './reference';
import { inquiryFromFormData, validateInquiry, type InquiryErrors } from './schema';
import { checkFormToken, hashIp, type RateLimiter } from './spam';
import type { InquiryAttachment, InquiryNotifier, InquiryRecord, InquiryStore } from './types';

export interface SubmitDeps {
  store?: InquiryStore;
  notifier?: InquiryNotifier;
  /** HMAC secret for form tokens and IP hashing. */
  secret: string;
  limiter: RateLimiter;
  /** Localized product name for a catalog code, or undefined if unknown. */
  productName: (code: string, locale: 'he' | 'en') => string | undefined;
}

export type SubmitResult =
  | { status: 200; body: { ok: true; reference?: string } }
  | { status: 422; body: { ok: false; errors: InquiryErrors } }
  | { status: 400; body: { ok: false; error: 'token' | 'tooFast' } }
  | { status: 429; body: { ok: false; error: 'rateLimited' } }
  | { status: 503; body: { ok: false; error: 'unavailable' } }
  | { status: 500; body: { ok: false; error: 'failed' } };

const DURABLE_LIMIT = 10; // inquiries per address hash per hour
const HOUR_MS = 60 * 60 * 1000;

const isFile = (value: FormDataEntryValue | null): value is File =>
  typeof value === 'object' && value !== null && 'arrayBuffer' in value;

/**
 * Handle one quote request end to end: spam checks, validation, attachment
 * checks, then delivery to storage and/or email. The lead counts as captured
 * if at least one channel accepted it.
 */
export async function submitInquiry(
  fd: FormData,
  ctx: { ip: string; userAgent: string; now: number },
  deps: SubmitDeps
): Promise<SubmitResult> {
  const { store, notifier } = deps;
  if (!store && !notifier) return { status: 503, body: { ok: false, error: 'unavailable' } };

  // Honeypot: people never see this field. Pretend success so bots move on.
  const honeypot = fd.get('website');
  if (typeof honeypot === 'string' && honeypot.trim() !== '') return { status: 200, body: { ok: true } };

  const token = fd.get('token');
  const tokenCheck = checkFormToken(typeof token === 'string' ? token : null, ctx.now, deps.secret);
  if (tokenCheck === 'too-fast') return { status: 400, body: { ok: false, error: 'tooFast' } };
  if (tokenCheck !== 'ok') return { status: 400, body: { ok: false, error: 'token' } };

  const ipHash = hashIp(ctx.ip, deps.secret);
  if (!deps.limiter.hit(ipHash, ctx.now)) return { status: 429, body: { ok: false, error: 'rateLimited' } };

  const validation = validateInquiry(inquiryFromFormData(fd));
  if (!validation.ok) return { status: 422, body: { ok: false, errors: validation.errors } };
  const data = validation.data;

  let attachment: InquiryAttachment | undefined;
  const file = fd.get('attachment');
  if (isFile(file) && file.size > 0) {
    const bytes = new Uint8Array(await file.arrayBuffer());
    const check = checkAttachment({ name: file.name, size: file.size, bytes });
    if (!check.ok) return { status: 422, body: { ok: false, errors: { attachment: check.error } } };
    attachment = { name: safeFilename(file.name), mime: check.mime, ext: check.ext, bytes };
  }

  if (store?.countRecent) {
    try {
      const recent = await store.countRecent(ipHash, new Date(ctx.now - HOUR_MS).toISOString());
      if (recent >= DURABLE_LIMIT) return { status: 429, body: { ok: false, error: 'rateLimited' } };
    } catch (error) {
      console.error('[inquiry] durable rate check failed', error); // fail open: never lose a lead to this
    }
  }

  const productName = data.product ? deps.productName(data.product, data.locale) : undefined;
  const record: InquiryRecord = {
    ...data,
    product: productName ? data.product : '',
    productName: productName ?? '',
    ipHash,
    userAgent: ctx.userAgent.slice(0, 300)
  };

  let reference: string | undefined;
  let attachmentStored = false;
  if (store) {
    try {
      const saved = await store.save(record, attachment);
      reference = saved.reference;
      attachmentStored = Boolean(attachment) && (saved.attachmentStored ?? true);
    } catch (error) {
      console.error('[inquiry] storage failed', error);
    }
  }

  let notified = false;
  if (notifier) {
    try {
      await notifier.send(record, { reference, attachment, attachmentStored });
      notified = true;
    } catch (error) {
      console.error('[inquiry] notification failed', error);
    }
  }

  if (!reference && !notified) return { status: 500, body: { ok: false, error: 'failed' } };
  return { status: 200, body: reference ? { ok: true, reference: shortReference(reference) } : { ok: true } };
}
