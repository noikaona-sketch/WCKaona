-- PR #8 Supabase Storage Foundation
-- Scope: private storage bucket and basic authenticated object policies only.
-- Intended path structure:
--   receipt/{receipt_id}/01_size.jpg
--   receipt/{receipt_id}/02_moisture.jpg
--   receipt/{receipt_id}/03_license.jpg
-- Intentionally excludes Edge Functions, AI, n8n, image processing, and thumbnail generation.

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'wood-receipts',
  'wood-receipts',
  false,
  10485760,
  array['image/jpeg', 'image/png', 'image/webp']
)
on conflict (id) do update
set
  name = excluded.name,
  public = false,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

create policy wood_receipts_storage_read_authenticated
  on storage.objects
  for select
  to authenticated
  using (bucket_id = 'wood-receipts');

create policy wood_receipts_storage_upload_authenticated
  on storage.objects
  for insert
  to authenticated
  with check (
    bucket_id = 'wood-receipts'
    and storage.foldername(name)[1] = 'receipt'
    and storage.foldername(name)[2] is not null
    and storage.foldername(name)[2] <> ''
    and array_length(storage.foldername(name), 1) = 2
    and storage.filename(name) in ('01_size.jpg', '02_moisture.jpg', '03_license.jpg')
  );
