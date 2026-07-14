export type ReceiptImageType = "truck_plate" | "moisture_meter" | "wood_with_pvc";
export type LegacyReceiptImageType = "license" | "moisture" | "size";

export const requiredReceiptImageTypes: ReceiptImageType[] = ["truck_plate", "moisture_meter", "wood_with_pvc"];
export const supportedReceiptImageTypes = [...requiredReceiptImageTypes, "license", "moisture", "size"] as const;

const legacyImageTypeMap: Record<LegacyReceiptImageType, ReceiptImageType> = {
  license: "truck_plate",
  moisture: "moisture_meter",
  size: "wood_with_pvc",
};

export const receiptImageLabels: Record<ReceiptImageType, string> = {
  truck_plate: "ทะเบียนรถ",
  moisture_meter: "เครื่องวัดความชื้น",
  wood_with_pvc: "ไม้บนรถ + PVC",
};

export function normalizeReceiptImageType(imageType: string): ReceiptImageType {
  if (imageType === "truck_plate" || imageType === "moisture_meter" || imageType === "wood_with_pvc") return imageType;
  if (imageType === "license" || imageType === "moisture" || imageType === "size") return legacyImageTypeMap[imageType];
  return "wood_with_pvc";
}

export function getReceiptImageLabel(imageType: string) {
  return receiptImageLabels[normalizeReceiptImageType(imageType)];
}

export function getReceiptImageSortIndex(imageType: string) {
  return requiredReceiptImageTypes.indexOf(normalizeReceiptImageType(imageType));
}

export function isHighDetailReceiptImage(imageType: string) {
  const normalizedType = normalizeReceiptImageType(imageType);
  return normalizedType === "truck_plate" || normalizedType === "moisture_meter";
}
