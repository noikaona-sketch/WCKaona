-- PR #10 Unloading Location
-- Scope: add unloading location field and validation to wood_receipts.
-- Intentionally excludes AI, n8n, Edge Functions, and unrelated policy changes.

alter table public.wood_receipts
  add column unloading_location text;

alter table public.wood_receipts
  add constraint wood_receipts_unloading_location_length
  check (unloading_location is null or char_length(unloading_location) <= 100);

alter table public.wood_receipts
  add constraint wood_receipts_unloading_location_trimmed
  check (unloading_location is null or unloading_location = btrim(unloading_location));
