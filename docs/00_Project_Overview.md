# WC Kaona
## ระบบรับไม้และจัดเกรดด้วย AI

## Objective
สร้างระบบรับไม้ครบวงจร รองรับมือถือและคอมพิวเตอร์ โดยใช้ AI ช่วยอ่านภาพและจัดเกรดไม้

## Core Concept
1 เที่ยวรถ = 1 บิลรับไม้

ต้องมีภาพบังคับ 3 ภาพ:
1. ทะเบียนรถ
2. เครื่องวัดความชื้น
3. ไม้บนรถ + PVC

## Users

### Mobile
- ทีมรับไม้
- ทีมลงสินค้า
- ผู้ตรวจ

### Web
- ห้องชั่งขาเข้า
- ห้องชั่งขาออก
- บัญชี
- จัดซื้อ
- Admin

## Workflow
Draft  
→ Submitted  
→ AI Processing  
→ Pending Inbound Scale  
→ Pending Unload  
→ Pending Review  
→ Approved  
→ Pending Outbound Scale  
→ Net Weight Completed  
→ Closed

## UI Theme
- Style: TimeMark + Future Forward
- Primary: #F15A24
- Secondary: #FF8C42
- Background: #F8FAFC
- Success: #16A34A
- Pending: #FACC15
- Danger: #DC2626
- Font: Prompt / Noto Sans Thai

## Phase 1
UI Mockup only

ยังไม่เชื่อม:
- Supabase
- AI
- n8n

## Phase 2
Supabase Auth + Profiles + Roles + RLS

## Phase 3
Image Upload + Storage

## Phase 4
AI วิเคราะห์ภาพ

## Phase 5
Workflow เต็ม

## Phase 6
Reports + Dashboard
