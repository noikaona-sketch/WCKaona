# 20 Audit Model

## Objective
Provide traceability for all important actions in the system.

## Table

`audit_logs`

## Fields

- id
- event_time
- user_id
- role
- entity_type
- entity_id
- action
- old_value
- new_value
- ip_address
- user_agent
- request_id

## Audited Events

- Receipt creation
- Receipt update
- Supplier changes
- AI result update
- Manual override
- User login
- Permission changes
- Export actions
- File deletion

## Requirements

- Append-only records.
- No hard delete.
- Preserve historical values.
- Record manual changes separately.

## Security

- Admin only access.
- Restrict sensitive data.
- Mask secrets.
- Audit log access itself should be logged.

## Migration Notes

- Index event_time.
- Index entity_type and entity_id.
- Consider partitioning for large datasets.

## Future

- Dashboard
- Alerting
- Anomaly detection
- Compliance reporting
