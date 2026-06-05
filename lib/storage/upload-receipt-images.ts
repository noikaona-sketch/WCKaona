import type { SupabaseClient } from "@supabase/supabase-js";

export type RequiredReceiptImageId = "wood_load" | "moisture_meter" | "truck_plate";

export type ReceiptImageFiles = Record<RequiredReceiptImageId, File>;

const BUCKET_NAME = "wood-receipts";

const imageConfig: Record<RequiredReceiptImageId, { fileName: string; imageType: string }> = {
  wood_load: { fileName: "01_size.jpg", imageType: "size" },
  moisture_meter: { fileName: "02_moisture.jpg", imageType: "moisture" },
  truck_plate: { fileName: "03_license.jpg", imageType: "license" },
};

function buildReceiptImagePath(receiptId: string, imageId: RequiredReceiptImageId) {
  return `receipt/${receiptId}/${imageConfig[imageId].fileName}`;
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
  const uploadedRows = [];

  for (const imageId of Object.keys(imageConfig) as RequiredReceiptImageId[]) {
    const file = files[imageId];
    const filePath = buildReceiptImagePath(receiptId, imageId);

    const { error: uploadError } = await supabase.storage
      .from(BUCKET_NAME)
      .upload(filePath, file, {
        contentType: file.type || "image/jpeg",
        upsert: true,
      });

    if (uploadError) throw uploadError;

    uploadedRows.push({
      wood_receipt_id: receiptId,
      image_type: imageConfig[imageId].imageType,
      file_path: filePath,
      file_name: imageConfig[imageId].fileName,
      mime_type: file.type || null,
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
