-- Permanent deletion of an inquiry, for privacy requests (a person asking for
-- their data to be erased). Admins only — editors can triage and archive but
-- not destroy records. Attachment rows cascade with the inquiry (FK in 0001);
-- the stored files are removed by the admin action through this policy.

drop policy if exists "admin delete inquiries" on inquiries;
create policy "admin delete inquiries" on inquiries for delete
  using (public.is_admin());

drop policy if exists "admin delete inquiry attachment files" on storage.objects;
create policy "admin delete inquiry attachment files" on storage.objects
  for delete to authenticated
  using (bucket_id = 'inquiry-attachments' and public.is_admin());
