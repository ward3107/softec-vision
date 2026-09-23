-- 3D product viewer: lets the owner upload a glTF Binary (.glb) model per
-- product, shown on the product page next to the photos. The column
-- `products.model_3d_url` already exists (0001) — despite its name it stores
-- the Storage path (not a full URL), resolved via publicModelUrl() at read
-- time, exactly like product_media.storage_path / publicMediaUrl().

-- Public bucket: 3D models are meant to be visible on the site, same
-- reasoning as product-media. Capped higher (20MB) since optimized product
-- models are larger than photography.
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'product-models',
  'product-models',
  true,
  20971520,
  array['model/gltf-binary']
)
on conflict (id) do update
  set public = excluded.public,
      file_size_limit = excluded.file_size_limit,
      allowed_mime_types = excluded.allowed_mime_types;

-- Public bucket objects are served straight from the CDN (no RLS involved),
-- so the only policy needed here is who may write. Any staff member manages
-- product models, matching product-media's permission level.
drop policy if exists "staff manage product model files" on storage.objects;
create policy "staff manage product model files" on storage.objects
  for all to authenticated
  using (bucket_id = 'product-models' and public.is_staff())
  with check (bucket_id = 'product-models' and public.is_staff());
