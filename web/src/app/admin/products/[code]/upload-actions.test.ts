import { beforeEach, describe, expect, it, vi } from 'vitest';
const mocked = vi.hoisted(() => ({ download: vi.fn(), remove: vi.fn(), rpc: vi.fn(), requireStaff: vi.fn(), updateTag: vi.fn(), revalidatePath: vi.fn() }));
vi.mock('@/lib/admin/session', () => ({ requireStaff: mocked.requireStaff }));
vi.mock('next/cache', () => ({ updateTag: mocked.updateTag, revalidatePath: mocked.revalidatePath }));
import { finishUpload } from './upload-actions';

const path = 'RAV-500/video-00000000-0000-4000-8000-000000000001.mp4';
const mp4 = new Uint8Array([0,0,0,24,102,116,121,112,105,115,111,109]);
beforeEach(() => {
  vi.resetAllMocks();
  mocked.requireStaff.mockResolvedValue({ client: { storage: { from: () => ({ download: mocked.download, remove: mocked.remove }) }, rpc: mocked.rpc } });
  mocked.download.mockResolvedValue({ data: new Blob([mp4]), error: null });
  mocked.remove.mockResolvedValue({ error: null });
  mocked.rpc.mockResolvedValue({ data: [], error: null });
});

describe('direct product uploads', () => {
  it('validates uploaded video bytes and attaches the row before invalidating public caches', async () => {
    expect(await finishUpload('RAV-500', 'video', path)).toEqual({ saved: true });
    expect(mocked.rpc).toHaveBeenCalledWith('attach_product_media', { p_code: 'RAV-500', p_kind: 'video', p_path: path });
    expect(mocked.updateTag).toHaveBeenCalledWith('catalog');
  });
  it('rejects a different product path before accessing storage', async () => {
    expect(await finishUpload('V-18W', 'video', path)).toHaveProperty('error');
    expect(mocked.download).not.toHaveBeenCalled();
    expect(mocked.rpc).not.toHaveBeenCalled();
  });
  it('rejects renamed non-video files and removes only the invalid upload', async () => {
    mocked.download.mockResolvedValue({ data: new Blob(['not a video']), error: null });
    expect(await finishUpload('RAV-500', 'video', path)).toHaveProperty('error');
    expect(mocked.remove).toHaveBeenCalledWith([path]);
    expect(mocked.rpc).not.toHaveBeenCalled();
  });
  it('preserves an upload when the commit response fails, since the database may have committed', async () => {
    mocked.rpc.mockResolvedValue({ error: { message: 'connection interrupted' } });
    expect(await finishUpload('RAV-500', 'video', path)).toHaveProperty('error');
    expect(mocked.remove).not.toHaveBeenCalled();
  });
  it('keeps a successful update when old file cleanup fails', async () => {
    mocked.rpc.mockResolvedValue({ data: ['RAV-500/old.mp4'], error: null });
    mocked.remove.mockResolvedValue({ error: { message: 'storage unavailable' } });
    const log = vi.spyOn(console, 'error').mockImplementation(() => {});
    expect(await finishUpload('RAV-500', 'video', path)).toEqual({ saved: true });
    expect(mocked.updateTag).toHaveBeenCalled();
    log.mockRestore();
  });
});
