# Workflow
## Overview
1 Truck Visit = 1 Receipt Bill
ระบบเริ่มตั้งแต่รถเข้าโรงงาน จนถึงปิดงาน
---
# Flow
Field Team
↓
Create Receipt Bill
↓
Capture 3 Required Images
* Truck Plate
* Moisture Meter
* Wood + PVC Reference
↓
Submit
↓
AI Processing
↓
Inbound Scale
* Scale Ticket Number
* Gross Weight
↓
Unload Team
* Confirm Unloading
↓
Inspector Review
* Approve
* Adjust
* Reject
↓
Outbound Scale
* Outbound Weight
↓
Calculate Net Weight
↓
Close Job
↓
History and Reports
---
# Status
## Draft
สร้างบิลแล้ว แต่ยังถ่ายรูปไม่ครบ
---
## Submitted
ส่งข้อมูลแล้ว
---
## AI Processing
กำลังวิเคราะห์ภาพ
---
## Pending Inbound Scale
รอห้องชั่งขาเข้า
---
## Pending Unload
รอทีมลงสินค้า
---
## Pending Review
รอผู้ตรวจ
---
## Approved
ผู้ตรวจอนุมัติแล้ว
---
## Pending Outbound Scale
รอห้องชั่งขาออก
---
## Net Weight Completed
คำนวณน้ำหนักสุทธิแล้ว
---
## Closed
ปิดงานเรียบร้อย
---
# Exception Status
## Rejected
ผู้ตรวจไม่อนุมัติ
---
## Need Retake Photo
ต้องถ่ายภาพใหม่
---
## Need Scale Correction
ข้อมูลตราชั่งผิด
---
## Reopened
Admin เปิดงานกลับมาแก้ไข
---
# Rules
* 3 images are required before submit.
* AI keys must not exist in client code.
* Every action must record the authenticated user.
* Every manual adjustment requires a note.
* Closed jobs cannot be modified.
* Only Admin can reopen jobs.
