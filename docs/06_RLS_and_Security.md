# RLS and Security
## Objective
Protect data access using Supabase RLS.
Every action must be traceable.
---
# Authentication
Supabase Auth is the source of truth.
Users must log in before accessing the application.
---
# Roles
field_team
unload_team
inspector
inbound_scale
outbound_scale
accounting
purchasing
admin
---
# Access Matrix
## Field Team
Can
* Create receipt
* Upload images
* View own records
* View today's history
Cannot
* Review grade
* Modify scale information
* Reopen jobs
---
## Unload Team
Can
* View pending unload jobs
* Confirm unloading
Cannot
* Review grade
* Modify weights
---
## Inspector
Can
* View pending review jobs
* View images
* Approve
* Adjust
* Reject
* View daily reports
* View historical records
Cannot
* Modify scale data
* Change grade rules
---
## Inbound Scale
Can
* Input scale ticket number
* Input gross weight
Cannot
* Modify grades
---
## Outbound Scale
Can
* Input tare weight
* Calculate net weight
Cannot
* Modify grades
---
## Accounting
Read Only
Can
* View reports
* Export Excel
Cannot
* Modify records
---
## Purchasing
Read Only
Can
* View supplier reports
* View grade reports
Cannot
* Modify records
---
## Admin
Full Access
Can
* Manage users
* Manage roles
* Manage grade rules
* Reopen jobs
* Correct data
---
# Audit Log
Every change must be recorded.
Record
changed_by
action
old_value
new_value
changed_at
---
# Manual Adjustment Rules
Changing grades requires:
review_note
reviewed_by
reviewed_at
---
# Closed Jobs
Closed jobs cannot be modified.
Only Admin can reopen jobs.
---
# Storage Rules
Allowed image types
jpg
jpeg
png
webp
Maximum size
10 MB
---
# AI Security
Never expose AI keys to client code.
AI must run on server or n8n.
---
# RLS Principles
Users should only access the minimum required data.
Use auth.uid() and role checks.
Default deny.
Explicit allow.
---
# Backend Service Accounts
Service accounts are for automation only.
They must not be used by end users.
---
# Future Enhancements
Department-based access
Supplier-based access
Multi-site support
Advanced audit reports
