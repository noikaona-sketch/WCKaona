# 15 Supplier Model

## Objective
Store supplier information for wood receipts and support future quality analysis.

## Table: suppliers

Suggested fields:

| Field | Type | Notes |
|---|---|---|
| id | uuid | Primary key |
| supplier_code | text | Unique readable code |
| name | text | Required |
| contact_name | text | Optional |
| phone | text | Optional, avoid duplicate identity use |
| address | text | Optional |
| tax_id | text | Optional, restrict access |
| status | text | active, suspended, blacklisted |
| preferred_flag | boolean | Future supplier ranking |
| notes | text | Internal note |
| created_at | timestamptz | Default now() |
| updated_at | timestamptz | Default now() |
| deleted_at | timestamptz | Soft delete only |
| created_by | uuid | Audit user/member |
| updated_by | uuid | Audit user/member |

## Relationship

- `suppliers.id` 1:N `wood_receipts.supplier_id`
- `wood_receipts.supplier_id` should be nullable only if legacy receipts or emergency receiving is required.

## Metrics

Supplier quality metrics should be calculated from receipts, not stored as editable master data.

- Total Trips
- Total Net Weight
- Average Moisture
- Grade Distribution
- Rejected Count
- Quality Score

## Business Rules

- Use soft delete with `deleted_at`.
- Keep historical data for all receipts.
- Do not hard delete a supplier when receipts exist.
- Do not allow supplier code reuse after soft delete.
- Blacklisted suppliers must not be selectable for new receipts unless admin override is logged.

## RLS and Security

- Staff can read active suppliers.
- Admin can create and update suppliers.
- Sensitive fields such as tax ID should be restricted to admin/accounting roles.
- Soft-deleted suppliers should be hidden from normal selection lists.
- All changes should write audit logs.

## Migration Notes

- Add `supplier_id` index on `wood_receipts`.
- Add partial index for active suppliers: `deleted_at is null`.
- Add status check constraint.
- Add delete guard trigger to block hard delete when receipts exist.

## Future

- Supplier Ranking
- Preferred Supplier
- Black List
- Supplier Dashboard
