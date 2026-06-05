# PR#5 Inbound Scale

## Objective

Implement inbound scale room workflow for wood receiving receipts.

The inbound scale room attaches the official scale ticket number and gross weight to a receipt bill.

## Scope

- Display receipts waiting for inbound scale
- Search by receipt number or truck plate
- Input scale ticket number
- Input gross weight
- Record inbound scale user and timestamp
- Move workflow to next status

## Route

/wood/inbound-scale

## Target Users

- inbound_scale
- admin

Read-only access:

- accounting
- purchasing
- inspector

## Required Fields

- receipt_id
- scale_ticket_no
- gross_weight
- inbound_time
- inbound_by

## UI Requirements

Desktop-first page.

Table columns:

- Receipt No
- Truck Plate
- Created Time
- AI Grade
- Scale Ticket No
- Gross Weight
- Status
- Action

## Workflow

Pending Inbound Scale

-> Save inbound ticket and gross weight

-> Pending Unload

## Validation

- scale_ticket_no is required
- gross_weight must be greater than 0
- receipt must not be Closed
- duplicate scale_ticket_no should be blocked or warned

## Security Rules

- Only inbound_scale and admin can update inbound scale data
- Inspector, accounting, purchasing can view only
- All changes must be logged to wood_audit_logs

## Acceptance Criteria

- Inbound scale user can update ticket number and gross weight
- System records inbound_by and inbound_time
- Status changes to Pending Unload after save
- Invalid weight is rejected
- Closed receipt cannot be edited
- Audit log is created
