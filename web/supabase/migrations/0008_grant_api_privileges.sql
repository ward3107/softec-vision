-- 0008: grant the API roles their privileges on the public schema.
--
-- Every table in 0001–0007 is created by the `postgres` role. Postgres' default
-- privileges grant the Supabase API roles (anon / authenticated / service_role)
-- only TRUNCATE / REFERENCES / TRIGGER on such tables — never SELECT / INSERT /
-- UPDATE / DELETE (those defaults are configured for tables owned by
-- `supabase_admin`, not `postgres`). PostgREST runs as anon/authenticated, so it
-- is denied at the GRANT level before RLS is ever consulted:
--   "permission denied for table products / content_blocks / profiles …"
-- which breaks the public catalog reads and the admin sign-in (the app cannot
-- read the signed-in user's profile row, so every account looks like "no access").
--
-- Grant the privileges the RLS policies already assume. Row Level Security stays
-- the actual gate — these grants only let the policies run; they decide which
-- rows each role may read or change. This mirrors what Supabase grants by default
-- on supabase_admin-owned tables.

grant usage on schema public to anon, authenticated, service_role;

grant select on all tables in schema public to anon, authenticated;
grant insert, update, delete on all tables in schema public to authenticated;
grant all on all tables in schema public to service_role;
grant usage, select on all sequences in schema public to anon, authenticated, service_role;
grant execute on all functions in schema public to anon, authenticated, service_role;

-- Same treatment for objects added by any future migration (created by postgres).
alter default privileges in schema public grant select on tables to anon, authenticated;
alter default privileges in schema public grant insert, update, delete on tables to authenticated;
alter default privileges in schema public grant all on tables to service_role;
alter default privileges in schema public grant usage, select on sequences to anon, authenticated, service_role;
alter default privileges in schema public grant execute on functions to anon, authenticated, service_role;
