# TODO - WC Kaona Progress Tracker

Last reviewed: 2026-07-14

## Current Snapshot

- Repository: `C:\Users\Misno\OneDrive - บริษัทก้าวหน้าอุตสาหกรรมอาหารสัตว์ จำกัด\Github\WCKaona`
- Branch: `main`
- Git status at review time: clean
- Stack found: Next.js App Router, TypeScript, Tailwind CSS, Supabase client/server, Supabase migrations
- Node dependencies: installed locally on 2026-07-14; `package-lock.json` created
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
- New receipt page can select supplier, capture optional GPS evidence, require 3 images, create a draft receipt, resize images to JPEG, upload to Supabase Storage, and insert image metadata.
- Review list loads pending/manual review receipts from Supabase.
- Review detail loads receipt, images, AI analysis, and can approve/reject through an API route.
- AI analysis server API exists and calls server-side provider logic.
- AI provider code supports OpenAI/Claude-style provider selection and stores structured results.
- n8n dispatch tracking fields and dispatch route/library exist.
- Admin status page exists for smoke-test visibility across receipt, AI, review, and n8n status.
- Inbound scale, unload, outbound scale, and reports now read/write real Supabase records for the core receipt workflow.

### Still Mock or Placeholder

- `/wood/admin` is still a placeholder for users, roles, grade rules, and reopen jobs.
- `components/ReceiptCard.tsx` still depends on `lib/mock-data.ts`, but current active workflow pages no longer import it.
- Full role-scoped admin screens are not implemented yet.

## Known Gaps and Risks

- Role-based access is incomplete. Current RLS is broad authenticated access, not the detailed roles from the spec.
- Workflow status transitions are inconsistent; canonical values are now documented in `docs/36_Canonical_Workflow_and_Image_Types.md`:
  - Specs use statuses like `Pending Inbound Scale`, `Pending Unload`, `Pending Review`, `Closed`.
  - Database default uses lowercase `draft`.
  - Some UI uses mock status strings.
- Storage naming differs from early PR docs:
  - Docs mention `receipt_no/image_type/timestamp.ext`.
  - Current implementation uses `receipt/{receipt_id}/01_size.jpg`, `02_moisture.jpg`, `03_license.jpg`.
- Image type naming differs from docs; canonical values are now documented in `docs/36_Canonical_Workflow_and_Image_Types.md`:
  - Docs mention `truck_plate`, `moisture_meter`, `wood_with_pvc`.
  - Current implementation stores `license`, `moisture`, `size`.
- Upload validation currently converts all images to JPEG and then only accepts JPEG, while docs allow jpg/jpeg/png/webp up to 10 MB.
- Review detail source has mojibake/garbled Thai strings in code, likely from encoding conversion. UI text should be audited and repaired.
- Baseline verification now passes: `npm run typecheck`, `npm run lint`, and `npm run build`.
- No automated test suite was found beyond package scripts.
- Supabase migrations are forward migrations only; reversibility was not verified.
- Audit coverage exists for AI, inbound scale, unload, review decision, and outbound scale. Full audit coverage still needs a focused verification pass.

## Priority TODO

### P0 - Stabilize Current Baseline

- [x] Install dependencies and run `npm run typecheck`.
- [x] Run `npm run build`.
- [x] Verify whether `npm run lint` works with Next.js 15 / ESLint 9 setup.
- [x] Audit Thai text encoding/mojibake in source files; no mojibake patterns found in current source scan.
- [x] Decide canonical workflow status values. See `docs/36_Canonical_Workflow_and_Image_Types.md`.
- [x] Decide canonical image type names. See `docs/36_Canonical_Workflow_and_Image_Types.md`.

- [x] Align workflow status values across active UI and APIs with canonical snake_case values.
- [x] Align image type values across active upload, AI analysis, preview UI, and review UI with canonical values.
- [ ] Backfill or compatibility-check existing legacy database records before production cutover.

### P1 - Complete Core Receipt Flow

- [x] New receipt: persist GPS latitude/longitude and captured timestamps as required by PR#3.
- [x] New receipt: after image upload, transition from draft/submitted into the next workflow state intentionally.
- [x] New receipt: trigger AI analysis or queue processing after the required image set is complete.
- [x] AI analysis: confirm normalized fields, warnings, errors, and audit logs are stored.
- [x] AI failure handling: mark active receipt as Pending Manual Review and preserve manual review path.
- [x] Review: verify approve/reject updates workflow status, final grade, notes, reviewer, and audit log.
- [ ] Review: add explicit Adjust / Need Retake Photo / manual correction path if still required.
- [ ] AI analysis: confirm raw provider JSON is preserved if required for audit/debugging.

### P2 - Operational Workflow

- [x] Inbound scale: replace mock page with Supabase-backed queue.
- [x] Inbound scale: save scale ticket number, gross weight, inbound user, inbound time, and audit log.
- [x] Inbound scale: validate required ticket number, positive weight, duplicate ticket block, and status guard.
- [x] Unload: persist unloading location, unloaded_by, unloaded_by_name, unloaded timestamp, and audit log.
- [x] Unload: transition receipt to Pending Review after confirm.
- [x] Outbound scale: replace mock page with Supabase-backed queue.
- [x] Outbound scale: save tare/outbound weight, calculate net weight, and close/advance the workflow.
- [x] History: verify it reads real data and supports useful filters.
- [ ] Add explicit duplicate ticket pre-check/warning before submit if needed for UX.

### P3 - Security and Access Control

- [ ] Implement full role model: field_team, unload_team, inspector, inbound_scale, outbound_scale, accounting, purchasing, admin.
- [ ] Replace broad authenticated RLS with role-scoped policies.
- [ ] Verify no service-role key or AI key can reach client bundles.
- [ ] Enforce closed receipts cannot be modified except through a controlled reopen/admin path.
- [ ] Ensure manual adjustments require notes and audit logs.
- [ ] Verify storage signed URL access and private bucket behavior.

### P4 - Reports, Monitoring, and Ops

- [x] Replace static reports with Supabase-backed daily summaries.
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

Next best action: replace `/wood/admin` placeholder with a real admin operations view for roles, workflow counts, failed AI/n8n monitoring, and reopen-readiness notes; then begin role-scoped RLS work.
