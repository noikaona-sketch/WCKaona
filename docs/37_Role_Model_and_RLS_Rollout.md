# 37 Role Model and RLS Rollout

Last updated: 2026-07-14

## Purpose

This document fixes the canonical employee role values and the rollout order for role-scoped access control. The first implementation step adds role data to `employee_profiles`; the next step can safely replace broad authenticated RLS with role-specific policies.

## Canonical Employee Roles

Use these values in `employee_profiles.role`:

| Value | Main routes/actions |
| --- | --- |
| `field_team` | Create receipt, upload required images, view own/today history. |
| `unload_team` | View pending unload queue and confirm unload. |
| `inspector` | View review queue, inspect images/AI result, approve/reject/adjust. |
| `inbound_scale` | View inbound scale queue and save gross weight/ticket. |
| `outbound_scale` | View outbound scale queue, save tare weight, close receipt. |
| `accounting` | Read reports and export accounting data. |
| `purchasing` | Read supplier/grade reports. |
| `admin` | Manage users, roles, rules, reopen jobs, and controlled corrections. |

## Current State

- `employee_profiles.role` exists as a canonical role field after migration `20260606013000_employee_profile_roles.sql`.
- SQL helper functions exist after migration `20260606014000_employee_role_helpers.sql`:
  - `public.current_employee_role()`
  - `public.current_employee_has_role(text[])`
- The app has shared TypeScript role constants in `lib/employee-roles.ts`.
- `/wood/admin` shows the signed-in user's role from their employee profile.
- Core write APIs have a shared `requireEmployeeRole` guard:
  - Inbound scale: `inbound_scale`, `admin`
  - Unload confirm: `unload_team`, `admin`
  - Review decision: `inspector`, `admin`
  - Outbound scale: `outbound_scale`, `admin`
- Role guard enforcement is controlled by `ROLE_GUARDS_ENABLED=true`. When it is not enabled, APIs continue working but audit metadata records the actor role and enforcement state.
- `/wood/admin` includes an Employee Roles section for admins to change `employee_profiles.role` and `is_active`.
- `/api/admin/employee-profiles` always requires an active `admin` profile, even before `ROLE_GUARDS_ENABLED=true`.
- `/api/admin/reopen-receipt` always requires an active `admin` profile and records reopen metadata plus an audit log.
- Existing broad authenticated RLS policies remain in place for now to avoid interrupting the working core flow.

## Rollout Order

1. Apply role migrations in Supabase.
2. Bootstrap the first admin by updating one trusted active profile directly in Supabase:

```sql
update public.employee_profiles
set role = 'admin'
where employee_code = 'YOUR_ADMIN_EMPLOYEE_CODE';
```

3. Use `/wood/admin` to assign real roles to all active users in `employee_profiles`.
4. Run the core workflow with `ROLE_GUARDS_ENABLED` unset and confirm audit metadata contains expected roles.
5. Follow `docs/38_Role_Guard_UAT_Checklist.md` in staging.
6. Enable `ROLE_GUARDS_ENABLED=true` in a staging environment and verify each role with a UAT account.
7. Replace broad authenticated RLS with route/action-specific policies.
8. Move remaining client-side write flows behind API routes where audit and role checks are required.

## Guardrails

- Do not tighten RLS before every active user has a role.
- Do not let client code use service-role credentials.
- Do not allow closed receipt changes except through the admin reopen/correction API with audit notes.
- Keep compatibility for legacy records until a deliberate data migration is planned.
