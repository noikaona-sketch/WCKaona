import type { SupabaseClient } from "@supabase/supabase-js";
import { getCurrentEmployeeName } from "@/lib/employee-profile";
import type { ReceiptImageType } from "@/lib/receipt-image-types";

export type RequiredReceiptImageId = "wood_load" | "moisture_meter" | "truck_plate";

export type ReceiptImageFiles = Record<RequiredReceiptImageId, File>;

const BUCKET_NAME = "wood-receipts";
const JPEG_MIME_TYPE = "image/jpeg";
const MAX_IMAGE_WIDTH = 1600;
const JPEG_QUALITY = 0.75;

const imageConfig: Record<RequiredReceiptImageId, { fileName: string; imageType: ReceiptImageType }> = {
  wood_load: { fileName: "01_size.jpg", imageType: "wood_with_pvc" },
  moisture_meter: { fileName: "02_moisture.jpg", imageType: "moisture_meter" },
  truck_plate: { fileName: "03_license.jpg", imageType: "truck_plate" },
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

async function loadImageSource(file: File): Promise<{ source: CanvasImageSource; width: number; height: number; close: () => void }> {
  if ("createImageBitmap" in globalThis) {
    const bitmap = await createImageBitmap(file);
    return {
      source: bitmap,
      width: bitmap.width,
      height: bitmap.height,
      close: () => bitmap.close(),
    };
  }

  const objectUrl = URL.createObjectURL(file);
  const image = await new Promise<HTMLImageElement>((resolve, reject) => {
    const element = new window.Image();
    element.onload = () => resolve(element);
    element.onerror = () => reject(new Error("โหลดรูปเพื่อบีบอัดไม่สำเร็จ"));
    element.src = objectUrl;
  });

  return {
    source: image,
    width: image.naturalWidth,
    height: image.naturalHeight,
    close: () => URL.revokeObjectURL(objectUrl),
  };
}

async function resizeImageToJpeg(file: File, imageId: RequiredReceiptImageId) {
  let loadedImage: Awaited<ReturnType<typeof loadImageSource>> | null = null;

  try {
    loadedImage = await loadImageSource(file);
    const scale = Math.min(1, MAX_IMAGE_WIDTH / loadedImage.width);
    const width = Math.max(1, Math.round(loadedImage.width * scale));
    const height = Math.max(1, Math.round(loadedImage.height * scale));
    const canvas = document.createElement("canvas");
    canvas.width = width;
    canvas.height = height;

    const context = canvas.getContext("2d");
    if (!context) throw new Error("เปิด canvas สำหรับบีบอัดรูปไม่สำเร็จ");

    context.drawImage(loadedImage.source, 0, 0, width, height);

    const blob = await new Promise<Blob | null>((resolve) => {
      canvas.toBlob(resolve, JPEG_MIME_TYPE, JPEG_QUALITY);
    });

    if (!blob) throw new Error("สร้างไฟล์ JPEG หลังบีบอัดไม่สำเร็จ");

    return new File([blob], imageConfig[imageId].fileName, {
      type: JPEG_MIME_TYPE,
      lastModified: Date.now(),
    });
  } catch (error) {
    const detail = error instanceof Error ? error.message : "ไม่ทราบสาเหตุ";
    throw new Error(`บีบอัดรูป ${imageConfig[imageId].imageType} ไม่สำเร็จ: ${detail}`);
  } finally {
    loadedImage?.close();
  }
}

async function resizeReceiptImages(files: ReceiptImageFiles): Promise<ReceiptImageFiles> {
  const resizedFiles = {} as ReceiptImageFiles;

  for (const imageId of Object.keys(imageConfig) as RequiredReceiptImageId[]) {
    resizedFiles[imageId] = await resizeImageToJpeg(files[imageId], imageId);
  }

  return resizedFiles;
}

export async function createDraftWoodReceipt({
  supabase,
  supplierId,
}: {
  supabase: SupabaseClient;
  supplierId: string;
}) {
  const employee = await getCurrentEmployeeName(supabase);
  const { data, error } = await supabase
    .from("wood_receipts")
    .insert({
      receipt_no: buildReceiptNo(),
      supplier_id: supplierId,
      status: "draft",
      received_at: new Date().toISOString(),
      created_by: employee.userId,
      created_by_name: employee.displayName || null,
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
  const uploadFiles = await resizeReceiptImages(files);
  validateJpegFiles(uploadFiles);

  const uploadedRows = [];

  for (const imageId of Object.keys(imageConfig) as RequiredReceiptImageId[]) {
    const file = uploadFiles[imageId];
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

  const { error: upsertError } = await supabase
    .from("receipt_images")
    .upsert(uploadedRows, {
      onConflict: "wood_receipt_id,image_type",
      ignoreDuplicates: true,
    });

  if (upsertError) throw upsertError;

  const imageTypes = uploadedRows.map((row) => row.image_type);
  const { data, error } = await supabase
    .from("receipt_images")
    .select("id, image_type, file_path")
    .eq("wood_receipt_id", receiptId)
    .in("image_type", imageTypes);

  if (error) throw error;

  return data;
}
