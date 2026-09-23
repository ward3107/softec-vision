import 'server-only';

/** The business inbox that receives quote requests (not secret). */
export const DEFAULT_INQUIRY_INBOX = 'visionsoftec5@gmail.com';

type Env = Record<string, string | undefined>;

/**
 * Which delivery channels are configured. Online submission turns on only when
 * at least one channel can receive the request; until then the form hands the
 * request to WhatsApp so no lead is lost.
 *
 * Environment (all server-side; nothing here reaches the browser):
 * - NEXT_PUBLIC_SUPABASE_URL + SUPABASE_SERVICE_ROLE_KEY → store in Supabase
 * - GMAIL_APP_PASSWORD (+ optional GMAIL_USER) → email via Gmail SMTP
 * - SMTP_HOST / SMTP_PORT / SMTP_SECURE / SMTP_USER / SMTP_PASS → any other SMTP server
 * - RESEND_API_KEY + INQUIRY_EMAIL_FROM → email via Resend (alternative)
 * - INQUIRY_NOTIFY_TO → override the destination inbox
 * - INQUIRY_TOKEN_SECRET → HMAC secret (falls back to a configured secret)
 */
export function getInquiryConfig(env: Env = process.env) {
  const supabaseUrl = env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = env.SUPABASE_SERVICE_ROLE_KEY;
  const store = Boolean(supabaseUrl && serviceKey);

  const smtpPass = env.SMTP_PASS || env.GMAIL_APP_PASSWORD || '';
  const port = Number(env.SMTP_PORT || 465);
  const smtp = {
    host: env.SMTP_HOST || 'smtp.gmail.com',
    port,
    secure: env.SMTP_SECURE ? env.SMTP_SECURE === 'true' : port === 465,
    user: env.SMTP_USER || env.GMAIL_USER || DEFAULT_INQUIRY_INBOX,
    pass: smtpPass
  };
  const resendKey = env.RESEND_API_KEY;
  const resendFrom = env.INQUIRY_EMAIL_FROM;
  const email: 'smtp' | 'resend' | null = smtpPass ? 'smtp' : resendKey && resendFrom ? 'resend' : null;

  const secret = env.INQUIRY_TOKEN_SECRET || serviceKey || smtpPass || resendKey || '';

  return {
    store,
    supabase: { url: supabaseUrl ?? '', serviceKey: serviceKey ?? '' },
    email,
    smtp,
    resend: { apiKey: resendKey ?? '', from: resendFrom ?? '' },
    notifyTo: env.INQUIRY_NOTIFY_TO || DEFAULT_INQUIRY_INBOX,
    secret,
    onlineEnabled: (store || email !== null) && secret.length >= 16
  };
}

export type InquiryConfig = ReturnType<typeof getInquiryConfig>;
