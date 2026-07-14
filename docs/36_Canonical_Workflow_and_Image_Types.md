# 36 Canonical Workflow and Image Types

Last updated: 2026-07-14

## Purpose

This document fixes the canonical machine values for receipt workflow status and required receipt image types. UI labels may be Thai or English, but database/API values should stay stable and machine-friendly.

## Canonical Receipt Status Values

Use these values in `wood_receipts.status`:

| Value | UI label | Meaning |
| --- | --- | --- |
| `draft` | Draft | Receipt exists but required images are not complete. |
| `submitted` | Submitted | Required data/images were submitted. |
| `ai_processing` | AI Processing | AI analysis is running or queued. |
| `pending_inbound_scale` | Pending Inbound Scale | Waiting for inbound scale ticket and gross weight. |
| `pending_unload` | Pending Unload | Waiting for unload team confirmation. |
| `pending_review` | Pending Review | Waiting for inspector decision. |
| `approved` | Approved | Inspector approved the receipt/grade. |
| `pending_outbound_scale` | Pending Outbound Scale | Waiting for outbound/tare weight. |
| `net_weight_completed` | Net Weight Completed | Net weight has been calculated. |
| `closed` | Closed | Workflow is complete and locked. |

## Canonical Exception Status Values

Use these values in `wood_receipts.status` when the normal flow is interrupted:

| Value | UI label | Meaning |
| --- | --- | --- |
| `ai_failed` | AI Failed | AI failed; manual review or retry is needed. |
| `pending_manual_review` | Pending Manual Review | Human review is required without reliable AI output. |
| `rejected` | Rejected | Inspector rejected the receipt. |
| `need_retake_photo` | Need Retake Photo | Required evidence image must be retaken. |
| `need_scale_correction` | Need Scale Correction | Scale data must be corrected. |
| `reopened` | Reopened | Admin reopened a previously closed job. |

## Review Decision Values

Use these values in `wood_receipts.review_status`:

| Value | Meaning |
| --- | --- |
| `pending` | Inspector decision not yet made. |
| `approved` | Inspector approved. |
| `rejected` | Inspector rejected. |

`review_status` is the inspector decision. `status` is the operational workflow state. They should not be used interchangeably.

## Canonical Required Image Types

Use these values in `receipt_images.image_type`:

| Value | UI label | Purpose |
| --- | --- | --- |
| `truck_plate` | Truck Plate / ทะเบียนรถ | OCR truck plate. |
| `moisture_meter` | Moisture Meter / เครื่องวัดความชื้น | OCR moisture reading. |
| `wood_with_pvc` | Wood + PVC Reference / ไม้บนรถ + PVC | Wood load analysis and size reference. |

## Storage Path

Use this canonical pattern for new uploads:

```text
receipt/{receipt_id}/{image_type}/{timestamp}.{ext}
```

Example:

```text
receipt/0f4c.../truck_plate/20260714193010.jpg
```

Current code still has older storage names such as `01_size.jpg`, `02_moisture.jpg`, `03_license.jpg` and older image types such as `size`, `moisture`, `license`. Migrate those deliberately in a follow-up so AI, preview UI, storage policies, and existing records stay compatible during the transition.

## Implementation Rule

- Database and API values should use canonical snake_case values.
- UI components should map canonical values to human labels.
- Avoid storing UI labels such as `Pending Review` as database state.
- Add compatibility mapping while old records may still contain legacy values.
- Do not change historical records without a migration plan and rollback path.
