PR#1 UI Mockup Specification
Objective
Create the first working UI for WC Kaona.
Use mock data only.
No backend integration.
No Supabase.
No AI.
No n8n.
________________________________________
Stack
Next.js App Router
TypeScript
Tailwind CSS
________________________________________
Theme
Style
TimeMark + Future Forward
Primary
#F15A24
Secondary
#FF8C42
Background
#F8FAFC
Cards
White
Rounded
Soft shadow
Font
Prompt
________________________________________
Mobile Routes
Home
/
Menu
•	รับไม้ใหม่
•	งานรอตรวจ
•	ลงสินค้า
•	ประวัติวันนี้
•	สรุปเกรดวันนี้
________________________________________
New Receipt
/wood/new
Screen
Create receipt bill
Auto information
•	User
•	Date Time
•	GPS
Required images
1.	Truck Plate
2.	Moisture Meter
3.	Wood + PVC Reference
Bottom button
Save and Send AI
________________________________________
Review List
/wood/review
Display receipt cards.
Fields
receipt number
truck plate
AI grade
moisture
status
________________________________________
Review Detail
/wood/review/[id]
Image preview
AI result
Final grade
Review note
Buttons
Approve
Adjust
Reject
________________________________________
Unload
/wood/unload
Display pending unload jobs.
Button
Confirm Unload
________________________________________
History
/wood/history
Filters
Today
Approved
Closed
________________________________________
Reports
/wood/reports
KPI
Trips
Weight
Grade summary
Average moisture
________________________________________
Desktop Routes
Inbound Scale
/wood/inbound-scale
Fields
Scale ticket number
Gross weight
________________________________________
Outbound Scale
/wood/outbound-scale
Fields
Tare weight
Net weight
________________________________________
Admin
/wood/admin
Cards
Users
Roles
Grade Rules
Reopen Jobs
________________________________________
Components
AppShell
MobileHeader
MenuCard
ReceiptCard
StatusBadge
ImageCaptureCard
KpiCard
BottomActionBar
BackOfficeLayout
________________________________________
Mock Data
Receipt Example
receiptNo
WR-20260605-001
truckPlate
70-1234
aiGrade
B+
moisture
34.5
grossWeight
31250
status
Pending Review
confidence
92
________________________________________
Acceptance Criteria
Application runs with npm run dev.
All routes render.
Mobile pages work at 390px width.
Desktop pages work at 1366px width.
No API calls.
No database calls.
No secrets.
No AI integration.
