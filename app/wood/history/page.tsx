import { AppShell, ReceiptCard } from "@/components";
import { receipts } from "@/lib/mock-data";

export default function HistoryPage() {
  return (
    <AppShell title="ประวัติใบรับ" subtitle="ค้นหาและดูรายการย้อนหลัง">
      <div className="mb-4 rounded-3xl bg-white p-3 shadow-card ring-1 ring-primary-900/5">
        <div className="flex min-h-14 items-center rounded-2xl bg-slate-50 px-4 text-slate-400">ค้นหาเลขใบรับ / ทะเบียน / ผู้ส่งไม้</div>
      </div>
      <div className="space-y-3">{receipts.map((receipt) => <ReceiptCard key={receipt.id} receipt={receipt} href={`/wood/review/${receipt.id}`} />)}</div>
    </AppShell>
  );
}
