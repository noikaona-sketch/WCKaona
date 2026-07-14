-- PR #25 Inbound Scale Persistence
-- Scope: add inbound scale ticket/user/timestamp fields to wood_receipts.
-- Intentionally excludes role-policy changes and destructive rewrites.

alter table public.wood_receipts
  add column scale_ticket_no text,
  add column inbound_at timestamptz,
  add column inbound_by uuid references auth.users(id) on delete set null,
  add column inbound_by_name text;

alter table public.wood_receipts
  add constraint wood_receipts_scale_ticket_no_length
  check (scale_ticket_no is null or char_length(scale_ticket_no) <= 50),
  add constraint wood_receipts_scale_ticket_no_trimmed
  check (scale_ticket_no is null or scale_ticket_no = btrim(scale_ticket_no)),
  add constraint wood_receipts_inbound_by_name_length
  check (inbound_by_name is null or char_length(inbound_by_name) <= 100),
  add constraint wood_receipts_inbound_by_name_trimmed
  check (inbound_by_name is null or inbound_by_name = btrim(inbound_by_name));

create unique index wood_receipts_scale_ticket_no_uidx
  on public.wood_receipts(scale_ticket_no)
  where deleted_at is null and scale_ticket_no is not null;

create index wood_receipts_inbound_at_idx on public.wood_receipts(inbound_at) where deleted_at is null;
create index wood_receipts_inbound_by_idx on public.wood_receipts(inbound_by) where deleted_at is null;
