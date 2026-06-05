import { AppShell } from "@/components/AppShell";
import { BottomActionBar } from "@/components/BottomActionBar";
import { MobileHeader } from "@/components/MobileHeader";
import { StatusBadge } from "@/components/StatusBadge";
import { receipts } from "@/lib/mock-data";

export default async function ReviewDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const receipt = receipts.find((item) => item.id === id) ?? receipts[0];

  return (
    <AppShell bottomAction={<BottomActionBar primaryLabel="Approve" secondaryLabel="Adjust" />}>
      <MobileHeader title="ตรวจงาน" subtitle={receipt.receiptNo} backUrl="/wood/review" rightAction={<StatusBadge status={receipt.status} />} />
      <section className="mb-4 grid grid-cols-3 gap-3">
        {["Truck Plate", "Moisture", "Wood + PVC"].map((label) => (
          <div key={label} className="flex aspect-square items-center justify-center rounded-2xl bg-white p-3 text-center text-sm font-semibold text-slate-500 shadow-soft">
            Image<br />{label}
          </div>
        ))}
      </section>
      <section className="mb-4 rounded-2xl bg-white p-4 shadow-soft">
        <h2 className="font-bold text-slate-950">AI Result</h2>
        <dl className="mt-3 grid grid-cols-2 gap-3 text-sm">
          <div><dt className="text-slate-500">ทะเบียน</dt><dd className="font-semibold">{receipt.truckPlate}</dd></div>
          <div><dt className="text-slate-500">Grade</dt><dd className="font-semibold">{receipt.aiGrade}</dd></div>
          <div><dt className="text-slate-500">Moisture</dt><dd className="font-semibold">{receipt.moisture}%</dd></div>
          <div><dt className="text-slate-500">Confidence</dt><dd className="font-semibold">{receipt.confidence}%</dd></div>
        </dl>
      </section>
      <section className="rounded-2xl bg-white p-4 shadow-soft">
        <label className="text-sm font-semibold text-slate-700" htmlFor="final-grade">Final Grade</label>
        <select id="final-grade" className="mt-2 h-12 w-full rounded-2xl border border-slate-200 bg-white px-4"><option>{receipt.aiGrade}</option><option>A</option><option>B</option><option>C</option></select>
        <label className="mt-4 block text-sm font-semibold text-slate-700" htmlFor="review-note">Review Note</label>
        <textarea id="review-note" rows={4} className="mt-2 w-full rounded-2xl border border-slate-200 p-4" placeholder="ระบุเหตุผลเมื่อ Adjust หรือ Reject" />
        <button className="mt-3 h-12 w-full rounded-2xl border border-brand-danger font-semibold text-brand-danger">Reject</button>
      </section>
    </AppShell>
  );
}
