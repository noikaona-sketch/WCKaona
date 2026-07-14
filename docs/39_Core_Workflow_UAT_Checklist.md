# 39 Core Workflow UAT Checklist

Last updated: 2026-07-15

## Purpose

Use this checklist to verify the wood receiving workflow end-to-end before production cutover. Run it with real user accounts, real Supabase auth sessions, and non-production test receipt data.

## Test Data

- At least one active supplier.
- One active user for each operational role:
  - `field_team`
  - `inbound_scale`
  - `unload_team`
  - `inspector`
  - `outbound_scale`
  - `admin`
- Three JPEG test images:
  - truck plate
  - moisture meter
  - wood load with PVC reference
- One complete happy-path truck receipt.
- One AI failure/manual-review receipt.
- One rejected receipt.

## Preflight

- Latest migrations are applied in Supabase.
- Required environment variables are present.
- `npm run typecheck`, `npm run lint`, and `npm run build` pass.
- `ROLE_GUARDS_ENABLED` is unset for baseline UAT.
- Storage bucket `wood-receipts` is private.
- Admin user can open `/wood/admin`.

## Happy Path

| Step | Actor | Route/API | Expected result |
| --- | --- | --- | --- |
| 1 | Field team | `/wood/new` | Supplier loads, employee name displays, GPS status displays. |
| 2 | Field team | `/wood/new` | User captures/selects 3 required images. Upload button remains disabled until all are present. |
| 3 | Field team | `/wood/new` | Receipt is created, images are uploaded, image metadata is saved. |
| 4 | System | `/api/ai/analyze-receipt` | Receipt moves through AI processing and ends as `pending_inbound_scale` on success. |
| 5 | Inbound scale | `/wood/inbound-scale` | Receipt appears in inbound queue. |
| 6 | Inbound scale | `/api/inbound-scale/save` | Scale ticket and gross weight save; status becomes `pending_unload`. |
| 7 | Unload team | `/wood/unload` | Receipt appears in unload queue. |
| 8 | Unload team | `/api/unload/confirm` | Unload location saves; status becomes `pending_review`. |
| 9 | Inspector | `/wood/review` and `/wood/review/[id]` | Receipt and images appear with AI result. |
| 10 | Inspector | `/api/review/decision` | Approval requires reviewed grade; status becomes `pending_outbound_scale`. |
| 11 | Outbound scale | `/wood/outbound-scale` | Receipt appears in outbound queue. |
| 12 | Outbound scale | `/api/outbound-scale/save` | Tare/outbound weight saves; net weight calculates; status becomes `closed`. |
| 13 | Any allowed reader | `/wood/history` | Closed receipt appears in history. |
| 14 | Any allowed reader | `/wood/reports` | Daily KPIs reflect the completed receipt. |
| 15 | Admin | `/wood/admin` | Operations console reflects closed count and no unexpected watch-list item. |

## Data Verification

For the completed receipt, verify:

- `wood_receipts.receipt_no` exists.
- `wood_receipts.supplier_id` matches selected supplier.
- `wood_receipts.gps_status` is populated.
- `wood_receipts.status = 'closed'`.
- `wood_receipts.review_status = 'approved'`.
- `wood_receipts.inbound_weight_kg > 0`.
- `wood_receipts.outbound_weight_kg > 0`.
- `wood_receipts.net_weight_kg = inbound_weight_kg - outbound_weight_kg`.
- `wood_receipts.scale_ticket_no` is populated.
- `wood_receipts.unloading_location` is populated.
- `wood_receipts.created_by_name`, `inbound_by_name`, `unloaded_by_name`, `reviewed_by_name`, and `outbound_by_name` are populated where applicable.
- `receipt_images` has exactly 3 active rows with canonical image types.
- `ai_analysis.raw_response` is populated when AI succeeds.
- `audit_logs` includes entries for AI success, inbound scale, unload, review approval, and outbound scale.

## Exception Paths

| Scenario | Expected result |
| --- | --- |
| Missing one required image | Upload remains disabled. |
| GPS denied | Receipt creation still works; `gps_status = 'permission_denied'`. |
| AI fails | Receipt moves to `pending_manual_review`; review queue can open it. |
| Review rejected | Reviewer note is required; status becomes `rejected`; receipt does not enter outbound queue. |
| Duplicate scale ticket | Inbound page warns before submit; inbound API still returns conflict and does not change the receipt if submitted anyway. |
| Outbound weight greater than or equal to inbound weight | Outbound API rejects the save. |
| Receipt not in expected status | API returns conflict and does not change the receipt. |
| n8n dispatch failure | Admin watch list shows failure status when dispatch status is `failed`. |

## Role Guard UAT

Run `docs/38_Role_Guard_UAT_Checklist.md` after baseline UAT passes. Do not enable `ROLE_GUARDS_ENABLED=true` in production until baseline UAT and role guard UAT both pass.

## Security Checks

- Browser bundles do not expose `SUPABASE_SERVICE_ROLE_KEY`, `OPENAI_API_KEY`, or `ANTHROPIC_API_KEY`.
- Unauthenticated users are redirected or shown login-required messages.
- Protected write APIs require a Bearer token.
- Admin employee-role management requires an active `admin` profile.
- Storage files are accessed through signed URLs or Supabase authenticated access, not public object URLs.

## Sign-Off

Record these after running UAT:

| Item | Value |
| --- | --- |
| Environment | |
| Supabase project | |
| App commit SHA | |
| Tester | |
| Date/time | |
| Happy path result | |
| Exception path result | |
| Security result | |
| Open issues | |
