import { BackOfficeLayout } from "@/components/BackOfficeLayout";
import { ReceiptCard } from "@/components/ReceiptCard";
import { receipts } from "@/lib/mock-data";

export default function InboundScalePage() {
  return (
    <BackOfficeLayout title="ห้องชั่งขาเข้า" subtitle="Ticket number and gross weight placeholder">
      <div className="grid gap-6 xl:grid-cols-[1fr_420px]">
        <form className="rounded-3xl bg-white p-6 shadow-soft">
          <label className="text-sm font-semibold text-slate-700" htmlFor="ticket">Scale ticket number</label>
          <input id="ticket" className="mt-2 h-12 w-full rounded-2xl border border-slate-200 px-4" placeholder="IN-20260605-001" />
          <label className="mt-4 block text-sm font-semibold text-slate-700" htmlFor="gross">Gross weight</label>
          <input id="gross" className="mt-2 h-12 w-full rounded-2xl border border-slate-200 px-4" placeholder="31,250 kg" />
          <button className="mt-6 h-12 rounded-2xl bg-brand-primary px-6 font-bold text-white">บันทึกน้ำหนักเข้า</button>
        </form>
        <ReceiptCard receipt={receipts[0]} />
      </div>
    </BackOfficeLayout>
  );
}
