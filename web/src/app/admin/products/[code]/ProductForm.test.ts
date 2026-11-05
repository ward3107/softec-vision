// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { act, createElement } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import ProductForm from './ProductForm';
import { AdminLanguage } from '../../AdminLanguage';
import type { CategoryRow } from '@/lib/catalog/categories';
import type { SaveProductState } from '../../actions';

vi.mock('../../language-actions', () => ({setAdminLanguage: vi.fn()}));
const categories: CategoryRow[]=[
  {id:'a',slug:'podium',parent_id:null,status:'published',sort:0,visible_in:['he','en'],category_translations:[{locale:'he',name:'פודיום',description:''},{locale:'en',name:'Podium',description:''}]},
  {id:'b',slug:'control',parent_id:null,status:'published',sort:1,visible_in:['he','en'],category_translations:[{locale:'he',name:'בקרה',description:''},{locale:'en',name:'Control',description:''}]},
  {id:'c',slug:'smart',parent_id:'a',status:'published',sort:0,visible_in:['he','en'],category_translations:[{locale:'he',name:'חכם',description:''},{locale:'en',name:'Smart',description:''}]}
];
const product={code:'TEST',status:'draft' as const,cat:'podium',sub:'smart',specs:{},translations:{he:{name:'שם',description:'תיאור',alt_text:''},en:{name:'Name',description:'Description',alt_text:''}}};
let container: HTMLDivElement;let root:Root;
beforeEach(()=>{Object.assign(globalThis,{IS_REACT_ACT_ENVIRONMENT:true});container=document.createElement('div');document.body.append(container);root=createRoot(container);});
afterEach(async()=>{await act(async()=>root.unmount());container.remove();});
async function mount(locale:'he'|'en', action:(_s:SaveProductState,fd:FormData)=>Promise<SaveProductState>=async()=>({}),creating=false){
 await act(async()=>root.render(createElement(AdminLanguage,{locale},createElement(ProductForm,{product,categories,specFields:[],action,creating}))));
}
const select=(name:string)=>container.querySelector<HTMLSelectElement>(`select[name="${name}"]`)!;
describe('bilingual product form UI',()=>{
 it.each(['he','en'] as const)('renders %s labels while keeping translation inputs in their own direction',async locale=>{
   await mount(locale);
   expect(container.textContent).toContain(locale==='he'?'קטגוריה ראשית':'Main category');
   expect(container.textContent).toContain(locale==='he'?'שם ותיאור':'Name and description');
   expect(container.querySelector<HTMLInputElement>('[name="name.he"]')?.dir).toBe('rtl');
   expect(container.querySelector<HTMLInputElement>('[name="name.en"]')?.dir).toBe('ltr');
   expect(select('category').selectedOptions[0].textContent).toBe(locale==='he'?'פודיום':'Podium');
 });
 it('clears a subcategory when its parent changes',async()=>{
   await mount('en');expect(select('subcategory').value).toBe('smart');
   await act(async()=>{select('category').value='control';select('category').dispatchEvent(new Event('change',{bubbles:true}));});
   expect(select('subcategory').value).toBe('');expect([...select('subcategory').options].some(x=>x.value==='smart')).toBe(false);
 });
 it('preserves bilingual text and subcategory after a rejected save',async()=>{
   const action=vi.fn(async(_s:SaveProductState,fd:FormData)=>({error:'Save failed',values:Object.fromEntries([...fd].map(([k,v])=>[k,String(v)]))}));
   await mount('en',action);
   expect(new FormData(container.querySelector('form')!).get('subcategory')).toBe('smart');
   container.querySelector<HTMLInputElement>('[name="name.en"]')!.value='Edited English';
   container.querySelector<HTMLInputElement>('[name="name.he"]')!.value='שם מעודכן';
   await act(async()=>{container.querySelector('form')!.dispatchEvent(new Event('submit',{bubbles:true,cancelable:true}));});
   expect(action).toHaveBeenCalledOnce();
   expect(action.mock.calls[0][1].get('subcategory')).toBe('smart');
   expect(container.querySelector<HTMLInputElement>('[name="name.en"]')?.value).toBe('Edited English');
   expect(container.querySelector<HTMLInputElement>('[name="name.he"]')?.value).toBe('שם מעודכן');
   expect(select('subcategory').value).toBe('smart');
   expect(container.textContent).toContain('Save failed');
 });
 it('offers only draft creation and a stable code field for new products',async()=>{
   await mount('en',undefined,true);
   expect(container.querySelector('select[name="status"]')).toBeNull();
   expect(container.querySelector<HTMLInputElement>('input[name="status"]')?.value).toBe('draft');
   expect(container.querySelector('input[name="code"]')).not.toBeNull();
   expect(container.textContent).toContain('Create draft and add media');
 });
});
