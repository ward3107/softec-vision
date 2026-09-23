import 'server-only';
import type { InquiryAttachment, InquiryNotifier, InquiryRecord } from './types';

/**
 * Email notification of a new quote request. One message goes to the business
 * inbox with Reply-To set to the customer. Two transports share one message
 * builder: Gmail SMTP (App Password) and Resend's HTTP API.
 */

type NotifyOptions = { reference?: string; attachment?: InquiryAttachment; attachmentStored: boolean };

const escapeHtml = (value: string) =>
  value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');

/** Header-safe: collapses any line breaks so a field can never add headers. */
const oneLine = (value: string) => value.replace(/[\r\n]+/g, ' ').trim();

function fieldRows(record: InquiryRecord, { reference, attachment, attachmentStored }: NotifyOptions) {
  const product = record.product ? `${record.productName} (${record.product})` : '';
  const file = attachment
    ? `${attachment.name}${attachmentStored ? ' — stored with the inquiry' : ' — attached to this email'}`
    : '';
  return (
    [
      ['Reference', reference ?? ''],
      ['Name', record.name],
      ['Company', record.company],
      ['Email', record.email],
      ['Phone', record.phone],
      ['Country', record.country],
      ['Project type', record.projectType.replace(/-/g, ' ')],
      ['Product', product],
      ['Room dimensions', record.roomDimensions],
      ['Site language', record.locale === 'he' ? 'Hebrew' : 'English'],
      ['Attachment', file]
    ] as Array<[string, string]>
  ).filter(([, value]) => value);
}

export interface InquiryEmail {
  subject: string;
  text: string;
  html: string;
  replyTo: string;
  /** Present only when the file was not stored and must travel with the email. */
  attachment?: InquiryAttachment;
}

export function buildInquiryEmail(record: InquiryRecord, options: NotifyOptions): InquiryEmail {
  const rows = fieldRows(record, options);
  const subject = oneLine(`Quote request — ${record.name}${record.product ? ` — ${record.product}` : ''}`);
  const text = [...rows.map(([label, value]) => `${label}: ${value}`), '', 'Requirements:', record.requirements].join('\n');
  const html = `<h2 style="font-family:Arial,sans-serif">New quote request</h2>
<table style="font-family:Arial,sans-serif;border-collapse:collapse">${rows
    .map(
      ([label, value]) =>
        `<tr><th style="text-align:left;padding:4px 12px 4px 0;color:#697077">${escapeHtml(label)}</th><td style="padding:4px 0">${escapeHtml(value)}</td></tr>`
    )
    .join('')}</table>
<h3 style="font-family:Arial,sans-serif">Requirements</h3>
<p style="font-family:Arial,sans-serif;white-space:pre-wrap">${escapeHtml(record.requirements)}</p>`;
  return {
    subject,
    text,
    html,
    replyTo: oneLine(record.email),
    attachment: options.attachment && !options.attachmentStored ? options.attachment : undefined
  };
}

/** Gmail (or any SMTP) via a nodemailer-compatible transport. */
export function createSmtpNotifier({
  transport,
  from,
  to
}: {
  transport: { sendMail: (message: Record<string, unknown>) => Promise<unknown> };
  from: string;
  to: string;
}): InquiryNotifier {
  return {
    async send(record, options) {
      const email = buildInquiryEmail(record, options);
      await transport.sendMail({
        from,
        to,
        replyTo: email.replyTo,
        subject: email.subject,
        text: email.text,
        html: email.html,
        ...(email.attachment
          ? {
              attachments: [
                { filename: email.attachment.name, content: Buffer.from(email.attachment.bytes), contentType: email.attachment.mime }
              ]
            }
          : {})
      });
    }
  };
}

/** Resend's HTTP API (no SDK dependency). */
export function createResendNotifier({
  apiKey,
  from,
  to,
  fetchImpl = fetch
}: {
  apiKey: string;
  from: string;
  to: string;
  fetchImpl?: typeof fetch;
}): InquiryNotifier {
  return {
    async send(record, options) {
      const email = buildInquiryEmail(record, options);
      const payload: Record<string, unknown> = {
        from,
        to: [to],
        reply_to: email.replyTo,
        subject: email.subject,
        text: email.text,
        html: email.html
      };
      if (email.attachment) {
        payload.attachments = [
          { filename: email.attachment.name, content: Buffer.from(email.attachment.bytes).toString('base64') }
        ];
      }
      const response = await fetchImpl('https://api.resend.com/emails', {
        method: 'POST',
        headers: { Authorization: `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      if (!response.ok) throw new Error(`Resend responded ${response.status}`);
    }
  };
}
