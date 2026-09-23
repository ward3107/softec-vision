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

-- ── Storage bucket is private ────────────────────────────────────────────────
do $$ begin
  if (select public from storage.buckets where id = 'inquiry-attachments') is distinct from false then
    raise exception 'inquiry-attachments bucket must be private';
  end if;
end $$;

\echo 'All RLS checks passed.'
