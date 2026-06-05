# Development Roadmap
## Objective
Build WC Kaona as a complete wood receiving system with AI-assisted grading.
Development should proceed in small and reviewable phases.
---
# Phase 1
UI Mockup
Status
Current
Scope
* Route structure
* Mobile screens
* Desktop screens
* Mock data
* Theme
* Components
No
* Supabase
* AI
* n8n
---
# Phase 2
Supabase Foundation
Scope
Authentication
Profiles
Roles
RLS
Storage
Database migration
Tables
profiles
wood_receipts
wood_receipt_images
wood_scale_tickets
wood_unload_logs
wood_review_logs
wood_audit_logs
wood_grade_rules
---
# Phase 3
Image Upload
Scope
Capture images
Storage
File validation
GPS
Metadata
Required images
Truck Plate
Moisture Meter
Wood + PVC Reference
---
# Phase 4
AI Analysis
Scope
OCR
Truck Plate
Moisture Meter
Wood Image Analysis
Grade Recommendation
Confidence Score
AI JSON Result
n8n Workflow
---
# Phase 5
Operational Workflow
Inbound Scale
Unload Team
Inspector Review
Outbound Scale
Close Job
History
---
# Phase 6
Reports
Daily Report
Monthly Report
Grade Summary
Supplier Report
Excel Export
Dashboard
---
# Phase 7
Advanced Features
Supplier Quality Score
Species Recognition
Wood Defect Detection
Burnt Wood Detection
Automatic Alerts
Anomaly Detection
---
# Pull Request Strategy
Small PRs
One purpose per PR
Review before merge
Avoid large changes
---
# Security Rules
No AI keys in client.
No destructive migrations.
Require audit logs.
Use RLS.
Default deny.
---
# Merge Requirements
UI review
RLS review
Storage review
Migration review
File size review
Security review
---
# Project Principle
One Truck Visit = One Receipt Bill
Three Required Images
AI Assists
Inspector Decides
Everything Must Be Traceable
