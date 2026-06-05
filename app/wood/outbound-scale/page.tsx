import { AppShell, BottomActionBar, FormPanel, ReceiptCard } from "@/components";
import { receipts } from "@/lib/mock-data";

export default function OutboundScalePage() {
  return (
    <AppShell title="ชั่งออก" subtitle="บันทึกน้ำหนักรถออกและสุทธิ">
      <div className="space-y-4">
        <ReceiptCard receipt={receipts[1]} />
        <FormPanel title="ข้อมูลชั่งออก" fields={["เลขตาชั่ง", "น้ำหนักรถออก", "น้ำหนักสุทธิ", "เวลาออก"]} />
      </div>
      <BottomActionBar primaryLabel="สรุปน้ำหนัก" secondaryLabel="กลับ" />
    </AppShell>
  );
}
