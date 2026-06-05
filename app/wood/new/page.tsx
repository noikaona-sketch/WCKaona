import { AppShell } from "@/components/AppShell";
import { BottomActionBar } from "@/components/BottomActionBar";
import { ImageCaptureCard } from "@/components/ImageCaptureCard";
import { MobileHeader } from "@/components/MobileHeader";

const requiredImages = [
  ["ทะเบียนรถ", "Truck Plate"],
  ["เครื่องวัดความชื้น", "Moisture Meter"],
  ["ไม้บนรถ + PVC", "Wood + PVC Reference"],
] as const;

export default function NewReceiptPage() {
  return (
    <AppShell bottomAction={<BottomActionBar primaryLabel="Save and Send AI" secondaryLabel="บันทึก Draft" primaryDisabled />}>
      <MobileHeader title="รับไม้ใหม่" subtitle="Create receipt bill" backUrl="/" />
      <section className="mb-4 grid gap-3 rounded-2xl bg-white p-4 text-sm shadow-soft">
        <div className="flex justify-between"><span className="text-slate-500">User</span><strong>ทีมรับไม้</strong></div>
        <div className="flex justify-between"><span className="text-slate-500">Date Time</span><strong>05 Jun 2026 08:30</strong></div>
        <div className="flex justify-between"><span className="text-slate-500">GPS</span><strong>รอตำแหน่ง</strong></div>
      </section>
      <div className="space-y-4">
        {requiredImages.map(([title, description]) => (
          <ImageCaptureCard key={title} title={title} description={description} required status="empty" />
        ))}
      </div>
    </AppShell>
  );
}
