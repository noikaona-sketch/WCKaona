import type { SupabaseClient } from "@supabase/supabase-js";

export type RequiredReceiptImageId = "wood_load" | "moisture_meter" | "truck_plate";

export type ReceiptImageFiles = Record<RequiredReceiptImageId, File>;

const BUCKET_NAME = "wood-receipts";
const JPEG_MIME_TYPE = "image/jpeg";

const imageConfig: Record<RequiredReceiptImageId, { fileName: string; imageType: string }> = {
  wood_load: { fileName: "01_size.jpg", imageType: "size" },
  moisture_meter: { fileName: "02_moisture.jpg", imageType: "moisture" },
  truck_plate: { fileName: "03_license.jpg", imageType: "license" },
};

function buildReceiptImagePath(receiptId: string, imageId: RequiredReceiptImageId) {
  return `receipt/${receiptId}/${imageConfig[imageId].fileName}`;
}

function buildReceiptNo() {
  const timestamp = new Date().toISOString().replace(/[-:.TZ]/g, "").slice(0, 14);
  const randomId = globalThis.crypto?.randomUUID?.().slice(0, 8) ?? Math.random().toString(36).slice(2, 10);
  return `WR-${timestamp}-${randomId}`;
}

function validateJpegFiles(files: ReceiptImageFiles) {
  for (const imageId of Object.keys(imageConfig) as RequiredReceiptImageId[]) {
    if (files[imageId].type !== JPEG_MIME_TYPE) {
      throw new Error("รองรับเฉพาะไฟล์ JPEG สำหรับการอัปโหลดรอบนี้");
    }
  }
}

export async function createDraftWoodReceipt({
  supabase,
  supplierId,
}: {
  supabase: SupabaseClient;
  supplierId: string;
}) {
  const { data, error } = await supabase
    .from("wood_receipts")
    .insert({
      receipt_no: buildReceiptNo(),
      supplier_id: supplierId,
      status: "draft",
      received_at: new Date().toISOString(),
    })
    .select("id, receipt_no")
    .single();

  if (error) throw error;
  return data;
}

export async function uploadReceiptImages({
  supabase,
  receiptId,
  files,
}: {
  supabase: SupabaseClient;
  receiptId: string;
  files: ReceiptImageFiles;
}) {
  validateJpegFiles(files);

  const uploadedRows = [];

  for (const imageId of Object.keys(imageConfig) as RequiredReceiptImageId[]) {
    const file = files[imageId];
    const filePath = buildReceiptImagePath(receiptId, imageId);

    const { error: uploadError } = await supabase.storage
      .from(BUCKET_NAME)
      .upload(filePath, file, {
        contentType: JPEG_MIME_TYPE,
        upsert: true,
      });

    if (uploadError) throw uploadError;

    uploadedRows.push({
      wood_receipt_id: receiptId,
      image_type: imageConfig[imageId].imageType,
      file_path: filePath,
      file_name: imageConfig[imageId].fileName,
      mime_type: JPEG_MIME_TYPE,
      file_size_bytes: file.size,
      captured_at: new Date().toISOString(),
    });
  }

  const { data, error } = await supabase
    .from("receipt_images")
    .insert(uploadedRows)
    .select("id, image_type, file_path");

  if (error) throw error;

  return data;
}
