import type { ReceiptStatus } from "@/lib/mock-data";

const statusMap: Record<ReceiptStatus, { label: string; className: string }> = {
  approved: { label: "อนุมัติแล้ว", className: "bg-primary-100 text-primary-800 ring-primary-600/20" },
  pending: { label: "รอตรวจ", className: "bg-orange-100 text-pending ring-orange-500/20" },
  rejected: { label: "ปฏิเสธ", className: "bg-red-100 text-reject ring-red-500/20" },
  draft: { label: "แบบร่าง", className: "bg-slate-100 text-slate-700 ring-slate-400/20" }
};

export function StatusBadge({ status }: { status: ReceiptStatus }) {
  const item = statusMap[status];
  return <span className={`inline-flex rounded-full px-3 py-1 text-sm font-semibold ring-1 ${item.className}`}>{item.label}</span>;
}
