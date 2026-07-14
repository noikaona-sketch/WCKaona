# TODO - WC Kaona Progress Tracker

Last reviewed: 2026-07-14

## Current Snapshot

- Repository: `C:\Users\Misno\OneDrive - บริษัทก้าวหน้าอุตสาหกรรมอาหารสัตว์ จำกัด\Github\WCKaona`
- Branch: `main`
- Git status at review time: clean
- Stack found: Next.js App Router, TypeScript, Tailwind CSS, Supabase client/server, Supabase migrations
- Node dependencies: `node_modules` not installed locally at review time
- Main product goal: build a complete wood receiving system with AI-assisted grading

## Original Product Expectations

- One truck visit equals one receipt bill.
- Each receipt must have 3 required images:
  - Truck plate
  - Moisture meter
  - Wood load with PVC reference
- AI assists with OCR, moisture reading, wood-load analysis, grade suggestion, and confidence score.
- Inspector makes the final decision; AI must not be the final authority.
- Everything important must be traceable through stored records and audit logs.
- No AI keys or service-role secrets may be exposed to browser/client code.
- Supabase Auth is the source of truth; no anonymous production access.
- RLS should default deny, with explicit role-based access.

## Original Roadmap

- Phase 1: UI mockup with route structure, mobile/desktop screens, mock data, theme, and components.
- Phase 2: Supabase foundation with auth, profiles, roles, RLS, storage, and migrations.
- Phase 3: Image capture/upload with metadata, GPS, validation, and required-image enforcement.
- Phase 4: AI analysis with structured JSON, OCR, grade recommendation, confidence, and audit trail.
- Phase 5: Operational workflow for inbound scale, unload, inspector review, outbound scale, close job, and history.
- Phase 6: Reports and dashboard.
- Phase 7: Advanced features such as supplier quality score, alerts, anomaly detection, and defect detection.

## Evidence Found

### Implemented or Partially Implemented

- PR#1 UI routes/components exist for mobile and desktop flows.
- Supabase foundation exists in migrations:
  - `suppliers`
  - `wood_receipts`
  - `receipt_images`
  - `ai_analysis`
  - `audit_logs`
  - `employee_profiles`
- Storage foundation exists for private `wood-receipts` bucket.
- Basic authenticated RLS policies exist, but not full role-based RLS.
- New receipt page can select supplier, require 3 images, create a draft receipt, resize images to JPEG, upload to Supabase Storage, and insert image metadata.
- Review list loads pending review receipts from Supabase.
- Review detail loads receipt, images, AI analysis, and can approve/reject through an API route.
- AI analysis server API exists and calls server-side provider logic.
- AI provider code supports OpenAI/Claude-style provider selection and stores structured results.
- n8n dispatch tracking fields and dispatch route/library exist.
- Admin status page exists for smoke-test visibility across receipt, AI, review, and n8n status.

### Still Mock or Placeholder

- `/wood/inbound-scale` still uses mock receipt data and placeholder form only.
- `/wood/outbound-scale` still uses mock receipt data and placeholder form only.
- `/wood/reports` still shows static KPI/sample data.
- Some pages/components still depend on `lib/mock-data.ts`.
- Unload page displays pending jobs from Supabase but confirm unload is currently local UI state, not persisted to database.
- GPS capture is shown as pending/waiting in the new receipt UI, but metadata persistence for GPS was not verified in code.

## Known Gaps and Risks

- Role-based access is incomplete. Current RLS is broad authenticated access, not the detailed roles from the spec.
- Workflow status transitions are inconsistent:
  - Specs use statuses like `Pending Inbound Scale`, `Pending Unload`, `Pending Review`, `Closed`.
  - Database default uses lowercase `draft`.
  - Some UI uses mock status strings.
- Storage naming differs from early PR docs:
  - Docs mention `receipt_no/image_type/timestamp.ext`.
  - Current implementation uses `receipt/{receipt_id}/01_size.jpg`, `02_moisture.jpg`, `03_license.jpg`.
- Image type naming differs from docs:
  - Docs mention `truck_plate`, `moisture_meter`, `wood_with_pvc`.
  - Current implementation stores `license`, `moisture`, `size`.
- Upload validation currently converts all images to JPEG and then only accepts JPEG, while docs allow jpg/jpeg/png/webp up to 10 MB.
- Review detail source has mojibake/garbled Thai strings in code, likely from encoding conversion. UI text should be audited and repaired.
- No local dependency install was present, so build/typecheck/lint were not verified during this review.
- No automated test suite was found beyond package scripts.
- Supabase migrations are forward migrations only; reversibility was not verified.
- Audit coverage exists for review decision but not yet verified for every required action.

## Priority TODO

### P0 - Stabilize Current Baseline

- [ ] Install dependencies and run `npm run typecheck`.
- [ ] Run `npm run build`.
- [ ] Verify whether `npm run lint` works with Next.js 15 / ESLint 9 setup.
- [ ] Fix Thai text encoding/mojibake in affected source files, especially review detail page.
- [ ] Decide canonical workflow status values and align docs, database defaults, UI, APIs, and mock data.
- [ ] Decide canonical image type names and align docs, DB rows, storage paths, AI analysis, and review UI.

### P1 - Complete Core Receipt Flow

- [ ] New receipt: persist GPS latitude/longitude and captured timestamps as required by PR#3.
- [ ] New receipt: after image upload, transition from draft/submitted into the next workflow state intentionally.
- [ ] New receipt: trigger AI analysis or queue processing after the required image set is complete.
- [ ] AI analysis: confirm raw JSON, normalized fields, warnings, errors, and audit logs are stored.
- [ ] AI failure handling: mark active receipt as AI Failed or Pending Manual Review and preserve retry path.
- [ ] Review: verify approve/reject updates workflow status, final grade, notes, reviewer, and audit log.
- [ ] Review: add explicit Adjust / Need Retake Photo / manual correction path if still required.

### P2 - Operational Workflow

- [ ] Inbound scale: replace mock page with Supabase-backed queue.
- [ ] Inbound scale: save scale ticket number, gross weight, inbound user, inbound time, and audit log.
- [ ] Inbound scale: validate required ticket number, positive weight, duplicate ticket warning/block, and closed-receipt guard.
- [ ] Unload: persist unloading location, unloaded_by, unloaded_by_name, unloaded timestamp, and audit log.
- [ ] Unload: transition receipt to Pending Review after confirm.
- [ ] Outbound scale: replace mock page with Supabase-backed queue.
- [ ] Outbound scale: save tare/outbound weight, calculate net weight, and close/advance the workflow.
- [ ] History: verify it reads real data and supports useful filters.

### P3 - Security and Access Control

- [ ] Implement full role model: field_team, unload_team, inspector, inbound_scale, outbound_scale, accounting, purchasing, admin.
- [ ] Replace broad authenticated RLS with role-scoped policies.
- [ ] Verify no service-role key or AI key can reach client bundles.
- [ ] Enforce closed receipts cannot be modified except through a controlled reopen/admin path.
- [ ] Ensure manual adjustments require notes and audit logs.
- [ ] Verify storage signed URL access and private bucket behavior.

### P4 - Reports, Monitoring, and Ops

- [ ] Replace static reports with Supabase-backed daily/monthly summaries.
- [ ] Add grade summary, supplier report, Excel export, and dashboard data.
- [ ] Add monitoring for AI failures, n8n failures, upload failures, and migration status.
- [ ] Prepare backup/restore verification checklist.
- [ ] Prepare UAT checklist mapped to the core workflow.

## Acceptance Checklist

- [ ] All main routes render without runtime errors.
- [ ] Mobile workflow works at approximately 390px width.
- [ ] Desktop scale-room pages work at approximately 1366px width.
- [ ] A logged-in field user can create a receipt with 3 required images.
- [ ] Images upload to private storage and metadata is saved.
- [ ] AI analysis can run server-side without exposing keys.
- [ ] Inspector can review AI results and approve/reject with audit trail.
- [ ] Inbound scale, unload, outbound scale, and close-job transitions are persisted.
- [ ] RLS blocks unauthorized data access by role.
- [ ] Reports reflect real database data.
- [ ] Build, typecheck, and relevant tests pass.

## Next Best Action

Start with P0. The highest-leverage next step is to install dependencies, run typecheck/build, then fix encoding and naming/status mismatches before adding more workflow logic.
