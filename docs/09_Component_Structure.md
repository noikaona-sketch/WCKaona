Component Structure
Objective
Define shared UI components for WC Kaona.
All UI should be consistent, reusable, and mobile-first.
________________________________________
Components
AppShell
Main layout wrapper.
Used for
•	Mobile pages
•	Desktop pages
Contains
•	Header
•	Content area
•	Optional bottom action
________________________________________
MobileHeader
Top bar for mobile pages.
Props
title
subtitle
backUrl
rightAction
________________________________________
MenuCard
Main menu card.
Used on home page.
Props
icon
title
description
href
statusCount
________________________________________
ReceiptCard
Receipt summary card.
Used in
•	Review list
•	Unload list
•	History
Props
receiptNo
truckPlate
status
aiGrade
moisture
grossWeight
createdAt
href
________________________________________
StatusBadge
Display workflow status.
Statuses
Draft
Submitted
AI Processing
Pending Inbound Scale
Pending Unload
Pending Review
Approved
Pending Outbound Scale
Net Weight Completed
Closed
Rejected
Need Retake Photo
Need Scale Correction
Reopened
________________________________________
ImageCaptureCard
Image capture UI.
Used in new receipt screen.
Props
imageType
title
description
required
status
previewUrl
onCapture
________________________________________
KpiCard
Display summary values.
Used in reports.
Props
label
value
unit
tone
________________________________________
BottomActionBar
Fixed bottom action area.
Used for primary mobile actions.
Props
primaryLabel
primaryDisabled
secondaryLabel
________________________________________
BackOfficeLayout
Desktop layout.
Used for
•	Inbound scale
•	Outbound scale
•	Accounting
•	Purchasing
•	Admin
Contains
•	Sidebar
•	Header
•	Main content
________________________________________
Design Rules
Use large touch targets.
Minimum button height
48px
Card border radius
16px
Input height
44px
Use Thai labels.
Use status colors consistently.
Do not duplicate component logic.
________________________________________
File Structure
components/
AppShell.tsx
MobileHeader.tsx
MenuCard.tsx
ReceiptCard.tsx
StatusBadge.tsx
ImageCaptureCard.tsx
KpiCard.tsx
BottomActionBar.tsx
BackOfficeLayout.tsx
________________________________________
Future Components
ImagePreviewGrid
GradeSelector
AuditTimeline
ScaleTicketForm
ReportFilterBar
SupplierSummaryCard
