import { uploadExtension } from './upload';
export const EXTERNAL_MEDIA_KINDS = ['image', 'gallery', 'video'] as const;
export type ExternalMediaKind = (typeof EXTERNAL_MEDIA_KINDS)[number];

/** Direct file links only. No server-side fetching of arbitrary URLs. */
export function validateExternalMedia(kind: string, raw: string): string | null {
  if (!EXTERNAL_MEDIA_KINDS.includes(kind as ExternalMediaKind) || raw.length > 2048) return null;
  try {
    const url = new URL(raw.trim());
    if (url.protocol !== 'https:' || url.username || url.password || url.port || url.hash) return null;
    // Reject local addresses, IP literals and ambiguous hosts; allow public DNS names.
    if (!/^(?:[a-z0-9](?:[a-z0-9-]*[a-z0-9])?\.)+[a-z]{2,}$/i.test(url.hostname) || /\.(?:localhost|local|internal|test|invalid)$/i.test(url.hostname)) return null;
    if (!uploadExtension(kind as ExternalMediaKind, url.pathname)) return null;
    return url.href;
  } catch { return null; }
}
