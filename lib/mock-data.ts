export type ReceiptStatus = "approved" | "pending" | "rejected" | "draft";

export type Receipt = {
  id: string;
  code: string;
  supplier: string;
  truckPlate: string;
  woodType: string;
  grossWeight: number;
  netWeight: number;
  queue: string;
  status: ReceiptStatus;
  createdAt: string;
  images: number;
  reviewer: string;
};

export const receipts: Receipt[] = [
  {
    id: "R-2406-001",
    code: "ใบรับไม้ #001",
    supplier: "สวนป่าบ้านเหนือ",
    truckPlate: "กท 4821",
    woodType: "ไม้ยูคาลิปตัส",
    grossWeight: 18400,
    netWeight: 15320,
    queue: "Q-12",
    status: "pending",
    createdAt: "วันนี้ 08:42",
    images: 4,
    reviewer: "หัวหน้าลานไม้"
  },
  {
    id: "R-2406-002",
    code: "ใบรับไม้ #002",
    supplier: "กลุ่มเกษตรเขาช่อง",
    truckPlate: "ชบ 9102",
    woodType: "ไม้ยางพารา",
    grossWeight: 21980,
    netWeight: 17640,
    queue: "Q-13",
    status: "approved",
    createdAt: "วันนี้ 09:15",
    images: 6,
    reviewer: "ฝ่ายตรวจคุณภาพ"
  },
  {
    id: "R-2406-003",
    code: "ใบรับไม้ #003",
    supplier: "ไร่ชัยพัฒนา",
    truckPlate: "นคร 771",
    woodType: "ไม้เบญจพรรณ",
    grossWeight: 16220,
    netWeight: 12850,
    queue: "Q-14",
    status: "rejected",
    createdAt: "วันนี้ 10:05",
    images: 3,
    reviewer: "หัวหน้าลานไม้"
  }
];

export const kpis = [
  { label: "รถรอชั่ง", value: "12", helper: "คิววันนี้" },
  { label: "รอตรวจ", value: "8", helper: "ใบรับไม้" },
  { label: "รับเข้าแล้ว", value: "64.2t", helper: "น้ำหนักสุทธิ" }
];

export const menuItems = [
  { href: "/wood/new", title: "รับไม้ใหม่", description: "สร้างใบรับและถ่ายรูปไม้", icon: "🌲" },
  { href: "/wood/review", title: "ตรวจรับไม้", description: "อนุมัติหรือปฏิเสธรายการ", icon: "✅" },
  { href: "/wood/unload", title: "ลงไม้", description: "บันทึกจุดลงและสถานะงาน", icon: "🚛" },
  { href: "/wood/history", title: "ประวัติ", description: "ค้นหาใบรับย้อนหลัง", icon: "📋" },
  { href: "/wood/reports", title: "รายงาน", description: "สรุปปริมาณและสถานะ", icon: "📊" },
  { href: "/wood/inbound-scale", title: "ชั่งเข้า", description: "บันทึกน้ำหนักรถเข้า", icon: "⚖️" },
  { href: "/wood/outbound-scale", title: "ชั่งออก", description: "บันทึกน้ำหนักรถออก", icon: "🏁" },
  { href: "/wood/admin", title: "ผู้ดูแล", description: "ตั้งค่าข้อมูลจำลอง", icon: "🛠️" }
];
