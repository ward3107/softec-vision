import { beforeEach, describe, expect, it, vi } from 'vitest';
import { BLOCK_KEYS, MAX_IMAGE_BYTES, parseEditorDocument } from '@/lib/content/editor';

const mocks = vi.hoisted(() => ({ requireStaff: vi.fn(), list: vi.fn(), updateTag: vi.fn(), revalidatePath: vi.fn() }));
vi.mock('@/lib/admin/session', () => ({ requireStaff: mocks.requireStaff }));
vi.mock('@/lib/admin/content', () => ({ listAdminContentBlocks: mocks.list }));
vi.mock('@/lib/content/source', () => ({ CONTENT_TAG: 'content' }));
vi.mock('next/cache', () => ({ updateTag: mocks.updateTag, revalidatePath: mocks.revalidatePath }));
import { publishContent } from './editor-actions';

const blank = () => parseEditorDocument(Object.fromEntries(BLOCK_KEYS.map(key => [key, { he: {}, en: {} }])));
function setup(fail = false) {
  const document = blank();
  const writes: Array<{ table: string; values: unknown }> = [];
  const storage = {
    upload: vi.fn(async () => ({ error: null })), remove: vi.fn(async () => ({ error: null })),
    getPublicUrl: (path: string) => ({ data: { publicUrl: `https://example.supabase.co/storage/v1/object/public/product-media/${path}` } })
  };
  const client = { from: (table: string) => ({ upsert: (values: unknown) => {
    writes.push({ table, values });
    return table === 'content_blocks' ? { select: async () => ({ data: BLOCK_KEYS.map(key => ({ key, id: key })), error: null }) } : Promise.resolve({ error: fail ? new Error('db') : null });
  } }), storage: { from: () => storage } };
  mocks.requireStaff.mockResolvedValue({ client });
  mocks.list.mockResolvedValue(BLOCK_KEYS.map(key => ({ key, values: structuredClone(document[key]) })));
  const fd = new FormData(); fd.set('baseline', JSON.stringify(document));
  document['home.hero'].he.title = 'New headline';
  fd.set('document', JSON.stringify(document));
  return { fd, writes, storage };
}
beforeEach(() => { vi.resetAllMocks(); });

describe('publish content server boundary', () => {
  it('requires staff before any reads or writes', async () => {
    const { fd, writes } = setup();
    mocks.requireStaff.mockRejectedValue(new Error('redirect to login'));
    await expect(publishContent(fd)).rejects.toThrow('redirect to login');
    expect(writes).toEqual([]); expect(mocks.list).not.toHaveBeenCalled();
  });
  it('publishes all locales in one statement and expires the content cache', async () => {
    const { fd, writes } = setup();
    expect(await publishContent(fd)).toMatchObject({ ok: true });
    expect(writes).toHaveLength(2);
    expect(writes[1].table).toBe('content_block_translations');
    expect(writes[1].values).toHaveLength(BLOCK_KEYS.length * 2);
    expect(mocks.updateTag).toHaveBeenCalledWith('content');
  });
  it('keeps drafts on database errors without reporting success', async () => {
    const { fd } = setup(true);
    expect(await publishContent(fd)).toMatchObject({ ok: false });
    expect(mocks.updateTag).not.toHaveBeenCalled();
  });
  it('rejects stale baselines without writes', async () => {
    const { fd, writes } = setup();
    const current = blank(); current['home.hero'].en.title = 'Changed elsewhere';
    mocks.list.mockResolvedValue(BLOCK_KEYS.map(key => ({ key, values: current[key] })));
    expect(await publishContent(fd)).toMatchObject({ ok: false }); expect(writes).toEqual([]);
  });
  it('rejects malformed payloads before querying content', async () => {
    const { fd, writes } = setup(); fd.set('document', '{}');
    expect(await publishContent(fd)).toMatchObject({ ok: false });
    expect(writes).toEqual([]); expect(mocks.list).not.toHaveBeenCalled();
  });
  it('checks image bytes instead of trusting the MIME label', async () => {
    const { fd, storage, writes } = setup();
    fd.set('image.he', new File(['<svg/>'], 'photo.png', { type: 'image/png' }));
    expect(await publishContent(fd)).toMatchObject({ ok: false });
    expect(storage.upload).not.toHaveBeenCalled(); expect(writes).toEqual([]);
  });
  it('rejects oversized combined uploads before uploading either file', async () => {
    const { fd, storage, writes } = setup();
    const bytes = new Uint8Array(MAX_IMAGE_BYTES / 2 + 1);
    bytes.set([0xff, 0xd8, 0xff, 0xe0]);
    for (const locale of ['he', 'en']) fd.set(`image.${locale}`, new File([bytes], 'photo.jpg', { type: 'image/jpeg' }));
    expect(await publishContent(fd)).toMatchObject({ ok: false });
    expect(storage.upload).not.toHaveBeenCalled(); expect(writes).toEqual([]);
  });
  it('cleans newly uploaded files when publishing fails', async () => {
    const { fd, storage } = setup(true);
    fd.set('image.he', new File([new Uint8Array([0xff, 0xd8, 0xff, 0xe0, 0, 0, 0, 0, 0, 0, 0, 0])], 'photo.jpg', { type: 'image/jpeg' }));
    expect(await publishContent(fd)).toMatchObject({ ok: false });
    expect(storage.upload).toHaveBeenCalledOnce(); expect(storage.remove).toHaveBeenCalledOnce();
  });
});
