import { AppShell, ReceiptCard } from "@/components";
import { receipts } from "@/lib/mock-data";

export default function ReviewPage() {
  return (
    <AppShell title="ตรวจรับไม้" subtitle="รายการรอตรวจและผลตรวจ">
      <div className="space-y-3">
        {receipts.map((receipt) => <ReceiptCard key={receipt.id} receipt={receipt} href={`/wood/review/${receipt.id}`} />)}
      </div>
    </AppShell>
  );
}
