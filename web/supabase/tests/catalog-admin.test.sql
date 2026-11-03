-- Run after rls.test.sql in a throwaway PostgreSQL database.
begin;
insert into auth.users (id,email) values ('00000000-0000-4000-8000-0000000000d4','catalog-owner@example.com');
insert into profiles (id,role) values ('00000000-0000-4000-8000-0000000000d4','admin');
insert into categories (id,slug,status,visible_in) values
 ('00000000-0000-4000-8000-00000000d001','admin-test-family','published',array['he','en']);
insert into products (code,category_id,status) values
 ('ADMIN-TEST','00000000-0000-4000-8000-00000000d001','published');
insert into inquiries (name,message,product_id) select 'Test','Preserve inquiry',id from products where code='ADMIN-TEST';
set local role authenticated;
select set_config('request.jwt.claim.sub','00000000-0000-4000-8000-0000000000d4',true);
do $$
declare sub_id uuid; old_paths text[];
begin
  perform save_subcategory(null,'00000000-0000-4000-8000-00000000d001','admin-test-sub','בדיקה','English test','published',2);
  select id into sub_id from categories where slug='admin-test-sub';
  if sub_id is null then raise exception 'subcategory was not created'; end if;
  perform save_product_details('ADMIN-TEST','published',
    '{"he":{"name":"בדיקה","description":"תיאור"},"en":{"name":"English edit","description":"English description"}}',
    '[{"key":"weight","value":{"he":"","en":"40 kg"}}]', 'admin-test-family','admin-test-sub');
  if (select subcategory_id from products where code='ADMIN-TEST') is distinct from sub_id then
    raise exception 'assignment was not saved';
  end if;
  if not exists (select 1 from product_specs s join products p on p.id=s.product_id where p.code='ADMIN-TEST' and s.value_translations->>'en'='40 kg') then
    raise exception 'English-only spec edit was lost';
  end if;
  begin
    perform save_product_details('ADMIN-TEST','archived','{}','[]','missing-category','');
    raise exception 'invalid category was accepted';
  exception when raise_exception then
    if sqlerrm <> 'invalid category' then raise; end if;
    if (select status from products where code='ADMIN-TEST') <> 'published' then raise exception 'invalid save was not atomic'; end if;
  end;
  perform save_subcategory(sub_id,'00000000-0000-4000-8000-00000000d001','admin-test-sub','שם חדש','Renamed','archived',1);
  if not exists (select 1 from category_translations where category_id=sub_id and locale='en' and name='Renamed') then raise exception 'English category rename failed'; end if;
  perform delete_subcategory(sub_id);
  if (select subcategory_id from products where code='ADMIN-TEST') is not null then raise exception 'subcategory delete lost product assignment consistency'; end if;
  old_paths := attach_product_media('ADMIN-TEST','image','ADMIN-TEST/image-first.jpg');
  old_paths := attach_product_media('ADMIN-TEST','image','ADMIN-TEST/image-second.jpg');
  if old_paths <> array['ADMIN-TEST/image-first.jpg'] then raise exception 'primary image replacement failed'; end if;
  perform attach_product_media('ADMIN-TEST','video','ADMIN-TEST/video-first.mp4');
  perform attach_product_media('ADMIN-TEST','video','ADMIN-TEST/video-first.mp4');
  if (select count(*) from product_media m join products p on p.id=m.product_id where p.code='ADMIN-TEST' and m.kind::text='video') <> 1 then raise exception 'retry duplicated video'; end if;
  perform delete_catalog_product('ADMIN-TEST');
  if exists (select 1 from products where code='ADMIN-TEST') then raise exception 'product delete failed'; end if;
  if not exists (select 1 from inquiries where message='Preserve inquiry' and product_id is null and product_code_snapshot='ADMIN-TEST') then raise exception 'product deletion damaged inquiry history'; end if;
  if not catalog_is_managed() then raise exception 'catalog ownership was lost after deletion'; end if;
  if import_catalog('{"products":[{"code":"ADMIN-TEST","cat":"admin-test-family","translations":{},"specs":[]}]}') <> 0 then raise exception 'import resurrected deleted product'; end if;
  if exists (select 1 from products where code='ADMIN-TEST') then raise exception 'deleted product was reimported'; end if;
end $$;
reset role;
set local role anon;
do $$ begin
  begin
    perform delete_catalog_product('ADMIN-TEST');
    raise exception 'anonymous deletion was allowed';
  exception when insufficient_privilege then null;
  end;
  begin
    perform attach_product_media('ADMIN-TEST','image','ADMIN-TEST/image-test.jpg');
    raise exception 'anonymous media mutation was allowed';
  exception when insufficient_privilege then null;
  end;
end $$;
rollback;
