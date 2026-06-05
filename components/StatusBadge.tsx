import type { ReceiptStatus } from "@/lib/mock-data";

const toneByStatus: Record<ReceiptStatus, string> = {
  Draft: "bg-slate-100 text-slate-700",
  Submitted: "bg-blue-100 text-blue-700",
  "AI Processing": "bg-yellow-100 text-yellow-800",
  "Pending Inbound Scale": "bg-amber-100 text-amber-800",
  "Pending Unload": "bg-orange-100 text-orange-800",
  "Pending Review": "bg-orange-100 text-orange-800",
  Approved: "bg-green-100 text-green-700",
  "Pending Outbound Scale": "bg-amber-100 text-amber-800",
  "Net Weight Completed": "bg-emerald-100 text-emerald-700",
  Closed: "bg-emerald-200 text-emerald-900",
  Rejected: "bg-red-100 text-red-700",
  "Need Retake Photo": "bg-red-100 text-red-700",
  "Need Scale Correction": "bg-red-100 text-red-700",
  Reopened: "bg-purple-100 text-purple-700",
};

export function StatusBadge({ status }: { status: ReceiptStatus }) {
  return <span className={`rounded-full px-3 py-1 text-xs font-semibold ${toneByStatus[status]}`}>{status}</span>;
}
