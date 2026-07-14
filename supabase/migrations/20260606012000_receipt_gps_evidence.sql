-- PR #28 Receipt GPS Evidence
-- Scope: store optional GPS evidence captured when creating a wood receipt.
-- Intentionally optional: receipt creation must not depend on GPS permission.

alter table public.wood_receipts
  add column if not exists gps_lat numeric(10,7),
  add column if not exists gps_lng numeric(10,7),
  add column if not exists gps_accuracy_m numeric(10,2),
  add column if not exists gps_captured_at timestamptz,
  add column if not exists gps_status text;

do $$
begin
  if not exists (select 1 from pg_constraint where conname = 'wood_receipts_gps_lat_range') then
    alter table public.wood_receipts
      add constraint wood_receipts_gps_lat_range
      check (gps_lat is null or (gps_lat >= -90 and gps_lat <= 90));
  end if;

  if not exists (select 1 from pg_constraint where conname = 'wood_receipts_gps_lng_range') then
    alter table public.wood_receipts
      add constraint wood_receipts_gps_lng_range
      check (gps_lng is null or (gps_lng >= -180 and gps_lng <= 180));
  end if;

  if not exists (select 1 from pg_constraint where conname = 'wood_receipts_gps_accuracy_non_negative') then
    alter table public.wood_receipts
      add constraint wood_receipts_gps_accuracy_non_negative
      check (gps_accuracy_m is null or gps_accuracy_m >= 0);
  end if;

  if not exists (select 1 from pg_constraint where conname = 'wood_receipts_gps_status_valid') then
    alter table public.wood_receipts
      add constraint wood_receipts_gps_status_valid
      check (
        gps_status is null
        or gps_status in ('captured', 'permission_denied', 'unavailable', 'unsupported', 'timeout', 'error')
      );
  end if;
end $$;

create index if not exists wood_receipts_gps_captured_at_idx on public.wood_receipts(gps_captured_at) where deleted_at is null;
