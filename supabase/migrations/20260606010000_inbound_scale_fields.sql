-- PR #25 Inbound Scale Persistence
-- Scope: add inbound scale ticket/user/timestamp fields to wood_receipts.
-- Intentionally excludes role-policy changes and destructive rewrites.

alter table public.wood_receipts
  add column if not exists scale_ticket_no text,
  add column if not exists inbound_at timestamptz,
  add column if not exists inbound_by uuid references auth.users(id) on delete set null,
  add column if not exists inbound_by_name text;

do $$
begin
  if not exists (select 1 from pg_constraint where conname = 'wood_receipts_scale_ticket_no_length') then
    alter table public.wood_receipts
      add constraint wood_receipts_scale_ticket_no_length
      check (scale_ticket_no is null or char_length(scale_ticket_no) <= 50);
  end if;

  if not exists (select 1 from pg_constraint where conname = 'wood_receipts_scale_ticket_no_trimmed') then
    alter table public.wood_receipts
      add constraint wood_receipts_scale_ticket_no_trimmed
      check (scale_ticket_no is null or scale_ticket_no = btrim(scale_ticket_no));
  end if;

  if not exists (select 1 from pg_constraint where conname = 'wood_receipts_inbound_by_name_length') then
    alter table public.wood_receipts
      add constraint wood_receipts_inbound_by_name_length
      check (inbound_by_name is null or char_length(inbound_by_name) <= 100);
  end if;

  if not exists (select 1 from pg_constraint where conname = 'wood_receipts_inbound_by_name_trimmed') then
    alter table public.wood_receipts
      add constraint wood_receipts_inbound_by_name_trimmed
      check (inbound_by_name is null or inbound_by_name = btrim(inbound_by_name));
  end if;
end $$;

create unique index if not exists wood_receipts_scale_ticket_no_uidx
  on public.wood_receipts(scale_ticket_no)
  where deleted_at is null and scale_ticket_no is not null;

create index if not exists wood_receipts_inbound_at_idx on public.wood_receipts(inbound_at) where deleted_at is null;
create index if not exists wood_receipts_inbound_by_idx on public.wood_receipts(inbound_by) where deleted_at is null;
