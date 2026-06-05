PR#2 Supabase Foundation
Objective
Connect WC Kaona to Supabase.
Provide secure authentication, roles, storage, and database foundation.
________________________________________
Scope
Authentication
Profiles
Roles
RLS
Database Migration
Storage
________________________________________
Stack
Supabase Auth
Supabase Database
Supabase Storage
PostgreSQL
________________________________________
Tables
profiles
wood_receipts
wood_receipt_images
wood_scale_tickets
wood_unload_logs
wood_review_logs
wood_audit_logs
wood_grade_rules
________________________________________
Authentication
Supabase Auth is the source of truth.
All users must login.
No anonymous access.
________________________________________
Roles
field_team
unload_team
inspector
inbound_scale
outbound_scale
accounting
purchasing
admin
________________________________________
Profiles Table
Stores
full_name
department
role
status
created_at
updated_at
________________________________________
Storage
Bucket
wood-images
________________________________________
Folder Structure
receipt_no/
truck_plate/
moisture_meter/
wood_with_pvc/
unload/
________________________________________
File Rules
Allowed
jpg
jpeg
png
webp
Maximum Size
10 MB
________________________________________
Naming Convention
receipt_no/image_type/timestamp.ext
Example
WR-20260605-001/truck_plate/20260605130501.jpg
________________________________________
RLS Principles
Default deny
Explicit allow
Use auth.uid()
Role based access
________________________________________
Field Team
Can
Create receipts
Upload images
View own records
________________________________________
Inspector
Can
View review queue
Approve
Adjust
Reject
View reports
________________________________________
Accounting
Read only
________________________________________
Admin
Full access
________________________________________
Audit Requirements
Every action records
changed_by
action
old_value
new_value
changed_at
________________________________________
Security Rules
No AI keys in client.
No service role in browser.
Closed jobs cannot be modified.
Manual adjustments require notes.
________________________________________
Acceptance Criteria
Users can login.
Profiles are linked to auth users.
Storage uploads work.
RLS policies work.
No public access.
Migration scripts are reversible.
No destructive migration.

