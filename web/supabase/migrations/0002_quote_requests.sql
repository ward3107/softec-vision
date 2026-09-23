-- Softec Vision — quote-request workflow (Stage 2).
-- Adds the fields the quote form collects, evidence of privacy consent, and a
-- PRIVATE storage bucket for attachments. Inquiries are written only by the
-- server with the service-role key; RLS (0001) keeps them unreadable to the
-- public and readable to staff.

alter table inquiries
  add column if not exists country         text,
  add column if not exists room_dimensions text,
  add column if not exists consent_at      timestamptz,
  add column if not exists consent_version text;

comment on column inquiries.consent_at is 'When the sender accepted the privacy notice.';
comment on column inquiries.consent_version is 'Privacy policy version (its "last updated" date) the sender accepted.';
comment on column inquiries.ip_hash is 'Keyed hash of the sender IP, for rate limiting only. The raw IP is never stored.';

create index if not exists inquiries_created_at_idx on inquiries (created_at desc);
create index if not exists inquiries_ip_hash_created_at_idx on inquiries (ip_hash, created_at);
create index if not exists inquiries_status_idx on inquiries (status);
create index if not exists inquiry_attachments_inquiry_idx on inquiry_attachments (inquiry_id);

-- Private bucket: 4 MB per file, only the formats the form accepts.
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'inquiry-attachments',
  'inquiry-attachments',
  false,
  4194304,
  array['image/jpeg', 'image/png', 'image/webp', 'image/heic', 'application/pdf']
)
on conflict (id) do update
  set public = false,
      file_size_limit = excluded.file_size_limit,
      allowed_mime_types = excluded.allowed_mime_types;

-- Staff may read attachment files (the admin view uses short-lived signed
-- URLs). There is deliberately no anon/authenticated insert, update or delete
-- policy: uploads happen server-side with the service role.
drop policy if exists "staff read inquiry attachments" on storage.objects;
create policy "staff read inquiry attachments" on storage.objects
  for select to authenticated
  using (bucket_id = 'inquiry-attachments' and public.is_staff());
