-- PR #24 Unload Confirmation Timestamp
-- Scope: add unloaded_at to support persisted unload confirmation.
-- Intentionally excludes role-policy changes and destructive rewrites.

alter table public.wood_receipts
  add column unloaded_at timestamptz;

create index wood_receipts_unloaded_at_idx on public.wood_receipts(unloaded_at) where deleted_at is null;
