export type ReceiptStatus =
  | "Draft"
  | "Submitted"
  | "AI Processing"
  | "Pending Inbound Scale"
  | "Pending Unload"
  | "Pending Review"
  | "Approved"
  | "Pending Outbound Scale"
  | "Net Weight Completed"
  | "Closed"
  | "Rejected"
  | "Need Retake Photo"
  | "Need Scale Correction"
  | "Reopened";

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
    status: "Pending Review",
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
    status: "Pending Unload",
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
    status: "Approved",
    aiGrade: "B",
    moisture: 36.2,
    grossWeight: 30100,
    confidence: 90,
    createdAt: "วันนี้ 10:05",
  },
];

export const workflowStatuses: ReceiptStatus[] = [
  "Draft",
  "Submitted",
  "AI Processing",
  "Pending Inbound Scale",
  "Pending Unload",
  "Pending Review",
  "Approved",
  "Pending Outbound Scale",
  "Net Weight Completed",
  "Closed",
];
