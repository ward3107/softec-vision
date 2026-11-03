-- Persistent catalog ownership prevents deleted products reappearing from seeds.
create table public.catalog_state (
  id boolean primary key default true check (id),
  managed boolean not null default true
);
insert into public.catalog_state (managed) select true where exists (select 1 from public.products);
alter table public.catalog_state enable row level security;
create policy "public reads catalog state" on public.catalog_state for select using (true);
create policy "admins manage catalog state" on public.catalog_state for all to authenticated
  using (public.is_admin()) with check (public.is_admin());
grant select on public.catalog_state to anon, authenticated;
grant insert, update on public.catalog_state to authenticated;

create table public.deleted_product_codes (
  code text primary key,
  deleted_at timestamptz not null default now()
);
alter table public.deleted_product_codes enable row level security;
create policy "admins manage deleted codes" on public.deleted_product_codes for all to authenticated
  using (public.is_admin()) with check (public.is_admin());
grant select, insert on public.deleted_product_codes to authenticated;

create or replace function public.catalog_is_managed() returns boolean
  language sql stable security definer set search_path = public as $$
    select exists (select 1 from catalog_state where managed) or exists (select 1 from products);
$$;

-- Preserve inquiries and their original model codes after a product is removed.
alter table public.inquiries drop constraint inquiries_product_id_fkey;
alter table public.inquiries add constraint inquiries_product_id_fkey
  foreign key (product_id) references public.products(id) on delete set null;

create or replace function public.delete_catalog_product(p_code text) returns void
language plpgsql security invoker set search_path = public as $$
begin
  if not public.is_admin() then raise exception 'admin required' using errcode='42501'; end if;
  insert into catalog_state (id, managed) values (true, true) on conflict (id) do update set managed=true;
  insert into deleted_product_codes (code) values (p_code) on conflict do nothing;
  update inquiries set product_code_snapshot=coalesce(product_code_snapshot,p_code)
    where product_id in (select id from products where code=p_code);
  delete from products where code=p_code;
end $$;
revoke all on function public.delete_catalog_product(text) from public, anon;
grant execute on function public.delete_catalog_product(text) to authenticated;

create or replace function public.save_subcategory(
  p_id uuid, p_parent uuid, p_slug text, p_he text, p_en text,
  p_status publish_status, p_sort integer
) returns void language plpgsql security invoker set search_path = public as $$
declare target uuid;
begin
  if not public.is_staff() then raise exception 'staff required' using errcode='42501'; end if;
  if not exists (select 1 from categories where id=p_parent and parent_id is null) then
    raise exception 'invalid parent';
  end if;
  if p_slug !~ '^[a-z0-9]+(-[a-z0-9]+)*$' or length(p_slug)>80
     or length(trim(p_he)) not between 1 and 120 or length(trim(p_en)) not between 1 and 120
     or p_sort not between 0 and 10000 then raise exception 'invalid category fields'; end if;
  if p_id is null then
    insert into categories (slug,parent_id,status,sort,visible_in)
      select p_slug,p_parent,p_status,p_sort,visible_in from categories where id=p_parent returning id into target;
  else
    if not exists (select 1 from categories where id=p_id and parent_id=p_parent) then
      raise exception 'unknown subcategory';
    end if;
    target := p_id;
    update categories set status=p_status,sort=p_sort,updated_at=now() where id=target;
  end if;
  insert into category_translations (category_id,locale,name,description)
    values (target,'he',trim(p_he),''),(target,'en',trim(p_en),'')
    on conflict (category_id,locale) do update set name=excluded.name;
end $$;

create or replace function public.delete_subcategory(p_id uuid) returns void
language plpgsql security invoker set search_path=public as $$
begin
  if not public.is_staff() then raise exception 'staff required' using errcode='42501'; end if;
  if not exists (select 1 from categories where id=p_id and parent_id is not null) then
    raise exception 'unknown subcategory';
  end if;
  update products set subcategory_id=null,updated_at=now() where subcategory_id=p_id;
  delete from categories where id=p_id;
end $$;

create or replace function public.save_product_details(
  p_code text, p_status publish_status, p_translations jsonb, p_specs jsonb,
  p_category text, p_subcategory text
) returns void language plpgsql security invoker set search_path=public as $$
declare cat_id uuid; sub_id uuid;
begin
  if not public.is_staff() then raise exception 'staff required' using errcode='42501'; end if;
  select id into cat_id from categories where slug=p_category and parent_id is null;
  if cat_id is null then raise exception 'invalid category'; end if;
  if nullif(p_subcategory,'') is not null then
    select id into sub_id from categories where slug=p_subcategory and parent_id=cat_id;
    if sub_id is null then raise exception 'invalid subcategory'; end if;
  end if;
  perform save_product(p_code,p_status,p_translations,p_specs);
  update products set category_id=cat_id,subcategory_id=sub_id where code=p_code;
end $$;
revoke all on function public.save_subcategory(uuid,uuid,text,text,text,publish_status,integer) from public,anon;
revoke all on function public.delete_subcategory(uuid) from public,anon;
revoke all on function public.save_product_details(text,publish_status,jsonb,jsonb,text,text) from public,anon;
grant execute on function public.save_subcategory(uuid,uuid,text,text,text,publish_status,integer) to authenticated;
grant execute on function public.delete_subcategory(uuid) to authenticated;
grant execute on function public.save_product_details(text,publish_status,jsonb,jsonb,text,text) to authenticated;

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
    insert into products (code, category_id, subcategory_id, status, sort)
    values (
      item->>'code',
      (select id from categories where slug = item->>'cat'),
      (select id from categories where slug = item->>'sub'),
      'published',
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
