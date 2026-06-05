-- Use Supabase Auth as the source of truth for workflow ownership.
-- This migration links application profiles to auth.users and records auth.uid()
-- for every wood workflow action listed below.

create table if not exists public.profiles (
  user_id uuid primary key references auth.users(id) on delete cascade,
  full_name text,
  role text not null default 'operator',
  department text,
  status text not null default 'active',
  created_at timestamptz not null default now(),
  constraint profiles_role_not_blank check (length(btrim(role)) > 0),
  constraint profiles_status_check check (status in ('active', 'inactive', 'suspended'))
);

comment on table public.profiles is 'Application profile for each Supabase Auth user; auth.users is the source of truth for identity.';
comment on column public.profiles.user_id is 'Primary key linked one-to-one to auth.users.id.';
comment on column public.profiles.role is 'Application role used by RLS and permission checks.';
comment on column public.profiles.status is 'Only active profiles should be allowed to perform workflow actions.';

create index if not exists profiles_role_idx on public.profiles (role);
create index if not exists profiles_status_idx on public.profiles (status);

alter table public.profiles enable row level security;

create or replace function public.current_profile_role()
returns text
language sql
stable
security definer
set search_path = public
as $$
  select p.role
  from public.profiles p
  where p.user_id = auth.uid()
    and p.status = 'active'
$$;

comment on function public.current_profile_role() is 'Returns the active role for auth.uid(); use in RLS and permission checks.';

create or replace function public.is_active_profile()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.profiles p
    where p.user_id = auth.uid()
      and p.status = 'active'
  )
$$;

comment on function public.is_active_profile() is 'True when auth.uid() has an active profile.';

create or replace function public.has_profile_role(allowed_roles text[])
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select coalesce(public.current_profile_role() = any(allowed_roles), false)
$$;

comment on function public.has_profile_role(text[]) is 'Role helper for policies, e.g. public.has_profile_role(array[''admin'', ''supervisor'']).';

create or replace function public.handle_new_auth_user_profile()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (user_id, full_name)
  values (
    new.id,
    coalesce(new.raw_user_meta_data ->> 'full_name', new.raw_user_meta_data ->> 'name')
  )
  on conflict (user_id) do nothing;

  return new;
end;
$$;

comment on function public.handle_new_auth_user_profile() is 'Creates a default profile when Supabase Auth creates a user.';

drop trigger if exists on_auth_user_created_create_profile on auth.users;
create trigger on_auth_user_created_create_profile
after insert on auth.users
for each row execute function public.handle_new_auth_user_profile();

-- Profiles are readable by their owner or admins. Only admins may manage profile
-- role/status, so users cannot self-grant workflow permissions.
drop policy if exists "profiles_select_own_or_admin" on public.profiles;
create policy "profiles_select_own_or_admin"
on public.profiles
for select
to authenticated
using (user_id = auth.uid() or public.has_profile_role(array['admin']));

drop policy if exists "profiles_insert_admin" on public.profiles;
create policy "profiles_insert_admin"
on public.profiles
for insert
to authenticated
with check (public.has_profile_role(array['admin']));

drop policy if exists "profiles_update_admin" on public.profiles;
create policy "profiles_update_admin"
on public.profiles
for update
to authenticated
using (public.has_profile_role(array['admin']))
with check (public.has_profile_role(array['admin']));

drop policy if exists "profiles_delete_admin" on public.profiles;
create policy "profiles_delete_admin"
on public.profiles
for delete
to authenticated
using (public.has_profile_role(array['admin']));

create or replace function public.set_authenticated_workflow_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  actor uuid := auth.uid();
begin
  if actor is null then
    raise exception 'workflow actions require an authenticated Supabase Auth user';
  end if;

  if not exists (
    select 1
    from public.profiles p
    where p.user_id = actor
      and p.status = 'active'
  ) then
    raise exception 'workflow actions require an active profile for the authenticated user';
  end if;

  if tg_op = 'INSERT' then
    case tg_table_name
      when 'wood_receipts' then
        new.created_by := actor;
        if new.closed_by is not null then
          new.closed_by := actor;
        end if;
      when 'wood_receipt_images' then
        new.taken_by := actor;
      when 'wood_scale_tickets' then
        new.inbound_by := actor;
        if new.outbound_by is not null then
          new.outbound_by := actor;
        end if;
      when 'wood_unload_logs' then
        new.unload_by := actor;
      when 'wood_review_logs' then
        new.reviewed_by := actor;
      when 'wood_audit_logs' then
        new.changed_by := actor;
    end case;
  elsif tg_op = 'UPDATE' then
    case tg_table_name
      when 'wood_receipts' then
        new.created_by := old.created_by;
        if old.closed_by is null and new.closed_by is not null then
          new.closed_by := actor;
        else
          new.closed_by := old.closed_by;
        end if;
      when 'wood_receipt_images' then
        new.taken_by := old.taken_by;
      when 'wood_scale_tickets' then
        new.inbound_by := old.inbound_by;
        if old.outbound_by is null and new.outbound_by is not null then
          new.outbound_by := actor;
        else
          new.outbound_by := old.outbound_by;
        end if;
      when 'wood_unload_logs' then
        new.unload_by := old.unload_by;
      when 'wood_review_logs' then
        new.reviewed_by := old.reviewed_by;
      when 'wood_audit_logs' then
        new.changed_by := old.changed_by;
    end case;
  end if;

  return new;
end;
$$;

comment on function public.set_authenticated_workflow_user() is 'Forces workflow owner columns to auth.uid() and rejects unauthenticated workflow writes.';

create or replace function public.add_workflow_actor_column(table_name text, column_name text)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if to_regclass(format('public.%I', table_name)) is null then
    raise notice 'Skipping %.% because table public.% does not exist', table_name, column_name, table_name;
    return;
  end if;

  execute format(
    'alter table public.%I add column if not exists %I uuid references public.profiles(user_id) default auth.uid()',
    table_name,
    column_name
  );

  execute format(
    'create index if not exists %I on public.%I (%I)',
    table_name || '_' || column_name || '_idx',
    table_name,
    column_name
  );
end;
$$;

select public.add_workflow_actor_column('wood_receipts', 'created_by');
select public.add_workflow_actor_column('wood_receipt_images', 'taken_by');
select public.add_workflow_actor_column('wood_scale_tickets', 'inbound_by');
select public.add_workflow_actor_column('wood_unload_logs', 'unload_by');
select public.add_workflow_actor_column('wood_review_logs', 'reviewed_by');
select public.add_workflow_actor_column('wood_scale_tickets', 'outbound_by');
select public.add_workflow_actor_column('wood_receipts', 'closed_by');
select public.add_workflow_actor_column('wood_audit_logs', 'changed_by');

drop function public.add_workflow_actor_column(text, text);

-- Attach auth.uid() ownership triggers to each workflow table that exists.
do $$
declare
  workflow_table text;
begin
  foreach workflow_table in array array[
    'wood_receipts',
    'wood_receipt_images',
    'wood_scale_tickets',
    'wood_unload_logs',
    'wood_review_logs',
    'wood_audit_logs'
  ]
  loop
    if to_regclass(format('public.%I', workflow_table)) is not null then
      execute format('drop trigger if exists set_authenticated_workflow_user on public.%I', workflow_table);
      execute format(
        'create trigger set_authenticated_workflow_user before insert or update on public.%I for each row execute function public.set_authenticated_workflow_user()',
        workflow_table
      );
      execute format('alter table public.%I enable row level security', workflow_table);
    end if;
  end loop;
end $$;

-- Baseline RLS for workflow tables: active authenticated users can read records;
-- inserts require an active profile and trigger-populated actor columns; updates are
-- limited to supervisor/admin roles. Adjust allowed role arrays in follow-up
-- migrations if your operation uses different role names.
do $$
declare
  workflow_table text;
begin
  foreach workflow_table in array array[
    'wood_receipts',
    'wood_receipt_images',
    'wood_scale_tickets',
    'wood_unload_logs',
    'wood_review_logs',
    'wood_audit_logs'
  ]
  loop
    if to_regclass(format('public.%I', workflow_table)) is not null then
      execute format('drop policy if exists %I on public.%I', workflow_table || '_select_active_profiles', workflow_table);
      execute format(
        'create policy %I on public.%I for select to authenticated using (public.is_active_profile())',
        workflow_table || '_select_active_profiles',
        workflow_table
      );

      execute format('drop policy if exists %I on public.%I', workflow_table || '_insert_active_profiles', workflow_table);
      execute format(
        'create policy %I on public.%I for insert to authenticated with check (public.is_active_profile())',
        workflow_table || '_insert_active_profiles',
        workflow_table
      );

      execute format('drop policy if exists %I on public.%I', workflow_table || '_update_supervisor_admin', workflow_table);
      execute format(
        'create policy %I on public.%I for update to authenticated using (public.has_profile_role(array[''admin'', ''supervisor''])) with check (public.has_profile_role(array[''admin'', ''supervisor'']))',
        workflow_table || '_update_supervisor_admin',
        workflow_table
      );
    end if;
  end loop;
end $$;
