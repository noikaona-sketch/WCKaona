export type ReceiptStatus =
  | "draft"
  | "submitted"
  | "ai_processing"
  | "pending_inbound_scale"
  | "pending_unload"
  | "pending_review"
  | "approved"
  | "pending_outbound_scale"
  | "net_weight_completed"
  | "closed"
  | "ai_failed"
  | "pending_manual_review"
  | "rejected"
  | "need_retake_photo"
  | "need_scale_correction"
  | "reopened";

const legacyStatusMap: Record<string, ReceiptStatus> = {
  Draft: "draft",
  Submitted: "submitted",
  "AI Processing": "ai_processing",
  "Pending Inbound Scale": "pending_inbound_scale",
  "Pending Unload": "pending_unload",
  "Pending Review": "pending_review",
  Approved: "approved",
  "Pending Outbound Scale": "pending_outbound_scale",
  "Net Weight Completed": "net_weight_completed",
  Closed: "closed",
  "AI Failed": "ai_failed",
  "Pending Manual Review": "pending_manual_review",
  Rejected: "rejected",
  "Need Retake Photo": "need_retake_photo",
  "Need Scale Correction": "need_scale_correction",
  Reopened: "reopened",
};

export const receiptStatusLabels: Record<ReceiptStatus, string> = {
  draft: "Draft",
  submitted: "Submitted",
  ai_processing: "AI Processing",
  pending_inbound_scale: "Pending Inbound Scale",
  pending_unload: "Pending Unload",
  pending_review: "Pending Review",
  approved: "Approved",
  pending_outbound_scale: "Pending Outbound Scale",
  net_weight_completed: "Net Weight Completed",
  closed: "Closed",
  ai_failed: "AI Failed",
  pending_manual_review: "Pending Manual Review",
  rejected: "Rejected",
  need_retake_photo: "Need Retake Photo",
  need_scale_correction: "Need Scale Correction",
  reopened: "Reopened",
};

export const workflowStatuses: ReceiptStatus[] = [
  "draft",
  "submitted",
  "ai_processing",
  "pending_inbound_scale",
  "pending_unload",
  "pending_review",
  "approved",
  "pending_outbound_scale",
  "net_weight_completed",
  "closed",
];

export function normalizeReceiptStatus(status: string | null | undefined): ReceiptStatus {
  if (!status) return "draft";
  if (status in receiptStatusLabels) return status as ReceiptStatus;
  return legacyStatusMap[status] ?? "draft";
}

export function getReceiptStatusLabel(status: string | null | undefined) {
  return receiptStatusLabels[normalizeReceiptStatus(status)];
}
