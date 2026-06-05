# 17 Storage Design

## Objective
Define how wood receipt images, AI outputs and related documents are stored securely and traceably.

## Storage Areas

- Receipt Images
- Moisture Images
- License Plate Images
- AI Result JSON
- Exported Reports
- Audit Attachments

## Bucket Design

Suggested buckets:

| Bucket | Purpose | Access |
|---|---|---|
| wood-receipts | Receipt and grading images | Private |
| ai-results | AI raw and normalized JSON | Private |
| reports | Generated report files | Private |
| audit-files | Evidence and audit attachments | Private |

## File Path Pattern

Use deterministic paths for traceability:

```text
/{year}/{month}/{receipt_id}/{image_type}/{file_id}.{ext}
```

Example:

```text
2026/06/wood_receipt_id/log_size/image_001.jpg
```

## Metadata

Each file should store or reference:

- receipt_id
- supplier_id
- image_type
- uploaded_by
- uploaded_at
- content_type
- file_size
- checksum
- ai_job_id

## Security Rules

- Buckets must be private by default.
- Use signed URLs for temporary access only.
- Do not expose raw storage paths to public users.
- Validate file type and file size before upload.
- Store checksum to detect duplicate or corrupted uploads.

## RLS and Access

- Staff can upload files for active receipts.
- Staff can read files linked to authorized receipts.
- Admin can read audit and AI files.
- Public access must remain disabled.

## Retention

- Keep receipt evidence for audit and dispute handling.
- Do not delete files when receipts are soft-deleted.
- Archive old files only after business retention rules are approved.

## Migration Notes

- Create storage buckets with private access.
- Add file reference table if multiple images per receipt are required.
- Add indexes on receipt_id and image_type.
- Add audit logs for upload, replace and delete actions.

## Future

- Image compression pipeline
- Malware scanning
- Duplicate detection
- Cold storage archive
- Storage usage dashboard
