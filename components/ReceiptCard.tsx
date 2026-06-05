import Link from "next/link";
import type { Receipt } from "@/lib/mock-data";
import { StatusBadge } from "./StatusBadge";

export function ReceiptCard({ receipt, href }: { receipt: Receipt; href?: string }) {
  const content = (
    <article className="rounded-3xl bg-white p-4 shadow-card ring-1 ring-primary-900/5">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-sm font-semibold text-slate-500">{receipt.queue}</p>
          <h3 className="mt-1 text-lg font-bold text-primary-900">{receipt.code}</h3>
        </div>
        <StatusBadge status={receipt.status} />
      </div>
      <div className="mt-4 grid grid-cols-2 gap-3 text-sm">
        <Info label="ผู้ส่งไม้" value={receipt.supplier} />
        <Info label="ทะเบียน" value={receipt.truckPlate} />
        <Info label="ชนิดไม้" value={receipt.woodType} />
        <Info label="สุทธิ" value={`${receipt.netWeight.toLocaleString("th-TH")} กก.`} />
      </div>
      <div className="mt-4 flex items-center justify-between border-t border-slate-100 pt-3 text-sm text-slate-500">
        <span>{receipt.createdAt}</span>
        <span>{receipt.images} รูปภาพ</span>
      </div>
    </article>
  );

  return href ? <Link href={href} className="block active:scale-[0.99]">{content}</Link> : content;
}

function Info({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-slate-400">{label}</p>
      <p className="mt-1 font-semibold text-slate-800">{value}</p>
    </div>
  );
}
