# Database Design
## Database
Supabase PostgreSQL
---
# profiles
Stores user information and roles.
Fields
id
auth_user_id
full_name
role
department
status
created_at
updated_at
---
# wood_receipts
Main receipt bill.
Fields
id
receipt_no
status
truck_plate_ai
truck_plate_manual
supplier_id
ai_grade
final_grade
ai_confidence
review_note
created_by
reviewed_by
closed_by
created_at
reviewed_at
closed_at
---
# wood_receipt_images
Stores image metadata.
Fields
id
receipt_id
image_type
file_path
file_url
taken_by
taken_at
gps_lat
gps_lng
ai_result_json
---
Image Types
truck_plate
moisture_meter
wood_with_pvc
unload_photo
---
# wood_scale_tickets
Stores weight information.
Fields
id
receipt_id
scale_ticket_no
gross_weight
tare_weight
net_weight
inbound_time
outbound_time
inbound_by
outbound_by
---
# wood_unload_logs
Unload confirmation.
Fields
id
receipt_id
unload_status
unload_note
photo_url
unload_by
unload_at
---
# wood_review_logs
Review history.
Fields
id
receipt_id
ai_grade
final_grade
review_note
action
reviewed_by
reviewed_at
---
Actions
approve
adjust
reject
---
# wood_audit_logs
Audit trail.
Fields
id
receipt_id
action
old_value
new_value
changed_by
changed_at
---
# wood_grade_rules
Grade settings.
Fields
id
grade_name
description
is_active
created_at
updated_at
---
# Relationships
wood_receipts
1:N
wood_receipt_images
---
wood_receipts
1:1
wood_scale_tickets
---
wood_receipts
1:N
wood_review_logs
---
wood_receipts
1:N
wood_audit_logs
---
wood_receipts
1:N
wood_unload_logs
---
# Naming Convention
snake_case
UUID primary keys
created_at
updated_at
Soft delete preferred
---
# Rules
One truck visit = one receipt bill.
Three required images:
1. truck_plate
2. moisture_meter
3. wood_with_pvc
Closed jobs cannot be modified.
All changes must be recorded in audit logs.
