import { AppShell } from "@/components/AppShell";
import { KpiCard } from "@/components/KpiCard";
import { MobileHeader } from "@/components/MobileHeader";

export default function ReportsPage() {
  return (
    <AppShell>
      <MobileHeader title="สรุปเกรดวันนี้" subtitle="Daily summary" backUrl="/" />
      <section className="grid grid-cols-2 gap-3">
        <KpiCard label="Trips" value="12" />
        <KpiCard label="Weight" value="356.8" unit="ตัน" />
        <KpiCard label="A / B+" value="7" tone="success" />
        <KpiCard label="Average Moisture" value="33.4" unit="%" tone="warning" />
      </section>
      <section className="mt-4 rounded-2xl bg-white p-4 shadow-soft">
        <h2 className="font-bold">Grade summary</h2>
        {[["A+", 2], ["A", 3], ["B+", 4], ["B", 2], ["C", 1]].map(([grade, count]) => (
          <div key={grade} className="mt-3 flex items-center justify-between rounded-xl bg-slate-50 p-3"><span>{grade}</span><strong>{count} เที่ยว</strong></div>
        ))}
      </section>
    </AppShell>
  );
}
