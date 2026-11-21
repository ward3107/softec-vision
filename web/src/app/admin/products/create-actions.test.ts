import { beforeEach, describe, expect, it, vi } from 'vitest';
const mocks = vi.hoisted(() => ({ requireStaff: vi.fn(), rpc: vi.fn(), redirect: vi.fn(), updateTag: vi.fn() }));
vi.mock('@/lib/admin/session', () => ({ requireStaff: mocks.requireStaff }));
vi.mock('@/lib/admin/locale', async () => { const { adminStrings }=await import('@/lib/admin/strings'); return { getAdminStrings: async () => adminStrings('en') }; });
vi.mock('next/cache', () => ({ updateTag: mocks.updateTag, revalidatePath: vi.fn() }));
vi.mock('next/navigation', () => ({ redirect: mocks.redirect }));
import { createProductAction } from '../actions';
function form() { const fd=new FormData(); fd.set('code','NEW-TEST'); fd.set('category','podium'); fd.set('status','published'); fd.set('name.en','Test product'); return fd; }
beforeEach(() => { vi.resetAllMocks(); mocks.requireStaff.mockResolvedValue({client:{rpc:mocks.rpc}}); mocks.rpc.mockResolvedValue({error:null}); mocks.redirect.mockImplementation(url=>{throw new Error(url);}); });
describe('product creation action', () => {
  it('forces draft creation and redirects to media editor', async () => {
    await expect(createProductAction({},form())).rejects.toThrow('/admin/products/NEW-TEST?created=1');
    expect(mocks.rpc).toHaveBeenCalledWith('create_catalog_product',expect.objectContaining({p_code:'NEW-TEST',p_category:'podium',p_translations:expect.objectContaining({en:{name:'Test product',description:'',alt_text:''}})}));
    expect(mocks.rpc.mock.calls[0][1]).not.toHaveProperty('p_status');
    expect(mocks.updateTag).toHaveBeenCalledWith('catalog');
  });
  it('preserves entered values after duplicate code errors', async () => {
    mocks.rpc.mockResolvedValue({error:{code:'23505'}});
    expect(await createProductAction({},form())).toMatchObject({error:expect.stringContaining('already exists'),values:{code:'NEW-TEST','name.en':'Test product',category:'podium'}});
    expect(mocks.redirect).not.toHaveBeenCalled();
  });
  it.each(['new','NEW','../escape','has space','x'.repeat(65)])('rejects unsafe or reserved code %s', async code=> {
    const fd=form(); fd.set('code',code); expect(await createProductAction({},fd)).toHaveProperty('errors.code'); expect(mocks.rpc).not.toHaveBeenCalled();
  });
  it('requires a category', async()=>{const fd=form(); fd.delete('category'); expect(await createProductAction({},fd)).toHaveProperty('errors.category'); expect(mocks.rpc).not.toHaveBeenCalled();});
  it('requires staff before writing anything',async()=>{mocks.requireStaff.mockRejectedValue(new Error('unauthorized')); await expect(createProductAction({},form())).rejects.toThrow('unauthorized'); expect(mocks.rpc).not.toHaveBeenCalled();});
});
