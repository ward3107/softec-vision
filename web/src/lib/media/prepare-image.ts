import { sniffType } from '@/lib/inquiry/attachment';
import { fitImage, IMAGE_ERRORS, IMAGE_TYPES, MAX_IMAGE_PIXELS, MAX_ORIGINAL_IMAGE_BYTES, MAX_PREPARED_IMAGE_BYTES } from './image-policy';

/** Prepare locally before sending a server action; the server still decodes and validates. */
export async function prepareImage(file: File): Promise<File> {
  if (!file.size) throw new Error(IMAGE_ERRORS.noFile);
  if (file.size > MAX_ORIGINAL_IMAGE_BYTES) throw new Error(IMAGE_ERRORS.tooLarge);
  const mime = sniffType(new Uint8Array(await file.slice(0, 32).arrayBuffer()));
  if (!IMAGE_TYPES.some(type => type === mime)) throw new Error(IMAGE_ERRORS.badType);
  let bitmap: ImageBitmap;
  try {
    bitmap = await createImageBitmap(file, { imageOrientation: 'from-image' });
  } catch {
    throw new Error(IMAGE_ERRORS.badType);
  }
  try {
    if (bitmap.width * bitmap.height > MAX_IMAGE_PIXELS) throw new Error(IMAGE_ERRORS.dimensions);
    const size = fitImage(bitmap.width, bitmap.height);
    // Small originals go straight to the server, avoiding an extra lossy encode.
    if (file.size <= MAX_PREPARED_IMAGE_BYTES && size.width === bitmap.width && size.height === bitmap.height) return file;
    const canvas = document.createElement('canvas');
    const context = canvas.getContext('2d');
    if (!context) throw new Error(IMAGE_ERRORS.preparation);
    for (let attempt = 0; attempt < 6; attempt++) {
      canvas.width = Math.max(1, Math.round(size.width * 0.8 ** attempt));
      canvas.height = Math.max(1, Math.round(size.height * 0.8 ** attempt));
      context.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
      const blob = await new Promise<Blob | null>(resolve => canvas.toBlob(resolve, 'image/webp', 0.9));
      if (!blob || blob.type !== 'image/webp') throw new Error(IMAGE_ERRORS.preparation);
      if (blob.size <= MAX_PREPARED_IMAGE_BYTES) {
        return new File([blob], 'prepared-image.webp', { type: blob.type });
      }
    }
    throw new Error(IMAGE_ERRORS.preparation);
  } finally {
    bitmap.close();
  }
}
