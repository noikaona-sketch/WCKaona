import { BackOfficeLayout } from "@/components/BackOfficeLayout";
import { ReceiptCard } from "@/components/ReceiptCard";
import { receipts } from "@/lib/mock-data";

export default function OutboundScalePage() {
  return (
    <BackOfficeLayout title="ห้องชั่งขาออก" subtitle="Tare weight and net weight placeholder">
      <div className="grid gap-6 xl:grid-cols-[1fr_420px]">
        <form className="rounded-3xl bg-white p-6 shadow-soft">
          <label className="text-sm font-semibold text-slate-700" htmlFor="tare">Tare weight</label>
          <input id="tare" className="mt-2 h-12 w-full rounded-2xl border border-slate-200 px-4" placeholder="10,200 kg" />
          <label className="mt-4 block text-sm font-semibold text-slate-700" htmlFor="net">Net weight</label>
          <input id="net" className="mt-2 h-12 w-full rounded-2xl border border-slate-200 px-4" placeholder="21,050 kg" />
          <button className="mt-6 h-12 rounded-2xl bg-brand-primary px-6 font-bold text-white">คำนวณและปิดน้ำหนัก</button>
        </form>
        <ReceiptCard receipt={receipts[2]} />
      </div>
    </BackOfficeLayout>
  );
}
