import type { InquiryInput } from './schema';

/** A validated inquiry plus server-derived context. Contains no raw IP. */
export interface InquiryRecord extends InquiryInput {
  /** Localized catalog name for the selected product code ('' if none). */
  productName: string;
  /** Keyed hash of the sender's IP, for rate limiting only. */
  ipHash: string;
  userAgent: string;
}

export interface InquiryAttachment {
  name: string;
  mime: string;
  ext: string;
  bytes: Uint8Array;
}

export interface InquiryStore {
  /** `attachmentStored: false` means the file must travel another way (email). */
  save(
    record: InquiryRecord,
    attachment?: InquiryAttachment
  ): Promise<{ reference: string; attachmentStored?: boolean }>;
  /** Inquiries from this address hash since the given ISO time (durable rate limit). */
  countRecent?(ipHash: string, sinceIso: string): Promise<number>;
}

export interface InquiryNotifier {
  send(
    record: InquiryRecord,
    options: { reference?: string; attachment?: InquiryAttachment; attachmentStored: boolean }
  ): Promise<void>;
}
