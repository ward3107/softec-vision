import 'server-only';
import { createTransport } from 'nodemailer';
import { createServiceClient } from '@/lib/supabase/server';
import { localized } from '@/lib/catalog/types';
import { PRODUCTS } from '@/lib/catalog/seed';
import legalContent from '@/lib/legal/content.json';
import type { InquiryConfig } from './config';
import { createResendNotifier, createSmtpNotifier } from './notify';
import { createRateLimiter } from './spam';
import { createSupabaseInquiryStore } from './store';
import type { SubmitDeps } from './submit';

/** Privacy-policy version the visitor consented to (its "last updated" date). */
export const PRIVACY_VERSION = (legalContent as { privacy: { lastUpdated: { en: string } } }).privacy.lastUpdated.en;

// Per-instance first line of defence; the store adds a durable per-address limit.
const limiter = createRateLimiter({ limit: 8, windowMs: 10 * 60 * 1000 });

const productName: SubmitDeps['productName'] = (code, locale) => {
  const product = PRODUCTS.find((p) => p.code === code);
  return product ? localized(product.name, locale) : undefined;
};

/** Build real delivery dependencies from configuration (server only). */
export function createInquiryDeps(config: InquiryConfig): SubmitDeps {
  const store = config.store
    ? createSupabaseInquiryStore(createServiceClient(), { consentVersion: PRIVACY_VERSION })
    : undefined;

  let notifier: SubmitDeps['notifier'];
  if (config.email === 'smtp') {
    notifier = createSmtpNotifier({
      transport: createTransport({
        host: config.smtp.host,
        port: config.smtp.port,
        secure: config.smtp.secure,
        // Google shows App Passwords with spaces; SMTP needs them without.
        auth: { user: config.smtp.user, pass: config.smtp.pass.replace(/\s+/g, '') }
      }),
      from: `Softec Vision website <${config.smtp.user}>`,
      to: config.notifyTo
    });
  } else if (config.email === 'resend') {
    notifier = createResendNotifier({ apiKey: config.resend.apiKey, from: config.resend.from, to: config.notifyTo });
  }

  return { store, notifier, secret: config.secret, limiter, productName };
}
