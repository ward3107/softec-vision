import 'server-only';
import sharp from 'sharp';
import { sniffType } from '@/lib/inquiry/attachment';
import { IMAGE_TYPES, MAX_IMAGE_DIMENSION, MAX_IMAGE_PIXELS, MAX_PREPARED_IMAGE_BYTES } from './image-policy';

type ImageError = 'noFile' | 'tooLarge' | 'badType';
export type OptimizedImage = { ok: true; bytes: Uint8Array; ext: 'webp'; mime: 'image/webp'; width: number; height: number };

/** Decode real pixels, normalize EXIF orientation, preserve alpha and strip metadata. */
export async function optimizeImage(file: File): Promise<OptimizedImage | { ok: false; error: ImageError }> {
  if (!file?.size) return { ok: false, error: 'noFile' };
  if (file.size > MAX_PREPARED_IMAGE_BYTES) return { ok: false, error: 'tooLarge' };
  try {
    const input = Buffer.from(await file.arrayBuffer());
    if (!IMAGE_TYPES.some(type => type === sniffType(input))) return { ok: false, error: 'badType' };
    const source = sharp(input, { limitInputPixels: MAX_IMAGE_PIXELS, failOn: 'warning' });
    const metadata = await source.metadata();
    if (!['jpeg', 'png', 'webp'].includes(metadata.format ?? '') || (metadata.pages ?? 1) > 1) {
      return { ok: false, error: 'badType' };
    }
    for (let attempt = 0; attempt < 6; attempt++) {
      const dimension = Math.round(MAX_IMAGE_DIMENSION * 0.8 ** attempt);
      const { data, info } = await source.clone().rotate()
        .resize(dimension, dimension, { fit: 'inside', withoutEnlargement: true })
        .toColourspace('srgb').webp({ quality: 82, alphaQuality: 100, effort: 4 })
        .toBuffer({ resolveWithObject: true });
      if (data.length <= MAX_PREPARED_IMAGE_BYTES) {
        return { ok: true, bytes: data, ext: 'webp', mime: 'image/webp', width: info.width, height: info.height };
      }
    }
    return { ok: false, error: 'tooLarge' };
  } catch {
    return { ok: false, error: 'badType' };
  }
}
