-- Fix: 0001's "admin manage profiles" policy queried `profiles` from inside a
-- policy on `profiles`, which PostgreSQL rejects with "infinite recursion
-- detected in policy" — any signed-in query on profiles would fail. Check the
-- admin role through a SECURITY DEFINER function instead (same pattern as
-- is_staff()), which reads profiles as the table owner without re-entering RLS.

create or replace function is_admin() returns boolean
  language sql stable security definer set search_path = public as $$
    select exists (select 1 from profiles where id = auth.uid() and role = 'admin');
$$;

drop policy if exists "admin manage profiles" on profiles;
create policy "admin manage profiles" on profiles for all
  using (is_admin())
  with check (is_admin());
