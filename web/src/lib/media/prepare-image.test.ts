import { afterEach, describe, expect, it, vi } from 'vitest';
import { prepareImage } from './prepare-image';
import { fitImage, MAX_PREPARED_IMAGE_BYTES } from './image-policy';

afterEach(() => vi.unstubAllGlobals());
function jpeg(size: number) {
  const bytes = new Uint8Array(size);
  bytes.set([255, 216, 255, 224]);
  return new File([bytes], 'camera.jpg', { type: 'image/jpeg' });
}

describe('browser image preparation boundary', () => {
  it('prepares an original larger than the server body limit and releases decoded pixels', async () => {
    const close = vi.fn();
    vi.stubGlobal('createImageBitmap', vi.fn().mockResolvedValue({ width: 4000, height: 3000, close }));
    const drawImage = vi.fn();
    const canvas = { width: 0, height: 0, getContext: () => ({ drawImage }),
      toBlob: (done: (blob: Blob) => void) => done(new Blob([new Uint8Array(500_000)], { type: 'image/webp' })) };
    vi.stubGlobal('document', { createElement: () => canvas });
    const prepared = await prepareImage(jpeg(5 * 1024 * 1024));
    expect(prepared.type).toBe('image/webp');
    expect(prepared.size).toBeLessThanOrEqual(MAX_PREPARED_IMAGE_BYTES);
    expect(canvas.width).toBe(2560); expect(canvas.height).toBe(1920);
    expect(close).toHaveBeenCalledOnce();
  });
  it('rejects oversized originals before decoding', async () => {
    const decode = vi.fn(); vi.stubGlobal('createImageBitmap', decode);
    await expect(prepareImage(jpeg(7 * 1024 * 1024))).rejects.toThrow('6MB');
    expect(decode).not.toHaveBeenCalled();
  });
  it('keeps small originals for one server encode and rejects undecodable content', async () => {
    vi.stubGlobal('createImageBitmap', vi.fn().mockResolvedValue({ width: 100, height: 80, close: vi.fn() }));
    const file = jpeg(100);
    expect(await prepareImage(file)).toBe(file);
    vi.stubGlobal('createImageBitmap', vi.fn().mockRejectedValue(new Error('decode')));
    await expect(prepareImage(file)).rejects.toThrow('תקינה');
  });
  it('never enlarges an image and preserves portrait proportions', () => {
    expect(fitImage(80, 120)).toEqual({ width: 80, height: 120 });
    expect(fitImage(3000, 4000)).toEqual({ width: 1920, height: 2560 });
  });
});
