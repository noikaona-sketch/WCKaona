# 38 Role Guard UAT Checklist

Last updated: 2026-07-14

## Purpose

Use this checklist before enabling `ROLE_GUARDS_ENABLED=true` in production. The goal is to confirm real users have correct roles and the protected workflow APIs allow only the intended teams.

## Preflight

- Apply all Supabase migrations through `20260606014000_employee_role_helpers.sql`.
- Bootstrap one trusted admin profile.
- Open `/wood/admin` and assign roles to every active employee profile.
- Confirm the Role Enforcement Readiness panel shows at least one active admin.
- Keep `ROLE_GUARDS_ENABLED` unset while assigning roles.

## Staging Enforcement Test

Set `ROLE_GUARDS_ENABLED=true` in staging only, then test with one account per role.

| Role | Must allow | Must block |
| --- | --- | --- |
| `field_team` | Create receipt and upload images. | Inbound scale, unload confirm, review decision, outbound scale. |
| `inbound_scale` | Save scale ticket and gross weight. | Unload confirm, review decision, outbound scale. |
| `unload_team` | Confirm unloading location. | Inbound scale, review decision, outbound scale. |
| `inspector` | Approve or reject review. | Inbound scale, unload confirm, outbound scale. |
| `outbound_scale` | Save tare/outbound weight and close receipt. | Inbound scale, unload confirm, review decision. |
| `admin` | All protected write actions and employee role management. | None of the protected admin/core actions. |
| `accounting` | Read reports. | Protected write actions. |
| `purchasing` | Read reports. | Protected write actions. |

## Audit Verification

For each successful protected write, confirm `audit_logs.metadata` includes:

- `actor_role`
- `role_guard_enforced`
- action-specific `source`

When staging enforcement is enabled, `role_guard_enforced` should be `true`.

## Production Cutover

- Do not enable production enforcement until every active profile has the intended role.
- Enable `ROLE_GUARDS_ENABLED=true`.
- Run one happy-path receipt through the full flow.
- Keep broad RLS policies unchanged until route/API role behavior is verified in production.
- Replace broad RLS with role-scoped policies only after this checklist passes.
