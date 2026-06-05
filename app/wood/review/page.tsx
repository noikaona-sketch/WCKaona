import { AppShell } from "@/components/AppShell";
import { MobileHeader } from "@/components/MobileHeader";
import { ReceiptCard } from "@/components/ReceiptCard";
import { receipts } from "@/lib/mock-data";

export default function ReviewListPage() {
  return (
    <AppShell>
      <MobileHeader title="งานรอตรวจ" subtitle="Pending review jobs" backUrl="/" />
      <div className="space-y-4">
        {receipts.map((receipt) => <ReceiptCard key={receipt.id} receipt={receipt} href={`/wood/review/${receipt.id}`} />)}
      </div>
    </AppShell>
  );
}
