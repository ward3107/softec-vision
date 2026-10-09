import { describe, expect, it, vi } from 'vitest';
import type { SupabaseClient } from '@supabase/supabase-js';
import { commitModelUpload } from './model-upload';
import { validGlb } from '@/lib/media/model-policy';

const uploadedPath = 'TEST/uploads/user/00000000-0000-4000-8000-000000000000.glb';
function glb(binaryLength = 0) {
  const json = JSON.stringify({ asset: { version: '2.0' }, buffers: binaryLength ? [{ byteLength: binaryLength }] : [] });
  const length = Math.ceil(json.length / 4) * 4;
  const bytes = new Uint8Array(20 + length + (binaryLength ? 8 + binaryLength : 0));
  const view = new DataView(bytes.buffer);
  view.setUint32(0, 0x46546c67, true); view.setUint32(4, 2, true); view.setUint32(8, bytes.length, true);
  view.setUint32(12, length, true); view.setUint32(16, 0x4e4f534a, true);
  bytes.set(new TextEncoder().encode(json.padEnd(length, ' ')), 20);
  if (binaryLength) { view.setUint32(20 + length, binaryLength, true); view.setUint32(24 + length, 0x004e4942, true); }
  return bytes;
}
function setup(bytes = glb(), oldPath: string | null = 'old.glb', failUpdate = false) {
  const update = vi.fn(() => ({ eq: async () => ({ error: failUpdate ? new Error('db unavailable') : null }) }));
  const remove = vi.fn(async (_paths: string[]) => ({ error: null }));
  const download = vi.fn(async (_path: string) => ({ data: new Blob([bytes]), error: null }));
  const query = { select: () => query, eq: () => query,
    maybeSingle: async () => ({ data: { id: 'product' }, error: null }),
    single: async () => ({ data: { model_3d_url: oldPath }, error: null }), update };
  const client = { from: () => query, storage: { from: () => ({ remove, download }) } } as unknown as SupabaseClient;
  return { client, update, remove, download };
}

describe('direct model upload', () => {
  it('validates a model larger than the Vercel request limit from storage', async () => {
    const bytes = glb(5 * 1024 * 1024);
    const { client, update, remove } = setup(bytes);
    expect(await commitModelUpload(client, 'TEST', 'user', uploadedPath)).toEqual({ ok: true });
    expect(update).toHaveBeenCalledWith({ model_3d_url: uploadedPath });
    expect(remove).toHaveBeenCalledWith(['old.glb']);
  });
  it('rejects forged paths before downloading or modifying anything', async () => {
    for (const path of [uploadedPath.replace('/user/', '/other/'), 'TEST/old.glb', uploadedPath.replace('00000000-', '../00000000-')]) {
      const { client, download, update, remove } = setup();
      expect(await commitModelUpload(client, 'TEST', 'user', path)).toEqual({ ok: false, error: 'badType' });
      expect(download).not.toHaveBeenCalled(); expect(update).not.toHaveBeenCalled(); expect(remove).not.toHaveBeenCalled();
    }
  });
  it('rejects truncated GLB files and keeps the existing model', async () => {
    const { client, update, remove } = setup(glb().slice(0, 8));
    expect(await commitModelUpload(client, 'TEST', 'user', uploadedPath)).toEqual({ ok: false, error: 'badType' });
    expect(update).not.toHaveBeenCalled();
    expect(remove).toHaveBeenCalledWith([uploadedPath]);
  });
  it('retains both files on a failed database write so a retry remains possible', async () => {
    const { client, remove } = setup(glb(), 'old.glb', true);
    await expect(commitModelUpload(client, 'TEST', 'user', uploadedPath)).rejects.toThrow();
    expect(remove).not.toHaveBeenCalled();
  });
  it('treats a repeat finalization as success without deleting the current model', async () => {
    const { client, remove, download } = setup(glb(), uploadedPath);
    expect(await commitModelUpload(client, 'TEST', 'user', uploadedPath)).toEqual({ ok: true });
    expect(remove).not.toHaveBeenCalled(); expect(download).not.toHaveBeenCalled();
  });
  it('rejects GLB headers with incorrect length or non-JSON first chunks', () => {
    const bytes = glb();
    expect(validGlb(bytes)).toBe(true);
    const view = new DataView(bytes.buffer);
    view.setUint32(8, 10, true);
    expect(validGlb(bytes)).toBe(false);
    view.setUint32(8, bytes.length, true); view.setUint32(16, 0, true);
    expect(validGlb(bytes)).toBe(false);
  });
});
