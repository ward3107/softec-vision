/**
 * Attachment rules for the quote form. Shared: the browser uses the limits for
 * instant feedback; the server re-checks the file's actual content.
 */

/** Stays under Vercel's ~4.5 MB serverless request-body limit. */
export const MAX_ATTACHMENT_BYTES = 4 * 1024 * 1024;

export const ACCEPTED_TYPES: Record<string, string> = {
  'image/jpeg': 'jpg',
  'image/png': 'png',
  'image/webp': 'webp',
  'image/heic': 'heic',
  'application/pdf': 'pdf'
};

/** `accept` attribute for the file input. */
export const ACCEPT_ATTRIBUTE = '.jpg,.jpeg,.png,.webp,.heic,.heif,.pdf,image/jpeg,image/png,image/webp,image/heic,image/heif,application/pdf';

const startsWith = (bytes: Uint8Array, signature: number[], offset = 0) =>
  bytes.length >= offset + signature.length && signature.every((b, i) => bytes[offset + i] === b);
const ascii = (s: string) => Array.from(s, (c) => c.charCodeAt(0));
const HEIF_BRANDS = ['heic', 'heix', 'hevc', 'heim', 'heis', 'mif1', 'msf1'];

/** Identify a file from its first bytes. Returns null for unsupported content. */
export function sniffType(bytes: Uint8Array): string | null {
  if (startsWith(bytes, [0xff, 0xd8, 0xff])) return 'image/jpeg';
  if (startsWith(bytes, [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a])) return 'image/png';
  if (startsWith(bytes, ascii('%PDF-'))) return 'application/pdf';
  if (startsWith(bytes, ascii('RIFF')) && startsWith(bytes, ascii('WEBP'), 8)) return 'image/webp';
  if (startsWith(bytes, ascii('ftyp'), 4)) {
    const brand = String.fromCharCode(...bytes.slice(8, 12));
    if (HEIF_BRANDS.includes(brand)) return 'image/heic';
  }
  return null;
}

const GLB_MAGIC = ascii('glTF');

/** True for a glTF Binary (.glb) file: magic bytes, then a version-2 header. Used for product 3D-model uploads, the same content-sniffing approach as sniffType(). */
export function isGlb(bytes: Uint8Array): boolean {
  if (!startsWith(bytes, GLB_MAGIC) || bytes.length < 24) return false;
  const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
  if (view.getUint32(4, true) !== 2 || view.getUint32(8, true) !== bytes.length) return false;
  let offset = 12;
  let chunks = 0;
  let document: { asset?: { version?: string }; buffers?: Array<{ uri?: string; byteLength?: number }> } | undefined;
  let binaryLength = 0;
  while (offset < bytes.length) {
    if (offset + 8 > bytes.length) return false;
    const length = view.getUint32(offset, true);
    const type = view.getUint32(offset + 4, true);
    if (length % 4 !== 0 || offset + 8 + length > bytes.length) return false;
    if (chunks === 0) {
      if (type !== 0x4e4f534a || length === 0) return false;
      try { document = JSON.parse(new TextDecoder('utf-8', { fatal: true }).decode(bytes.slice(offset + 8, offset + 8 + length))); }
      catch { return false; }
      if (document?.asset?.version !== '2.0') return false;
      const full = document as { buffers?: Array<{ uri?: string }>; images?: Array<{ uri?: string }> };
      if (!Array.isArray(full.buffers ?? []) || !Array.isArray(full.images ?? [])) return false;
      if ([...(full.buffers ?? []), ...(full.images ?? [])].some(item => !item || (item.uri && (typeof item.uri !== 'string' || !item.uri.startsWith('data:'))))) return false;
    } else if (chunks === 1 && type === 0x004e4942) binaryLength = length;
    else return false;
    offset += 8 + length;
    chunks++;
  }
  return Boolean(document) && (document?.buffers ?? []).every(buffer => buffer.uri || (typeof buffer.byteLength === 'number' && buffer.byteLength >= 0 && buffer.byteLength <= binaryLength));
}

export type AttachmentCheck = { ok: true; mime: string; ext: string } | { ok: false; error: 'tooLarge' | 'badType' };

export function checkAttachment(file: { name: string; size: number; bytes: Uint8Array }): AttachmentCheck {
  if (file.size > MAX_ATTACHMENT_BYTES) return { ok: false, error: 'tooLarge' };
  const mime = sniffType(file.bytes);
  if (!mime) return { ok: false, error: 'badType' };
  return { ok: true, mime, ext: ACCEPTED_TYPES[mime] };
}

/** Display-safe original filename (never used as a storage path). */
export function safeFilename(name: string): string {
  const base = name.split(/[\\/]/).pop() ?? '';
  const cleaned = base.replace(/[<>:"|?*\u0000-\u001f]/g, '').trim();
  if (!cleaned) return 'attachment';
  if (cleaned.length <= 120) return cleaned;
  const dot = cleaned.lastIndexOf('.');
  const ext = dot > 0 ? cleaned.slice(dot) : '';
  return cleaned.slice(0, 120 - ext.length) + ext;
}
