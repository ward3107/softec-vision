-- Row Level Security checks for the Softec Vision schema.
-- Run by tests/run.sh against a throwaway PostgreSQL with the Supabase shim.
-- Any failed expectation raises an exception and stops the run.

-- ── Fixtures (as the database owner, which bypasses RLS) ─────────────────────
insert into locales (code, name, dir, is_default) values ('he', 'עברית', 'rtl', true), ('en', 'English', 'ltr', false)
  on conflict (code) do nothing;
insert into categories (id, slug, status) values ('00000000-0000-4000-8000-00000000c001', 'rls-test-cat', 'published');
insert into products (id, code, category_id, status) values
  ('00000000-0000-4000-8000-00000000f001', 'RLS-PUBLISHED', '00000000-0000-4000-8000-00000000c001', 'published'),
  ('00000000-0000-4000-8000-00000000f002', 'RLS-DRAFT', '00000000-0000-4000-8000-00000000c001', 'draft');
insert into auth.users (id, email) values
  ('00000000-0000-4000-8000-0000000000a1', 'staff@example.com'),
  ('00000000-0000-4000-8000-0000000000b2', 'visitor@example.com'),
  ('00000000-0000-4000-8000-0000000000c3', 'owner@example.com');
insert into profiles (id, role, full_name) values
  ('00000000-0000-4000-8000-0000000000a1', 'editor', 'Staff Member'),
  ('00000000-0000-4000-8000-0000000000c3', 'admin', 'Owner');
insert into storage.objects (bucket_id, name) values ('inquiry-attachments', 'seed/plan.pdf');

-- ── The server (service role) stores an inquiry with the Stage 2 fields ──────
begin;
set local role service_role;
insert into inquiries (id, name, email, phone, country, room_dimensions, message, locale, consent_at, consent_version, ip_hash)
values ('00000000-0000-4000-8000-00000000e001', 'Dana', 'dana@example.com', '+972 54 000 0000', 'Israel', '8 x 12 m',
        'Two stations', 'en', now(), '22 September 2026', repeat('a', 64));
insert into inquiry_attachments (inquiry_id, storage_path, filename, mime, size_bytes)
values ('00000000-0000-4000-8000-00000000e001', '00000000-0000-4000-8000-00000000e001/x.pdf', 'plan.pdf', 'application/pdf', 10);
commit;

-- ── Anonymous visitors ───────────────────────────────────────────────────────
begin;
set local role anon;
do $$
begin
  if (select count(*) from products where code like 'RLS-%') <> 1 then
    raise exception 'anon must see exactly the published product';
  end if;
  if exists (select 1 from products where code = 'RLS-DRAFT') then
    raise exception 'anon must not see draft products';
  end if;
  if (select count(*) from inquiries) <> 0 then raise exception 'anon must not read inquiries'; end if;
  if (select count(*) from inquiry_attachments) <> 0 then raise exception 'anon must not read attachment records'; end if;
  if (select count(*) from storage.objects where bucket_id = 'inquiry-attachments') <> 0 then
    raise exception 'anon must not read attachment files';
  end if;
  if (select count(*) from profiles) <> 0 then raise exception 'anon must not read profiles'; end if;

  begin
    insert into inquiries (name, message) values ('spam', 'direct insert');
    raise exception 'anon must not insert inquiries directly';
  exception when insufficient_privilege then null;
  end;
  begin
    insert into products (code, category_id) values ('HACK', '00000000-0000-4000-8000-00000000c001');
    raise exception 'anon must not create products';
  exception when insufficient_privilege then null;
  end;
  update products set featured = true where code = 'RLS-PUBLISHED';
  if (select featured from products where code = 'RLS-PUBLISHED') then
    raise exception 'anon must not modify products';
  end if;
end $$;
rollback;

-- ── Signed-in but not staff (e.g. a stray account) ───────────────────────────
begin;
set local role authenticated;
select set_config('request.jwt.claim.sub', '00000000-0000-4000-8000-0000000000b2', true) \g /dev/null
do $$
begin
  if (select count(*) from inquiries) <> 0 then raise exception 'non-staff must not read inquiries'; end if;
  if (select count(*) from storage.objects where bucket_id = 'inquiry-attachments') <> 0 then
    raise exception 'non-staff must not read attachment files';
  end if;
  update inquiries set status = 'handled';
  begin
    insert into profiles (id, role) values ('00000000-0000-4000-8000-0000000000b2', 'admin');
    raise exception 'non-staff must not grant themselves a role';
  exception when insufficient_privilege then null;
  end;
end $$;
rollback;
do $$ begin
  if (select status from inquiries where id = '00000000-0000-4000-8000-00000000e001') <> 'new' then
    raise exception 'non-staff update must have no effect';
  end if;
end $$;

-- ── Staff ────────────────────────────────────────────────────────────────────
begin;
set local role authenticated;
select set_config('request.jwt.claim.sub', '00000000-0000-4000-8000-0000000000a1', true) \g /dev/null
do $$
begin
  if (select count(*) from inquiries) <> 1 then raise exception 'staff must read inquiries'; end if;
  if (select country from inquiries limit 1) <> 'Israel' then raise exception 'Stage 2 fields must be stored'; end if;
  if (select count(*) from inquiry_attachments) <> 1 then raise exception 'staff must read attachment records'; end if;
  if (select count(*) from storage.objects where bucket_id = 'inquiry-attachments') <> 1 then
    raise exception 'staff must read attachment files';
  end if;
  update inquiries set status = 'read' where id = '00000000-0000-4000-8000-00000000e001';
  if (select status from inquiries where id = '00000000-0000-4000-8000-00000000e001') <> 'read' then
    raise exception 'staff must be able to update inquiry status';
  end if;
  if (select count(*) from products where code like 'RLS-%') <> 2 then
    raise exception 'staff must see draft and published products';
  end if;
  update products set featured = true where code = 'RLS-DRAFT';
  if not (select featured from products where code = 'RLS-DRAFT') then
    raise exception 'staff must be able to edit products';
  end if;
  delete from inquiries where id = '00000000-0000-4000-8000-00000000e001';
  if (select count(*) from inquiries) <> 1 then raise exception 'editors must not delete inquiries'; end if;
  delete from storage.objects where bucket_id = 'inquiry-attachments';
  if (select count(*) from storage.objects where bucket_id = 'inquiry-attachments') <> 1 then
    raise exception 'editors must not delete attachment files';
  end if;
end $$;
rollback;

-- ── Admin (owner) may erase an inquiry on request ────────────────────────────
begin;
set local role authenticated;
select set_config('request.jwt.claim.sub', '00000000-0000-4000-8000-0000000000c3', true) \g /dev/null
do $$
begin
  if (select count(*) from profiles) <> 2 then raise exception 'admin must see all profiles (recursion fix)'; end if;
  delete from storage.objects where bucket_id = 'inquiry-attachments';
  delete from inquiries where id = '00000000-0000-4000-8000-00000000e001';
  if (select count(*) from inquiries) <> 0 then raise exception 'admin must be able to erase an inquiry'; end if;
  if (select count(*) from inquiry_attachments) <> 0 then raise exception 'attachment records must cascade'; end if;
  if (select count(*) from storage.objects where bucket_id = 'inquiry-attachments') <> 0 then
    raise exception 'admin must be able to delete attachment files';
  end if;
end $$;
rollback;

-- ── Catalog management (Stage 3b) ───────────────────────────────────────────
insert into product_translations (product_id, locale, name, description) values
  ('00000000-0000-4000-8000-00000000f001', 'he', 'מוצר מפורסם', 'תיאור'),
  ('00000000-0000-4000-8000-00000000f001', 'en', 'Published product', 'Description'),
  ('00000000-0000-4000-8000-00000000f002', 'he', 'טיוטה', 'טרם פורסם'),
  ('00000000-0000-4000-8000-00000000f002', 'en', 'Draft', 'Not yet public');
insert into product_specs (product_id, spec_field_id, value_translations)
select '00000000-0000-4000-8000-00000000f002', id, '{"he":"סודי","en":"secret"}' from spec_fields where key = 'finish';

-- Visitors see published product text only, and cannot call the write functions.
begin;
set local role anon;
do $$
begin
  if not catalog_is_managed() then raise exception 'catalog_is_managed() must report imported products to anon'; end if;
  if (select count(*) from product_translations) <> 2 then
    raise exception 'anon must read translations of published products only (got %)', (select count(*) from product_translations);
  end if;
  if exists (select 1 from product_specs where product_id = '00000000-0000-4000-8000-00000000f002') then
    raise exception 'anon must not read specs of draft products';
  end if;
  begin
    perform save_product('RLS-DRAFT', 'published', '{}', '[]');
    raise exception 'anon must not call save_product';
  exception when insufficient_privilege then null;
  end;
  begin
    perform import_catalog('{}');
    raise exception 'anon must not call import_catalog';
  exception when insufficient_privilege then null;
  end;
end $$;
rollback;

-- A signed-in account without a staff profile cannot save products.
begin;
set local role authenticated;
select set_config('request.jwt.claim.sub', '00000000-0000-4000-8000-0000000000b2', true) \g /dev/null
do $$
begin
  begin
    perform save_product('RLS-DRAFT', 'published', '{}', '[]');
    raise exception 'non-staff must not save products';
  exception when insufficient_privilege then null;
  end;
end $$;
rollback;

-- Editors save products atomically but cannot import.
begin;
set local role authenticated;
select set_config('request.jwt.claim.sub', '00000000-0000-4000-8000-0000000000a1', true) \g /dev/null
do $$
begin
  if (select count(*) from product_translations) <> 4 then raise exception 'staff must read draft translations'; end if;
  perform save_product(
    'RLS-DRAFT', 'published',
    '{"he":{"name":"שם חדש","description":"תיאור חדש","alt_text":"תמונה"},"en":{"name":"New name","description":"New description","alt_text":"Photo"}}',
    '[{"key":"dimensions","value":{"he":"100×60×50 ס\"מ","en":"100×60×50 cm"}},{"key":"weight","value":{"he":"40 ק\"ג","en":"40 kg"}}]'
  );
  if (select status from products where code = 'RLS-DRAFT') <> 'published' then raise exception 'save_product must set status'; end if;
  if (select name from product_translations where product_id = '00000000-0000-4000-8000-00000000f002' and locale = 'en') <> 'New name' then
    raise exception 'save_product must update translations';
  end if;
  if (select alt_text from product_translations where product_id = '00000000-0000-4000-8000-00000000f002' and locale = 'he') <> 'תמונה' then
    raise exception 'save_product must update alt text';
  end if;
  if (select count(*) from product_specs where product_id = '00000000-0000-4000-8000-00000000f002') <> 2 then
    raise exception 'save_product must replace the spec set';
  end if;
  if exists (select 1 from product_specs ps join spec_fields sf on sf.id = ps.spec_field_id
             where ps.product_id = '00000000-0000-4000-8000-00000000f002' and sf.key = 'finish') then
    raise exception 'save_product must remove specs left out of the set';
  end if;
  begin
    perform save_product('NO-SUCH-CODE', 'draft', '{}', '[]');
    raise exception 'save_product must reject unknown products';
  exception when no_data_found then null;
  end;
  begin
    perform import_catalog('{}');
    raise exception 'editors must not import the catalog';
  exception when insufficient_privilege then null;
  end;
end $$;
rollback;

-- The admin imports the built-in catalog once; re-running keeps existing rows.
begin;
set local role authenticated;
select set_config('request.jwt.claim.sub', '00000000-0000-4000-8000-0000000000c3', true) \g /dev/null
do $$
declare
  payload jsonb := $json${
    "locales": [{"code":"he","name":"עברית","dir":"rtl","is_default":true,"sort":0}],
    "categories": [
      {"slug":"rls-import","parent":null,"sort":9,"visible_in":["he","en"],
       "translations":{"he":{"name":"קטגוריה","description":""},"en":{"name":"Category","description":""}}},
      {"slug":"rls-import-sub","parent":"rls-import","sort":0,"visible_in":["he","en"],
       "translations":{"he":{"name":"תת","description":""},"en":{"name":"Sub","description":""}}}
    ],
    "specFields": [{"key":"rls-extra","sort":20,"labels":{"he":"נוסף","en":"Extra"}}],
    "products": [
      {"code":"RLS-IMPORTED","cat":"rls-import","sub":"rls-import-sub","sort":3,
       "translations":{"he":{"name":"מיובא","description":"ת","alt_text":"א"},"en":{"name":"Imported","description":"D","alt_text":"A"}},
       "specs":[{"key":"finish","value":{"he":"לבן","en":"White"}},{"key":"rls-extra","value":{"he":"כן","en":"Yes"}}]},
      {"code":"RLS-PUBLISHED","cat":"rls-import","sub":null,"sort":0,
       "translations":{"he":{"name":"דריסה","description":""},"en":{"name":"Overwrite","description":""}},
       "specs":[]}
    ]
  }$json$;
  added integer;
begin
  added := import_catalog(payload);
  if added <> 1 then raise exception 'import_catalog must add only new products (added %)', added; end if;
  if (select name from product_translations where product_id = '00000000-0000-4000-8000-00000000f001' and locale = 'en') <> 'Published product' then
    raise exception 'import_catalog must not overwrite existing products';
  end if;
  if (select c.slug from products p join categories c on c.id = p.subcategory_id where p.code = 'RLS-IMPORTED') <> 'rls-import-sub' then
    raise exception 'import_catalog must link subcategories';
  end if;
  if (select parent.slug from categories c join categories parent on parent.id = c.parent_id where c.slug = 'rls-import-sub') <> 'rls-import' then
    raise exception 'import_catalog must nest subcategories under their parent';
  end if;
  if (select count(*) from product_specs ps join products p on p.id = ps.product_id where p.code = 'RLS-IMPORTED') <> 2 then
    raise exception 'import_catalog must store specs';
  end if;
  if (select status from products where code = 'RLS-IMPORTED') <> 'published' then
    raise exception 'imported products are published';
  end if;
  if import_catalog(payload) <> 0 then raise exception 'import_catalog must be idempotent'; end if;
end $$;
rollback;

-- ── Storage bucket is private ────────────────────────────────────────────────
do $$ begin
  if (select public from storage.buckets where id = 'inquiry-attachments') is distinct from false then
    raise exception 'inquiry-attachments bucket must be private';
  end if;
end $$;

\echo 'All RLS checks passed.'
