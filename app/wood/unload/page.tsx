import { AppShell, BottomActionBar, FormPanel, ReceiptCard } from "@/components";
import { receipts } from "@/lib/mock-data";

export default function UnloadPage() {
  return (
    <AppShell title="ลงไม้" subtitle="บันทึกจุดลงไม้">
      <div className="space-y-4">
        <ReceiptCard receipt={receipts[1]} />
        <FormPanel title="ตำแหน่งลงไม้" fields={["ลานลงไม้", "กองไม้", "ผู้ควบคุม", "หมายเหตุ"]} />
      </div>
      <BottomActionBar primaryLabel="ยืนยันลงไม้" secondaryLabel="กลับ" />
    </AppShell>
  );
}
