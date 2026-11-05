-- Isolated fixtures only; all work rolls back. Exercise RPCs and real PostgreSQL RLS.
begin;
insert into auth.users(id,email) values ('00000000-0000-4000-8000-0000000000d5','creation-editor@example.com');
insert into profiles(id,role) values('00000000-0000-4000-8000-0000000000d5','editor');
set local role authenticated;
select set_config('request.jwt.claim.sub','00000000-0000-4000-8000-0000000000d5',true);
select create_catalog_product('CREATE-QA','podium','', '{"he":{"name":"בדיקה","description":"תיאור"},"en":{"name":"QA product","description":"Description"}}','[]');
set constraints all immediate;
do $$ begin
  if (select status from products where code='CREATE-QA') <> 'draft' then raise exception 'creation must be draft'; end if;
  begin
    perform create_catalog_product('CREATE-QA','podium','','{}','[]');
    raise exception 'duplicate code accepted';
  exception when unique_violation then null; end;
  begin
    perform create_catalog_product('../bad','podium','','{}','[]');
    raise exception 'unsafe code accepted';
  exception when raise_exception then if sqlerrm <> 'invalid code' then raise; end if; end;
  begin
    perform create_catalog_product('new','podium','','{}','[]');
    raise exception 'reserved code accepted';
  exception when raise_exception then if sqlerrm <> 'invalid code' then raise; end if; end;
  begin
    perform create_catalog_product('BAD-CAT','podium','not-a-subcategory','{}','[]');
    raise exception 'wrong subcategory accepted';
  exception when raise_exception then if sqlerrm <> 'invalid subcategory' then raise; end if; end;
  if exists(select 1 from products where code='BAD-CAT') then raise exception 'failed creation left partial data'; end if;
  begin
    update products set status='published' where code='CREATE-QA';
    raise exception 'publication without image accepted';
  exception when check_violation then null; end;
  begin
    perform attach_product_external_media('CREATE-QA','image','javascript:alert(1)');
    raise exception 'unsafe external URL accepted';
  exception when raise_exception then if sqlerrm <> 'invalid media url' then raise; end if; end;
  begin
    perform attach_product_external_media('CREATE-QA','image','https://user:secret@example.com/a.jpg');
    raise exception 'credential URL accepted';
  exception when raise_exception then if sqlerrm <> 'invalid media url' then raise; end if; end;
  perform attach_product_external_media('CREATE-QA','image','https://cdn.example.com/product.jpg');
  perform attach_product_external_media('CREATE-QA','gallery','https://cdn.example.com/gallery.webp');
  perform attach_product_external_media('CREATE-QA','video','https://cdn.example.com/product.mp4');
  perform attach_product_external_media('CREATE-QA','video','https://cdn.example.com/product.mp4');
  if (select count(*) from product_media m join products p on p.id=m.product_id where p.code='CREATE-QA') <> 3 then raise exception 'link retry duplicated media'; end if;
  if (select status from products where code='CREATE-QA') <> 'draft' then raise exception 'media upload published draft'; end if;
end $$;
reset role;
set local role anon;
select set_config('request.jwt.claim.sub','',true);
do $$ begin
  if exists(select 1 from products where code='CREATE-QA') then raise exception 'draft leaked'; end if;
  if exists(select 1 from product_translations where name='QA product') then raise exception 'draft translation leaked'; end if;
  begin
    perform create_catalog_product('ANON','podium','','{}','[]'); raise exception 'anonymous creation allowed';
  exception when insufficient_privilege then null; end;
end $$;
reset role;
set local role authenticated;
select set_config('request.jwt.claim.sub','00000000-0000-4000-8000-0000000000d5',true);
update products set status='published' where code='CREATE-QA';
reset role;
set local role anon;
select set_config('request.jwt.claim.sub','',true);
do $$ begin
  if (select count(*) from products where code='CREATE-QA')<>1 then raise exception 'ready product not public'; end if;
  if (select count(*) from product_translations where name='QA product')<>1 then raise exception 'ready translation not public'; end if;
end $$;
reset role;
set local role authenticated;
select set_config('request.jwt.claim.sub','00000000-0000-4000-8000-0000000000d5',true);
do $$ begin
  begin
    delete from product_media where kind='image' and product_id=(select id from products where code='CREATE-QA');
    raise exception 'removing published primary image allowed';
  exception when check_violation then null; end;
  begin
    update product_translations set description='' where locale='en' and product_id=(select id from products where code='CREATE-QA');
    raise exception 'incomplete published translation allowed';
  exception when check_violation then null; end;
  begin
    perform delete_catalog_product('CREATE-QA'); raise exception 'editor product deletion allowed';
  exception when insufficient_privilege then null; end;
end $$;
update products set status='draft' where code='CREATE-QA';
select attach_product_media('CREATE-QA','image','CREATE-QA/image-one.jpg');
select attach_product_media('CREATE-QA','image','CREATE-QA/image-two.jpg');
select attach_product_media('CREATE-QA','model','CREATE-QA/model-one.glb');
select attach_product_media('CREATE-QA','video','CREATE-QA/video-one.mp4');
reset role;
insert into storage.objects(bucket_id,name) values('product-media','CREATE-QA/image-one.jpg'),('product-media','CREATE-QA/image-two.jpg'),('product-models','CREATE-QA/model-one.glb'),('product-videos','CREATE-QA/video-one.mp4');
insert into inquiries(name,message,product_id) select 'QA','Keep this inquiry',id from products where code='CREATE-QA';
set local role authenticated;
select set_config('request.jwt.claim.sub','00000000-0000-4000-8000-0000000000c3',true);
select delete_catalog_product('CREATE-QA');
do $$ begin
  if exists(select 1 from products where code='CREATE-QA') then raise exception 'product not deleted'; end if;
  if (select count(*) from retained_product_files where product_code='CREATE-QA')<>4 then raise exception 'retention manifest incomplete'; end if;
  if exists(select 1 from retained_product_files where storage_path like 'https://%') then raise exception 'external URL queued as owned file'; end if;
  if (select count(*) from storage.objects where name like 'CREATE-QA/%')<>4 then raise exception 'storage object deleted'; end if;
  if not exists(select 1 from inquiries where message='Keep this inquiry' and product_id is null and product_code_snapshot='CREATE-QA') then raise exception 'inquiry history lost'; end if;
end $$;
reset role;
set local role anon;
select set_config('request.jwt.claim.sub','',true);
do $$ begin
  begin
    perform * from retained_product_files; raise exception 'retention data exposed';
  exception when insufficient_privilege then null; end;
end $$;
rollback;
