# 28 Supabase Migration Plan

## Objective
Provide a safe migration sequence for database changes.

## Principles

- Small migrations
- Forward-only changes
- No manual production edits
- Review before deployment

## Order

1. users
2. suppliers
3. wood_receipts
4. receipt_images
5. ai_results
6. audit_logs

## Rules

- Add indexes after tables.
- Enable RLS after schema creation.
- Seed data after migrations.
- Backup before major changes.

## Safety

- Verify staging first.
- Avoid destructive changes.
- Preserve historical data.

## Future

- Migration validation
- Automatic rollback checks
- CI migration tests
