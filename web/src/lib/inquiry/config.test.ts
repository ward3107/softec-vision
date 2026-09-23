import { describe, expect, it } from 'vitest';
import { DEFAULT_INQUIRY_INBOX, getInquiryConfig } from './config';

describe('getInquiryConfig', () => {
  it('keeps online submission off until a delivery channel is configured', () => {
    const config = getInquiryConfig({});
    expect(config.onlineEnabled).toBe(false);
    expect(config.store).toBe(false);
    expect(config.email).toBeNull();
  });

  it('sends through Gmail with just an App Password, to and from the business inbox', () => {
    const config = getInquiryConfig({ GMAIL_APP_PASSWORD: 'abcd efgh ijkl mnop' });
    expect(config.email).toBe('smtp');
    expect(config.smtp).toMatchObject({ host: 'smtp.gmail.com', port: 465, secure: true, user: DEFAULT_INQUIRY_INBOX });
    expect(config.notifyTo).toBe('visionsoftec5@gmail.com');
    expect(config.onlineEnabled).toBe(true);
  });

  it('supports any SMTP server (e.g. a company mail server)', () => {
    const config = getInquiryConfig({
      SMTP_HOST: 'mail.example.com',
      SMTP_PORT: '587',
      SMTP_USER: 'web@example.com',
      SMTP_PASS: 'smtp-password-123'
    });
    expect(config.email).toBe('smtp');
    expect(config.smtp).toMatchObject({ host: 'mail.example.com', port: 587, secure: false, user: 'web@example.com' });
  });

  it('enables storage when Supabase URL and service key are both set', () => {
    const config = getInquiryConfig({
      NEXT_PUBLIC_SUPABASE_URL: 'https://x.supabase.co',
      SUPABASE_SERVICE_ROLE_KEY: 'service-role-key-000000'
    });
    expect(config.store).toBe(true);
    expect(config.onlineEnabled).toBe(true);
  });

  it('does not enable storage with only half the Supabase settings', () => {
    expect(getInquiryConfig({ NEXT_PUBLIC_SUPABASE_URL: 'https://x.supabase.co' }).store).toBe(false);
  });

  it('prefers SMTP over Resend and honours explicit overrides', () => {
    const config = getInquiryConfig({
      GMAIL_USER: 'sales@example.com',
      GMAIL_APP_PASSWORD: 'abcdefghijklmnop',
      RESEND_API_KEY: 're_x',
      INQUIRY_EMAIL_FROM: 'web@example.com',
      INQUIRY_NOTIFY_TO: 'team@example.com',
      INQUIRY_TOKEN_SECRET: 'explicit-secret-value-123'
    });
    expect(config.email).toBe('smtp');
    expect(config.smtp.user).toBe('sales@example.com');
    expect(config.notifyTo).toBe('team@example.com');
    expect(config.secret).toBe('explicit-secret-value-123');
  });

  it('can use Resend when SMTP is not configured', () => {
    const config = getInquiryConfig({ RESEND_API_KEY: 're_1234567890abcdef', INQUIRY_EMAIL_FROM: 'web@example.com' });
    expect(config.email).toBe('resend');
    expect(config.onlineEnabled).toBe(true);
  });
});
