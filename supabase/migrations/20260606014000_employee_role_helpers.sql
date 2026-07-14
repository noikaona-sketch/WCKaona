-- PR #30 Employee Role Helper Functions
-- Scope: SQL helpers for future role-scoped RLS policies.
-- Intentionally does not drop or replace existing broad authenticated policies.

create or replace function public.current_employee_role()
returns text
language sql
stable
security definer
set search_path = public
as $$
  select ep.role
  from public.employee_profiles ep
  where ep.user_id = auth.uid()
    and ep.is_active = true
    and ep.deleted_at is null
  limit 1
$$;

create or replace function public.current_employee_has_role(allowed_roles text[])
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select coalesce(public.current_employee_role() = any(allowed_roles), false)
$$;

grant execute on function public.current_employee_role() to authenticated;
grant execute on function public.current_employee_has_role(text[]) to authenticated;
