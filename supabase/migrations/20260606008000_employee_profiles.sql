-- PR #22 Employee Profile
-- Scope: employee profile table, owner-read RLS, and receipt employee name snapshots only.
-- Intentionally excludes role systems, AI, n8n, and storage changes.

create table public.employee_profiles (
  user_id uuid primary key references auth.users(id) on delete cascade,
  employee_code text not null,
  display_name text not null,
  phone text,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz,
  constraint employee_profiles_employee_code_unique unique (employee_code),
  constraint employee_profiles_employee_code_length check (char_length(employee_code) <= 30),
  constraint employee_profiles_display_name_length check (char_length(display_name) <= 100),
  constraint employee_profiles_phone_length check (phone is null or char_length(phone) <= 30),
  constraint employee_profiles_employee_code_trimmed check (employee_code = btrim(employee_code)),
  constraint employee_profiles_display_name_trimmed check (display_name = btrim(display_name)),
  constraint employee_profiles_phone_trimmed check (phone is null or phone = btrim(phone))
);

create index employee_profiles_active_idx on public.employee_profiles(is_active) where deleted_at is null;
create index employee_profiles_display_name_idx on public.employee_profiles(display_name) where deleted_at is null;

alter table public.employee_profiles enable row level security;

create policy employee_profiles_select_own_profile
on public.employee_profiles
for select
to authenticated
using (
  user_id = auth.uid()
  and is_active = true
  and deleted_at is null
);

alter table public.wood_receipts
  add column created_by uuid references auth.users(id) on delete set null,
  add column created_by_name text,
  add column reviewed_by_name text,
  add column unloaded_by uuid references auth.users(id) on delete set null,
  add column unloaded_by_name text;

alter table public.wood_receipts
  add constraint wood_receipts_reviewed_by_fkey
  foreign key (reviewed_by) references auth.users(id) on delete set null;

alter table public.wood_receipts
  add constraint wood_receipts_created_by_name_length
  check (created_by_name is null or char_length(created_by_name) <= 100),
  add constraint wood_receipts_reviewed_by_name_length
  check (reviewed_by_name is null or char_length(reviewed_by_name) <= 100),
  add constraint wood_receipts_unloaded_by_name_length
  check (unloaded_by_name is null or char_length(unloaded_by_name) <= 100),
  add constraint wood_receipts_created_by_name_trimmed
  check (created_by_name is null or created_by_name = btrim(created_by_name)),
  add constraint wood_receipts_reviewed_by_name_trimmed
  check (reviewed_by_name is null or reviewed_by_name = btrim(reviewed_by_name)),
  add constraint wood_receipts_unloaded_by_name_trimmed
  check (unloaded_by_name is null or unloaded_by_name = btrim(unloaded_by_name));

create index wood_receipts_created_by_idx on public.wood_receipts(created_by) where deleted_at is null;
create index wood_receipts_reviewed_by_idx on public.wood_receipts(reviewed_by) where deleted_at is null;
create index wood_receipts_unloaded_by_idx on public.wood_receipts(unloaded_by) where deleted_at is null;
