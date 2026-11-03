alter type public.media_kind add value if not exists 'video';
insert into storage.buckets (id,name,public,file_size_limit,allowed_mime_types)
values ('product-videos','product-videos',true,52428800,array['video/mp4','video/webm'])
on conflict (id) do update set file_size_limit=excluded.file_size_limit,allowed_mime_types=excluded.allowed_mime_types;
create policy "staff manage product video files" on storage.objects for all to authenticated
using (bucket_id='product-videos' and public.is_staff())
with check (bucket_id='product-videos' and public.is_staff());

-- Serialize uploads on the product row to avoid concurrent primary-image replacements.
create or replace function public.attach_product_media(p_code text,p_kind text,p_path text)
returns text[] language plpgsql security invoker set search_path=public as $$
declare pid uuid; old_paths text[]; old_model text; next_sort integer;
begin
  if not public.is_staff() then raise exception 'staff required' using errcode='42501'; end if;
  if p_kind not in ('image','gallery','video','model') or p_path not like regexp_replace(p_code,'[^A-Za-z0-9_-]','','g') || '/' || p_kind || '-%' then
    raise exception 'invalid media path';
  end if;
  select id,model_3d_url into pid,old_model from products where code=p_code for update;
  if pid is null then raise exception 'unknown product'; end if;
  if p_kind='model' then
    update products set model_3d_url=p_path,updated_at=now() where id=pid;
    return case when old_model is null or old_model=p_path then '{}'::text[] else array[old_model] end;
  end if;
  -- Retrying finalization of an already attached upload is harmless.
  if exists (select 1 from product_media where product_id=pid and storage_path=p_path) then return '{}'::text[]; end if;
  old_paths := '{}'::text[];
  if p_kind='image' then
    select coalesce(array_agg(storage_path),'{}'::text[]) into old_paths from product_media where product_id=pid and kind::text='image';
    delete from product_media where product_id=pid and kind::text='image';
  end if;
  select coalesce(max(sort),-1)+1 into next_sort from product_media where product_id=pid and kind::text=p_kind;
  insert into product_media (product_id,storage_path,kind,sort) values (pid,p_path,p_kind::media_kind,next_sort);
  return old_paths;
end $$;
revoke all on function public.attach_product_media(text,text,text) from public,anon;
grant execute on function public.attach_product_media(text,text,text) to authenticated;
