-- PR #26 Outbound Scale Persistence
-- Scope: add outbound scale user/timestamp fields to wood_receipts.
-- Intentionally excludes role-policy changes and destructive rewrites.

alter table public.wood_receipts
  add column outbound_at timestamptz,
  add column outbound_by uuid references auth.users(id) on delete set null,
  add column outbound_by_name text;

alter table public.wood_receipts
  add constraint wood_receipts_outbound_by_name_length
  check (outbound_by_name is null or char_length(outbound_by_name) <= 100),
  add constraint wood_receipts_outbound_by_name_trimmed
  check (outbound_by_name is null or outbound_by_name = btrim(outbound_by_name));

create index wood_receipts_outbound_at_idx on public.wood_receipts(outbound_at) where deleted_at is null;
create index wood_receipts_outbound_by_idx on public.wood_receipts(outbound_by) where deleted_at is null;
