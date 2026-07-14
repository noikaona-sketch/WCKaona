-- PR #29 Employee Role Foundation
-- Scope: add canonical role field to employee profiles for future role-scoped RLS.
-- Intentionally does not replace broad authenticated policies yet.

alter table public.employee_profiles
  add column if not exists role text not null default 'field_team';

do $$
begin
  if not exists (select 1 from pg_constraint where conname = 'employee_profiles_role_valid') then
    alter table public.employee_profiles
      add constraint employee_profiles_role_valid
      check (
        role in (
          'field_team',
          'unload_team',
          'inspector',
          'inbound_scale',
          'outbound_scale',
          'accounting',
          'purchasing',
          'admin'
        )
      );
  end if;

  if not exists (select 1 from pg_constraint where conname = 'employee_profiles_role_trimmed') then
    alter table public.employee_profiles
      add constraint employee_profiles_role_trimmed
      check (role = btrim(role));
  end if;
end $$;

create index if not exists employee_profiles_role_idx on public.employee_profiles(role) where deleted_at is null;
