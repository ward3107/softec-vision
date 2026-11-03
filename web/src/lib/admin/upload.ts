export const UPLOAD_KINDS = ['image', 'gallery', 'model', 'video'] as const;
export type UploadKind = (typeof UPLOAD_KINDS)[number];
export const UPLOAD_CONFIG = {
  image: { bucket: 'product-media', max: 6 * 1024 * 1024, accept: 'image/jpeg,image/png,image/webp' },
  gallery: { bucket: 'product-media', max: 6 * 1024 * 1024, accept: 'image/jpeg,image/png,image/webp' },
  model: { bucket: 'product-models', max: 20 * 1024 * 1024, accept: '.glb' },
  video: { bucket: 'product-videos', max: 50 * 1024 * 1024, accept: 'video/mp4,video/webm' }
} as const;

export function uploadExtension(kind: UploadKind, name: string): string | undefined {
  const ext = name.split('.').pop()?.toLowerCase();
  const allowed = kind === 'model' ? ['glb'] : kind === 'video' ? ['mp4', 'webm'] : ['jpg', 'jpeg', 'png', 'webp'];
  return ext && allowed.includes(ext) ? ext : undefined;
}

export function isVideo(bytes: Uint8Array, extension: string): boolean {
  if (extension === 'webm') return bytes[0] === 0x1a && bytes[1] === 0x45 && bytes[2] === 0xdf && bytes[3] === 0xa3;
  return extension === 'mp4' && bytes.length >= 12 && String.fromCharCode(...bytes.slice(4, 8)) === 'ftyp';
}

export function uploadMime(kind: UploadKind, name: string): string | undefined {
  const extension = uploadExtension(kind, name);
  if (!extension) return undefined;
  if (kind === 'model') return 'model/gltf-binary';
  if (kind === 'video') return extension === 'mp4' ? 'video/mp4' : 'video/webm';
  return extension === 'jpg' || extension === 'jpeg' ? 'image/jpeg' : `image/${extension}`;
}
