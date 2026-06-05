# 30 RLS Policies Detail

## Objective
Define row level security policies for all core tables.

## Tables

- users
- suppliers
- wood_receipts
- receipt_images
- ai_results
- audit_logs

## Principles

- Deny by default.
- Least privilege access.
- Use authenticated role only.

## Staff

- Read active suppliers.
- Create receipts.
- Upload images.
- Read own operations.

## Admin

- Full read access.
- Manage suppliers.
- Review AI results.
- Access audit logs.

## Audit Logs

- Append only.
- Admin read only.
- No updates.
- No deletes.

## Security

- Separate service role operations.
- Prevent cross-user access.
- Verify RLS in testing.

## Future

- Role matrix
- Approval workflow
- Fine-grained permissions
