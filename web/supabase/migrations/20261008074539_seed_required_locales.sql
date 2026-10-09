-- Required by content_block_translations even before the catalog is imported.
-- Existing language settings and translations are intentionally preserved.
insert into public.locales (code, name, dir, enabled, is_default, sort)
select 'he', 'עברית', 'rtl', true,
       not exists (select 1 from public.locales where is_default), 0
on conflict (code) do nothing;

insert into public.locales (code, name, dir, enabled, is_default, sort)
values ('en', 'English', 'ltr', true, false, 1)
on conflict (code) do nothing;
