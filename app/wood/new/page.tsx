import { AppShell, BottomActionBar, FormPanel, ImageCaptureCard } from "@/components";

export default function NewWoodPage() {
  return (
    <AppShell title="รับไม้ใหม่" subtitle="สร้างใบรับไม้จำลอง">
      <div className="space-y-4">
        <FormPanel title="ข้อมูลรถและผู้ส่ง" fields={["ทะเบียนรถ", "ผู้ส่งไม้", "ชนิดไม้", "เลขคิว"]} />
        <ImageCaptureCard />
      </div>
      <BottomActionBar primaryLabel="บันทึกแบบร่าง" secondaryLabel="ยกเลิก" />
    </AppShell>
  );
}
