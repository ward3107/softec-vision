-- Stage 3c: lets the owner replace product photos and edit key marketing
-- copy from the admin — no code change needed for either.
--
-- The tables for both already exist (0001): `product_media` (staff-managed,
-- public reads published-product media) and `content_blocks` /
-- `content_block_translations` (staff-managed, public reads published
-- blocks). Only a Storage bucket for product photos was missing.

-- Public bucket: product photography is meant to be visible on the site, so
-- (unlike the private inquiry-attachments bucket) files are served directly
-- from the public URL. Only image formats, a generous size for display-grade
-- photography.
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'product-media',
  'product-media',
  true,
  6291456,
  array['image/jpeg', 'image/png', 'image/webp']
)
on conflict (id) do update
  set public = excluded.public,
      file_size_limit = excluded.file_size_limit,
      allowed_mime_types = excluded.allowed_mime_types;

-- Public bucket objects are served straight from the CDN (no RLS involved),
-- so the only policy needed here is who may write. Any staff member manages
-- product photos, matching save_product()'s permission level.
drop policy if exists "staff manage product media files" on storage.objects;
create policy "staff manage product media files" on storage.objects
  for all to authenticated
  using (bucket_id = 'product-media' and public.is_staff())
  with check (bucket_id = 'product-media' and public.is_staff());
