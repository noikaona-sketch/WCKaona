-- PR #31 Controlled Receipt Reopen
-- Scope: add metadata fields for admin-controlled reopen/correction flow.
-- Intentionally does not relax role policies or allow non-admin reopen.

alter table public.wood_receipts
  add column if not exists reopened_at timestamptz,
  add column if not exists reopened_by uuid references auth.users(id) on delete set null,
  add column if not exists reopened_by_name text,
  add column if not exists reopen_note text;

do $$
begin
  if not exists (select 1 from pg_constraint where conname = 'wood_receipts_reopened_by_name_length') then
    alter table public.wood_receipts
      add constraint wood_receipts_reopened_by_name_length
      check (reopened_by_name is null or char_length(reopened_by_name) <= 100);
  end if;

  if not exists (select 1 from pg_constraint where conname = 'wood_receipts_reopen_note_length') then
    alter table public.wood_receipts
      add constraint wood_receipts_reopen_note_length
      check (reopen_note is null or char_length(reopen_note) <= 500);
  end if;

  if not exists (select 1 from pg_constraint where conname = 'wood_receipts_reopened_by_name_trimmed') then
    alter table public.wood_receipts
      add constraint wood_receipts_reopened_by_name_trimmed
      check (reopened_by_name is null or reopened_by_name = btrim(reopened_by_name));
  end if;

  if not exists (select 1 from pg_constraint where conname = 'wood_receipts_reopen_note_trimmed') then
    alter table public.wood_receipts
      add constraint wood_receipts_reopen_note_trimmed
      check (reopen_note is null or reopen_note = btrim(reopen_note));
  end if;
end $$;

create index if not exists wood_receipts_reopened_at_idx on public.wood_receipts(reopened_at) where deleted_at is null;
create index if not exists wood_receipts_reopened_by_idx on public.wood_receipts(reopened_by) where deleted_at is null;
