import { AppShell, KpiCard, ReceiptCard } from "@/components";
import { kpis, receipts } from "@/lib/mock-data";

export default function ReportsPage() {
  return (
    <AppShell title="รายงาน" subtitle="สรุปข้อมูลจำลองประจำวัน">
      <section className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        {kpis.map((item) => <KpiCard key={item.label} {...item} />)}
      </section>
      <section className="mt-5 rounded-3xl bg-white p-4 shadow-card ring-1 ring-primary-900/5">
        <h2 className="text-lg font-bold text-primary-900">สถานะใบรับ</h2>
        <div className="mt-4 space-y-3">
          {["อนุมัติแล้ว 1 รายการ", "รอตรวจ 1 รายการ", "ปฏิเสธ 1 รายการ"].map((item) => (
            <div key={item} className="flex min-h-12 items-center justify-between rounded-2xl bg-slate-50 px-4 font-semibold">
              <span>{item}</span><span className="text-primary-700">ดู</span>
            </div>
          ))}
        </div>
      </section>
      <section className="mt-5 space-y-3">
        {receipts.map((receipt) => <ReceiptCard key={receipt.id} receipt={receipt} />)}
      </section>
    </AppShell>
  );
}
