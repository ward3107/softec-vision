-- Products keep their existing root and point subcategory_id at the deepest
-- assigned category. Existing product rows and public URLs need no migration.
create or replace function public.save_subcategory(
  p_id uuid, p_parent uuid, p_slug text, p_he text, p_en text,
  p_status publish_status, p_sort integer
) returns void language plpgsql security invoker set search_path = public as $$
declare
  target uuid;
  parent_parent uuid;
  languages text[] := array['he','en'];
begin
  if not is_staff() then raise exception 'staff required' using errcode='42501'; end if;
  if p_slug is null or p_slug = 'all' or p_slug !~ '^[a-z0-9]+(-[a-z0-9]+)*$' or length(p_slug)>80
     or coalesce(length(trim(p_he)),0) not between 1 and 120
     or coalesce(length(trim(p_en)),0) not between 1 and 120
     or p_sort is null or p_sort not between 0 and 10000 then raise exception 'invalid category fields'; end if;
  if p_parent is not null then
    select parent_id, visible_in into parent_parent, languages from categories where id=p_parent for key share;
    if not found or (parent_parent is not null and not exists (
      select 1 from categories where id=parent_parent and parent_id is null
    )) then raise exception 'invalid parent'; end if;
  end if;
  if p_id is null then
    insert into categories (slug,parent_id,status,sort,visible_in)
      values (p_slug,p_parent,p_status,p_sort,languages) returning id into target;
  else
    update categories set status=p_status, sort=p_sort, updated_at=now()
      where id=p_id and slug=p_slug and parent_id is not distinct from p_parent returning id into target;
    if not found then raise exception 'unknown category'; end if;
  end if;
  insert into category_translations(category_id,locale,name,description)
    values (target,'he',trim(p_he),''),(target,'en',trim(p_en),'')
    on conflict (category_id,locale) do update set name=excluded.name;
end $$;

create or replace function public.delete_subcategory(p_id uuid) returns void
language plpgsql security invoker set search_path=public as $$
declare parent uuid;
begin
  if not is_staff() then raise exception 'staff required' using errcode='42501'; end if;
  select parent_id into parent from categories where id=p_id for update;
  if parent is null then raise exception 'unknown subcategory'; end if;
  if exists (select 1 from categories where parent_id=p_id) then raise exception 'category has children'; end if;
  update products set subcategory_id=case when category_id=parent then null else parent end, updated_at=now()
    where subcategory_id=p_id;
  delete from categories where id=p_id;
end $$;

create function public.save_product_in_leaf(
  p_code text, p_status publish_status, p_translations jsonb, p_specs jsonb,
  p_category text, p_subcategory text, p_leaf text
) returns void language plpgsql security invoker set search_path=public as $$
declare leaf_id uuid;
begin
  if not is_staff() then raise exception 'staff required' using errcode='42501'; end if;
  select leaf.id into leaf_id from categories leaf
    join categories sub on sub.id=leaf.parent_id
    join categories family on family.id=sub.parent_id
    where leaf.slug=p_leaf and sub.slug=p_subcategory and family.slug=p_category and family.parent_id is null
    for key share of leaf, sub, family;
  if not found then raise exception 'invalid category path'; end if;
  perform save_product_details(p_code,p_status,p_translations,p_specs,p_category,p_subcategory);
  update products set subcategory_id=leaf_id where code=p_code;
end $$;
revoke all on function public.save_product_in_leaf(text,publish_status,jsonb,jsonb,text,text,text) from public,anon;
grant execute on function public.save_product_in_leaf(text,publish_status,jsonb,jsonb,text,text,text) to authenticated;
