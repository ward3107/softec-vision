-- Existing products keep built-in images. New products require an uploaded/linked image.
alter table public.products add column requires_primary_media boolean not null default false;
alter table public.products alter column requires_primary_media set default true;

create or replace function public.product_is_published(p_id uuid) returns boolean
language sql stable security definer set search_path=public as $$
  select exists (select 1 from products p join categories c on c.id=p.category_id and c.status='published'
    where p.id=p_id and p.status='published'
    and (p.subcategory_id is null or exists(select 1 from categories s where s.id=p.subcategory_id and s.parent_id=c.id and s.status='published'))
    and (select count(*) from product_translations t where t.product_id=p.id and t.locale in ('he','en')
      and length(trim(t.name)) between 1 and 120 and length(trim(t.description)) between 1 and 2000
      and t.name not like '%[למילוי]%' and t.name not like '%[To be completed]%'
      and t.description not like '%[למילוי]%' and t.description not like '%[To be completed]%')=2
    and (not p.requires_primary_media or exists(select 1 from product_media m where m.product_id=p.id and m.kind='image' and length(trim(m.storage_path))>0)));
$$;
drop policy "public reads published products" on public.products;
create policy "public reads published products" on public.products for select using(public.product_is_published(id));

-- Deferred checks evaluate the complete transaction, including translations and media.
create function public.check_product_publication() returns trigger
language plpgsql security invoker set search_path=public as $$
declare pid uuid;
begin
  if tg_table_name='products' then pid:=new.id;
  elsif tg_op='DELETE' then pid:=old.product_id; else pid:=new.product_id; end if;
  if exists(select 1 from products where id=pid and status='published') and not product_is_published(pid) then
    raise exception 'product_not_ready' using errcode='23514';
  end if;
  return null;
end $$;
create constraint trigger product_publication_check after insert or update on public.products deferrable initially deferred for each row execute function public.check_product_publication();
create constraint trigger translation_publication_check after insert or update or delete on public.product_translations deferrable initially deferred for each row execute function public.check_product_publication();
create constraint trigger media_publication_check after insert or update or delete on public.product_media deferrable initially deferred for each row execute function public.check_product_publication();
revoke all on function public.check_product_publication() from public,anon,authenticated;

create function public.create_catalog_product(p_code text,p_category text,p_subcategory text,p_translations jsonb,p_specs jsonb)
returns void language plpgsql security invoker set search_path=public as $$
declare cat_id uuid; sub_id uuid;
begin
  if not public.is_staff() then raise exception 'staff required' using errcode='42501'; end if;
  if p_code is null or p_code !~ '^[A-Za-z0-9][A-Za-z0-9_-]{0,63}$' or lower(p_code)='new' then raise exception 'invalid code'; end if;
  select id into cat_id from categories where slug=p_category and parent_id is null;
  if cat_id is null then raise exception 'invalid category'; end if;
  if nullif(p_subcategory,'') is not null then
    select id into sub_id from categories where slug=p_subcategory and parent_id=cat_id;
    if sub_id is null then raise exception 'invalid subcategory'; end if;
  end if;
  insert into products(code,category_id,subcategory_id,status) values(p_code,cat_id,sub_id,'draft');
  perform save_product(p_code,'draft',p_translations,p_specs);
end $$;
revoke all on function public.create_catalog_product(text,text,text,jsonb,jsonb) from public,anon;
grant execute on function public.create_catalog_product(text,text,text,jsonb,jsonb) to authenticated;

-- storage_path is either an owned bucket path or a validated direct HTTPS URL.
create function public.attach_product_external_media(p_code text,p_kind text,p_url text)
returns void language plpgsql security invoker set search_path=public as $$
declare pid uuid; next_sort integer;
begin
  if not public.is_staff() then raise exception 'staff required' using errcode='42501'; end if;
  if p_kind is null or p_kind not in ('image','gallery','video') or p_url is null or length(p_url)>2048
    or p_url !~ '^https://([a-zA-Z0-9]([a-zA-Z0-9-]*[a-zA-Z0-9])?\.)+[a-zA-Z]{2,}/[^\s#]*$'
    or p_url ~* '^https://[^/]*\.(localhost|local|internal|test|invalid)/'
    or (p_kind='video' and split_part(p_url,'?',1) !~* '\.(mp4|webm)$')
    or (p_kind in ('image','gallery') and split_part(p_url,'?',1) !~* '\.(jpg|jpeg|png|webp)$') then raise exception 'invalid media url'; end if;
  select id into pid from products where code=p_code for update;
  if pid is null then raise exception 'unknown product'; end if;
  if exists(select 1 from product_media where product_id=pid and kind::text=p_kind and storage_path=p_url) then return; end if;
  if p_kind='image' then delete from product_media where product_id=pid and kind='image'; end if;
  select coalesce(max(sort),-1)+1 into next_sort from product_media where product_id=pid and kind::text=p_kind;
  insert into product_media(product_id,kind,storage_path,sort) values(pid,p_kind::media_kind,p_url,next_sort);
end $$;
revoke all on function public.attach_product_external_media(text,text,text) from public,anon;
grant execute on function public.attach_product_external_media(text,text,text) to authenticated;

-- Retention manifest only: no cleanup job, storage deletion or external URL deletion.
create table public.retained_product_files (
  id uuid primary key default gen_random_uuid(),product_code text not null,bucket_id text not null,
  storage_path text not null,reason text not null,retained_at timestamptz not null default now(),unique(bucket_id,storage_path)
);
alter table public.retained_product_files enable row level security;
create policy "staff record retained files" on public.retained_product_files for insert to authenticated with check(public.is_staff());
create policy "staff read retained files" on public.retained_product_files for select to authenticated using(public.is_staff());
grant select,insert on public.retained_product_files to authenticated;
revoke all on public.retained_product_files from anon;
create function public.retain_product_file_references() returns trigger
language plpgsql security invoker set search_path=public as $$
declare product_code text;
begin
  if tg_table_name='products' then
    if tg_op='DELETE' then
      insert into retained_product_files(product_code,bucket_id,storage_path,reason)
        select old.code,case when kind::text='video' then 'product-videos' else 'product-media' end,storage_path,'product deleted'
        from product_media where product_id=old.id and storage_path !~* '^https?://' on conflict do nothing;
    end if;
    if old.model_3d_url is not null and (tg_op='DELETE' or new.model_3d_url is distinct from old.model_3d_url) and old.model_3d_url !~* '^https?://' then
      insert into retained_product_files(product_code,bucket_id,storage_path,reason)
        values(old.code,'product-models',old.model_3d_url,'model detached') on conflict do nothing;
    end if;
  elsif old.storage_path !~* '^https?://' then
    select code into product_code from products where id=old.product_id;
    if product_code is not null then
      insert into retained_product_files(product_code,bucket_id,storage_path,reason)
        values(product_code,case when old.kind::text='video' then 'product-videos' else 'product-media' end,old.storage_path,'media detached') on conflict do nothing;
    end if;
  end if;
  if tg_op='DELETE' then return old; else return new; end if;
end $$;
create trigger retain_product_files before delete or update of model_3d_url on public.products for each row execute function public.retain_product_file_references();
create trigger retain_media_files before delete or update of storage_path on public.product_media for each row execute function public.retain_product_file_references();
revoke all on function public.retain_product_file_references() from public,anon,authenticated;

-- Built-in import retains built-in image eligibility.
create or replace function public.import_catalog(payload jsonb) returns integer
  language plpgsql security invoker set search_path = public as $$
declare
  item jsonb;
  pid uuid;
  added integer := 0;
begin
  if not public.is_admin() then
    raise exception 'only an admin may import the catalog' using errcode = '42501';
  end if;

  insert into locales (code, name, dir, is_default, sort)
  select l->>'code', l->>'name', l->>'dir', coalesce((l->>'is_default')::boolean, false), coalesce((l->>'sort')::int, 0)
  from jsonb_array_elements(coalesce(payload->'locales', '[]')) l
  on conflict (code) do nothing;

  -- Top-level categories first; subcategories reference their parent.
  insert into categories (slug, parent_id, sort, status, visible_in)
  select c->>'slug', null, coalesce((c->>'sort')::int, 0), 'published',
         array(select jsonb_array_elements_text(coalesce(c->'visible_in', '[]')))
  from jsonb_array_elements(coalesce(payload->'categories', '[]')) c
  where c->>'parent' is null
  on conflict (slug) do nothing;

  insert into categories (slug, parent_id, sort, status, visible_in)
  select c->>'slug', parent.id, coalesce((c->>'sort')::int, 0), 'published',
         array(select jsonb_array_elements_text(coalesce(c->'visible_in', '[]')))
  from jsonb_array_elements(coalesce(payload->'categories', '[]')) c
  join categories parent on parent.slug = c->>'parent'
  where c->>'parent' is not null
  on conflict (slug) do nothing;

  insert into category_translations (category_id, locale, name, description)
  select cat.id, t.key, t.value->>'name', coalesce(t.value->>'description', '')
  from jsonb_array_elements(coalesce(payload->'categories', '[]')) c
  join categories cat on cat.slug = c->>'slug'
  cross join lateral jsonb_each(coalesce(c->'translations', '{}')) t
  on conflict do nothing;

  insert into spec_fields (key, sort)
  select f->>'key', coalesce((f->>'sort')::int, 0)
  from jsonb_array_elements(coalesce(payload->'specFields', '[]')) f
  on conflict (key) do nothing;

  insert into spec_field_translations (spec_field_id, locale, label)
  select sf.id, t.key, t.value #>> '{}'
  from jsonb_array_elements(coalesce(payload->'specFields', '[]')) f
  join spec_fields sf on sf.key = f->>'key'
  cross join lateral jsonb_each(coalesce(f->'labels', '{}')) t
  on conflict do nothing;

  for item in select value from jsonb_array_elements(coalesce(payload->'products', '[]')) loop
    continue when exists (select 1 from deleted_product_codes where code=item->>'code');
    pid := null;
    insert into products (code, category_id, subcategory_id, status, requires_primary_media, sort)
    values (
      item->>'code',
      (select id from categories where slug = item->>'cat'),
      (select id from categories where slug = item->>'sub'),
      'published',
      false,
      coalesce((item->>'sort')::int, 0)
    )
    on conflict (code) do nothing
    returning id into pid;

    continue when pid is null; -- already in the catalog: keep the owner's version

    added := added + 1;
    insert into product_translations (product_id, locale, name, description, alt_text)
    select pid, t.key, t.value->>'name', coalesce(t.value->>'description', ''), coalesce(t.value->>'alt_text', '')
    from jsonb_each(coalesce(item->'translations', '{}')) t;

    insert into product_specs (product_id, spec_field_id, value_translations, sort)
    select pid, sf.id, s->'value', sf.sort
    from jsonb_array_elements(coalesce(item->'specs', '[]')) s
    join spec_fields sf on sf.key = s->>'key';
  end loop;

  return added;
end $$;
