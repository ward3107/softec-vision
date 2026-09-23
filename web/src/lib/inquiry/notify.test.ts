import { describe, expect, it, vi } from 'vitest';
import { buildInquiryEmail, createResendNotifier, createSmtpNotifier } from './notify';
import type { InquiryRecord } from './types';

const record: InquiryRecord = {
  name: 'Dana <script>alert(1)</script>',
  company: 'Example University',
  email: 'dana@example.com',
  phone: '+972 54-123-4567',
  country: 'Israel',
  projectType: 'lecture-hall',
  product: 'RAV-500',
  productName: 'Accessible Lecturer Station',
  roomDimensions: '8 x 12 m',
  requirements: 'Two stations.\nAccessible height.',
  consent: true,
  locale: 'en',
  ipHash: 'a'.repeat(64),
  userAgent: 'test-agent'
};

function setup(ok = true) {
  const fetchImpl = vi.fn().mockResolvedValue(new Response(ok ? '{"id":"x"}' : '{"message":"bad"}', { status: ok ? 200 : 422 }));
  const notifier = createResendNotifier({
    apiKey: 're_test',
    from: 'Softec Vision <website@example.com>',
    to: 'sales@example.com',
    fetchImpl
  });
  return { fetchImpl, notifier };
}

describe('createResendNotifier', () => {
  it('sends one email to the configured inbox, replying to the customer', async () => {
    const { fetchImpl, notifier } = setup();
    await notifier.send(record, { reference: 'abc-123', attachmentStored: false });

    const [url, init] = fetchImpl.mock.calls[0];
    expect(url).toBe('https://api.resend.com/emails');
    expect(init.method).toBe('POST');
    expect(init.headers.Authorization).toBe('Bearer re_test');
    const body = JSON.parse(init.body);
    expect(body.to).toEqual(['sales@example.com']);
    expect(body.reply_to).toBe('dana@example.com');
    expect(body.subject).toContain('RAV-500');
    expect(body.text).toContain('Example University');
    expect(body.text).toContain('abc-123');
  });

  it('escapes customer input in the HTML body', async () => {
    const { fetchImpl, notifier } = setup();
    await notifier.send(record, { attachmentStored: false });
    const body = JSON.parse(fetchImpl.mock.calls[0][1].body);
    expect(body.html).not.toContain('<script>');
    expect(body.html).toContain('&lt;script&gt;');
  });

  it('attaches the file itself only when it was not stored', async () => {
    const { fetchImpl, notifier } = setup();
    const attachment = { name: 'room.jpg', mime: 'image/jpeg', ext: 'jpg', bytes: new Uint8Array([1, 2, 3]) };

    await notifier.send(record, { attachment, attachmentStored: false });
    expect(JSON.parse(fetchImpl.mock.calls[0][1].body).attachments).toEqual([
      { filename: 'room.jpg', content: 'AQID' }
    ]);

    await notifier.send(record, { reference: 'abc', attachment, attachmentStored: true });
    const stored = JSON.parse(fetchImpl.mock.calls[1][1].body);
    expect(stored.attachments).toBeUndefined();
    expect(stored.text).toContain('room.jpg');
  });

  it('throws when the email service rejects the request', async () => {
    const { notifier } = setup(false);
    await expect(notifier.send(record, { attachmentStored: false })).rejects.toThrow(/422/);
  });
});

describe('buildInquiryEmail', () => {
  it('keeps the subject on one line even if a field contains line breaks', () => {
    const email = buildInquiryEmail({ ...record, name: 'Evil\r\nBcc: victim@example.com' }, { attachmentStored: false });
    expect(email.subject).not.toMatch(/[\r\n]/);
    expect(email.subject).toContain('Evil Bcc: victim@example.com');
  });
});

describe('createSmtpNotifier (Gmail)', () => {
  function smtp(fail = false) {
    // Loosely typed on purpose: the message shape is what these tests assert.
    const sendMail = vi.fn(async (_message: Record<string, any>) => {
      if (fail) throw new Error('auth failed');
      return { messageId: 'x' };
    });
    const notifier = createSmtpNotifier({
      transport: { sendMail },
      from: 'Softec Vision website <visionsoftec5@gmail.com>',
      to: 'visionsoftec5@gmail.com'
    });
    return { sendMail, notifier };
  }

  it('sends to the business inbox with Reply-To set to the customer', async () => {
    const { sendMail, notifier } = smtp();
    await notifier.send(record, { reference: 'ref-1', attachmentStored: false });
    const [message] = sendMail.mock.calls[0];
    expect(message).toMatchObject({
      from: 'Softec Vision website <visionsoftec5@gmail.com>',
      to: 'visionsoftec5@gmail.com',
      replyTo: 'dana@example.com'
    });
    expect(message.subject).toContain('RAV-500');
    expect(message.text).toContain('ref-1');
    expect(message.html).toContain('&lt;script&gt;');
  });

  it('attaches the file only when it was not stored', async () => {
    const { sendMail, notifier } = smtp();
    const attachment = { name: 'room.jpg', mime: 'image/jpeg', ext: 'jpg', bytes: new Uint8Array([1, 2, 3]) };
    await notifier.send(record, { attachment, attachmentStored: false });
    const [message] = sendMail.mock.calls[0];
    expect(message.attachments).toHaveLength(1);
    expect(message.attachments[0]).toMatchObject({ filename: 'room.jpg', contentType: 'image/jpeg' });
    expect(Buffer.from(message.attachments[0].content).equals(Buffer.from([1, 2, 3]))).toBe(true);

    await notifier.send(record, { attachment, attachmentStored: true });
    expect(sendMail.mock.calls[1][0].attachments).toBeUndefined();
  });

  it('propagates transport failures', async () => {
    const { notifier } = smtp(true);
    await expect(notifier.send(record, { attachmentStored: false })).rejects.toThrow(/auth failed/);
  });
});
