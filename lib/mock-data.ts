import { workflowStatuses, type ReceiptStatus } from "@/lib/receipt-status";

export type { ReceiptStatus };

export type Receipt = {
  id: string;
  receiptNo: string;
  truckPlate: string;
  status: ReceiptStatus;
  aiGrade: string;
  moisture: number;
  grossWeight: number;
  confidence: number;
  createdAt: string;
};

export const receipts: Receipt[] = [
  {
    id: "wr-001",
    receiptNo: "WR-20260605-001",
    truckPlate: "70-1234",
    status: "pending_review",
    aiGrade: "B+",
    moisture: 34.5,
    grossWeight: 31250,
    confidence: 92,
    createdAt: "วันนี้ 08:30",
  },
  {
    id: "wr-002",
    receiptNo: "WR-20260605-002",
    truckPlate: "81-4556",
    status: "pending_unload",
    aiGrade: "A",
    moisture: 29.8,
    grossWeight: 28600,
    confidence: 88,
    createdAt: "วันนี้ 09:15",
  },
  {
    id: "wr-003",
    receiptNo: "WR-20260605-003",
    truckPlate: "72-9988",
    status: "approved",
    aiGrade: "B",
    moisture: 36.2,
    grossWeight: 30100,
    confidence: 90,
    createdAt: "วันนี้ 10:05",
  },
];

export { workflowStatuses };
