# 27 ER Diagram

## Core Tables

- suppliers
- wood_receipts
- receipt_images
- ai_results
- audit_logs
- users

## Relationships

- suppliers 1:N wood_receipts
- wood_receipts 1:N receipt_images
- wood_receipts 1:1 ai_results
- users 1:N wood_receipts
- users 1:N audit_logs

## Design Principles

- UUID primary keys
- Soft delete support
- Historical data retention
- RLS compatible

## Future

- report_cache
- notifications
- workflow_jobs
