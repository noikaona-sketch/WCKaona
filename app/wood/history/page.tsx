import { AppShell } from "@/components/AppShell";
import { MobileHeader } from "@/components/MobileHeader";
import { ReceiptCard } from "@/components/ReceiptCard";
import { receipts } from "@/lib/mock-data";

const filters = ["Today", "Approved", "Closed"];

export default function HistoryPage() {
  return (
    <AppShell>
      <MobileHeader title="ประวัติวันนี้" subtitle="Daily history" backUrl="/" />
      <div className="mb-4 flex gap-2 overflow-x-auto">
        {filters.map((filter) => <button key={filter} className="h-11 rounded-full bg-white px-4 text-sm font-semibold text-slate-700 shadow-soft">{filter}</button>)}
      </div>
      <div className="space-y-4">
        {receipts.map((receipt) => <ReceiptCard key={receipt.id} receipt={receipt} href={`/wood/review/${receipt.id}`} />)}
      </div>
    </AppShell>
  );
}
