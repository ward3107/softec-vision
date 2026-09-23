-- Stage 3b: the product catalog is managed from the owner admin.
--  * Visitors read product text, specs and media only for published products
--    (0001 exposed the translations of drafts too).
--  * catalog_is_managed() tells the website whether the catalog has been
--    imported yet (anon cannot count draft rows itself).
--  * import_catalog() loads the built-in catalog once (admin only, idempotent).
--  * save_product() updates one product atomically (any staff member).
-- Both write functions run as the caller, so Row Level Security still applies.

-- ── Published-only reads for product children ────────────────────────────────
create or replace function public.product_is_published(p_id uuid) returns boolean
  language sql stable security definer set search_path = public as $$
    select exists (select 1 from products where id = p_id and status = 'published');
$$;

drop policy if exists "public reads product translations" on product_translations;
create policy "public reads published product translations" on product_translations
  for select using (public.product_is_published(product_id));

drop policy if exists "public reads product specs" on product_specs;
create policy "public reads published product specs" on product_specs
  for select using (public.product_is_published(product_id));

drop policy if exists "public reads product media" on product_media;
create policy "public reads published product media" on product_media
  for select using (public.product_is_published(product_id));

drop policy if exists "public reads product documents" on product_documents;
create policy "public reads published product documents" on product_documents
  for select using (public.product_is_published(product_id));

drop policy if exists "public reads related" on related_products;
create policy "public reads published related" on related_products
  for select using (public.product_is_published(product_id) and public.product_is_published(related_id));

-- ── Has the catalog been imported? ───────────────────────────────────────────
create or replace function public.catalog_is_managed() returns boolean
  language sql stable security definer set search_path = public as $$
    select exists (select 1 from products);
$$;
grant execute on function public.catalog_is_managed() to anon, authenticated;

-- ── One-time import of the built-in catalog (admin only) ─────────────────────
-- payload: { locales: [{code,name,dir,is_default,sort}],
--            categories: [{slug,parent,sort,visible_in,translations:{he:{name,description},en:{..}}}],
--            specFields: [{key,sort,labels:{he,en}}],
--            products: [{code,cat,sub,sort,translations:{he:{name,description,alt_text},en:{..}},
--                        specs:[{key,value:{he,en}}]}] }
-- Existing rows are never overwritten, so the owner's edits survive a re-run.
-- Returns the number of products added.
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

-- ── Save one product (any staff member) ──────────────────────────────────────
-- p_translations: {he:{name,description,alt_text}, en:{...}}
-- p_specs: [{key, value:{he,en}}] — the complete set; anything missing is removed.
create or replace function public.save_product(
  p_code text,
  p_status publish_status,
  p_translations jsonb,
  p_specs jsonb
) returns void
  language plpgsql security invoker set search_path = public as $$
declare
  pid uuid;
begin
  if not public.is_staff() then
    raise exception 'only staff may edit products' using errcode = '42501';
  end if;
  select id into pid from products where code = p_code;
  if pid is null then
    raise exception 'unknown product %', p_code using errcode = 'P0002';
  end if;

  update products set status = p_status, updated_at = now() where id = pid;

  insert into product_translations (product_id, locale, name, description, alt_text)
  select pid, t.key, t.value->>'name', coalesce(t.value->>'description', ''), coalesce(t.value->>'alt_text', '')
  from jsonb_each(coalesce(p_translations, '{}')) t
  on conflict (product_id, locale) do update
    set name = excluded.name, description = excluded.description, alt_text = excluded.alt_text;

  delete from product_specs where product_id = pid;
  insert into product_specs (product_id, spec_field_id, value_translations, sort)
  select pid, sf.id, s->'value', sf.sort
  from jsonb_array_elements(coalesce(p_specs, '[]')) s
  join spec_fields sf on sf.key = s->>'key';
end $$;

revoke execute on function public.import_catalog(jsonb) from public, anon;
revoke execute on function public.save_product(text, publish_status, jsonb, jsonb) from public, anon;
grant execute on function public.import_catalog(jsonb) to authenticated;
grant execute on function public.save_product(text, publish_status, jsonb, jsonb) to authenticated;
