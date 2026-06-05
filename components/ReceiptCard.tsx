import Link from "next/link";
import type { Receipt } from "@/lib/mock-data";
import { StatusBadge } from "./StatusBadge";

export function ReceiptCard({ receipt, href }: { receipt: Receipt; href?: string }) {
  const content = (
    <article className="rounded-2xl bg-white p-4 shadow-soft">
      <div className="mb-3 flex items-start justify-between gap-3">
        <div>
          <p className="font-semibold text-slate-950">{receipt.receiptNo}</p>
          <p className="text-sm text-slate-500">ทะเบียน {receipt.truckPlate} · {receipt.createdAt}</p>
        </div>
        <StatusBadge status={receipt.status} />
      </div>
      <div className="grid grid-cols-3 gap-2 text-center text-sm">
        <div className="rounded-xl bg-slate-50 p-3"><p className="text-slate-500">AI Grade</p><p className="text-lg font-bold">{receipt.aiGrade}</p></div>
        <div className="rounded-xl bg-slate-50 p-3"><p className="text-slate-500">Moisture</p><p className="text-lg font-bold">{receipt.moisture}%</p></div>
        <div className="rounded-xl bg-slate-50 p-3"><p className="text-slate-500">Gross</p><p className="text-lg font-bold">{receipt.grossWeight.toLocaleString()}</p></div>
      </div>
    </article>
  );

  return href ? <Link href={href}>{content}</Link> : content;
}
