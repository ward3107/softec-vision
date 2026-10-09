export const MODEL_BUCKET = 'product-models';
export const MAX_MODEL_BYTES = 20 * 1024 * 1024;

/** Validate the GLB container, declared length, JSON chunk and glTF 2 asset. */
export function validGlb(bytes: Uint8Array): boolean {
  if (bytes.byteLength < 24) return false;
  const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
  if (view.getUint32(0, true) !== 0x46546c67 || view.getUint32(4, true) !== 2 || view.getUint32(8, true) !== bytes.byteLength) return false;
  let offset = 12;
  let chunks = 0;
  while (offset < bytes.byteLength) {
    if (offset + 8 > bytes.byteLength) return false;
    const length = view.getUint32(offset, true);
    const type = view.getUint32(offset + 4, true);
    if (!length || length % 4 || offset + 8 + length > bytes.byteLength) return false;
    if (chunks === 0) {
      if (type !== 0x4e4f534a) return false;
      try {
        const json = JSON.parse(new TextDecoder('utf-8', { fatal: true }).decode(bytes.subarray(offset + 8, offset + 8 + length)));
        if (json?.asset?.version !== '2.0') return false;
      } catch { return false; }
    }
    chunks++;
    offset += 8 + length;
  }
  return offset === bytes.byteLength && chunks > 0;
}
