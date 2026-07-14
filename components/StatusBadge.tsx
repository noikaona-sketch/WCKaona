import { normalizeReceiptStatus, receiptStatusLabels, type ReceiptStatus } from "@/lib/receipt-status";

const toneByStatus: Record<ReceiptStatus, string> = {
  draft: "bg-slate-100 text-slate-700",
  submitted: "bg-blue-100 text-blue-700",
  ai_processing: "bg-yellow-100 text-yellow-800",
  pending_inbound_scale: "bg-amber-100 text-amber-800",
  pending_unload: "bg-orange-100 text-orange-800",
  pending_review: "bg-orange-100 text-orange-800",
  approved: "bg-green-100 text-green-700",
  pending_outbound_scale: "bg-amber-100 text-amber-800",
  net_weight_completed: "bg-emerald-100 text-emerald-700",
  closed: "bg-emerald-200 text-emerald-900",
  ai_failed: "bg-red-100 text-red-700",
  pending_manual_review: "bg-red-100 text-red-700",
  rejected: "bg-red-100 text-red-700",
  need_retake_photo: "bg-red-100 text-red-700",
  need_scale_correction: "bg-red-100 text-red-700",
  reopened: "bg-purple-100 text-purple-700",
};

export function StatusBadge({ status }: { status: string | null | undefined }) {
  const normalizedStatus = normalizeReceiptStatus(status);

  return (
    <span className={`rounded-full px-3 py-1 text-xs font-semibold ${toneByStatus[normalizedStatus]}`}>
      {receiptStatusLabels[normalizedStatus]}
    </span>
  );
}
