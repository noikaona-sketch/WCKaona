import { AppShell, BottomActionBar, FormPanel, ReceiptCard } from "@/components";
import { receipts } from "@/lib/mock-data";

export default function InboundScalePage() {
  return (
    <AppShell title="ชั่งเข้า" subtitle="บันทึกน้ำหนักรถเข้า">
      <div className="space-y-4">
        <ReceiptCard receipt={receipts[0]} />
        <FormPanel title="ข้อมูลชั่งเข้า" fields={["เลขตาชั่ง", "น้ำหนักรถเข้า", "เวลาเข้า", "เจ้าหน้าที่"]} />
      </div>
      <BottomActionBar primaryLabel="บันทึกชั่งเข้า" secondaryLabel="พักคิว" />
    </AppShell>
  );
}
