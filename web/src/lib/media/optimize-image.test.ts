import { describe, expect, it } from 'vitest';
import sharp from 'sharp';
import { optimizeImage } from './optimize-image';
import { MAX_PREPARED_IMAGE_BYTES } from './image-policy';

const asFile = (bytes: Uint8Array) => new File([new Uint8Array(bytes)], 'photo.jpg', { type: 'image/jpeg' });

describe('uploaded image processing', () => {
  it('resizes a large photo with its aspect ratio and emits smaller WebP bytes', async () => {
    const original = await sharp({ create: { width: 4000, height: 3000, channels: 3, background: '#3678a1' } }).jpeg({ quality: 95 }).toBuffer();
    const result = await optimizeImage(asFile(original));
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result).toMatchObject({ width: 2560, height: 1920, ext: 'webp', mime: 'image/webp' });
    expect(result.bytes.length).toBeLessThan(original.length);
    expect((await sharp(result.bytes).metadata()).format).toBe('webp');
  });
  it('preserves transparent pixels and does not enlarge small images', async () => {
    const original = await sharp({ create: { width: 80, height: 60, channels: 4, background: { r: 50, g: 80, b: 100, alpha: 0 } } }).png().toBuffer();
    const result = await optimizeImage(asFile(original));
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result).toMatchObject({ width: 80, height: 60 });
    const decoded = await sharp(result.bytes).raw().toBuffer({ resolveWithObject: true });
    expect(decoded.info.channels).toBe(4);
    expect(decoded.data[3]).toBe(0);
  });
  it('applies phone EXIF rotation and strips EXIF metadata', async () => {
    const original = await sharp({ create: { width: 120, height: 80, channels: 3, background: '#aa6644' } })
      .jpeg().withMetadata({ orientation: 6 }).toBuffer();
    const result = await optimizeImage(asFile(original));
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result).toMatchObject({ width: 80, height: 120 });
    const metadata = await sharp(result.bytes).metadata();
    expect(metadata.orientation).toBeUndefined();
    expect(metadata.exif).toBeUndefined();
  });
  it('rejects forged MIME types and a JPEG signature without decodable pixels', async () => {
    for (const bytes of [new TextEncoder().encode('<svg/>'), new Uint8Array([255, 216, 255, 224, 0, 0])]) {
      expect(await optimizeImage(asFile(bytes))).toEqual({ ok: false, error: 'badType' });
    }
  });
  it('rejects an image with excessive decoded pixels even when the file is small', async () => {
    const original = await sharp({ create: { width: 6500, height: 6500, channels: 3, background: '#fff' } }).png().toBuffer();
    expect(original.length).toBeLessThan(MAX_PREPARED_IMAGE_BYTES);
    expect(await optimizeImage(asFile(original))).toEqual({ ok: false, error: 'badType' });
  });
  it('rejects empty and oversized prepared files before decoding', async () => {
    expect(await optimizeImage(asFile(new Uint8Array()))).toEqual({ ok: false, error: 'noFile' });
    expect(await optimizeImage(asFile(new Uint8Array(MAX_PREPARED_IMAGE_BYTES + 1)))).toEqual({ ok: false, error: 'tooLarge' });
  });
});
