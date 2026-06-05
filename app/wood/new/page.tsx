"use client";

import { useMemo, useState } from "react";
import { AppShell } from "@/components/AppShell";
import { BottomActionBar } from "@/components/BottomActionBar";
import { ImageCaptureCard } from "@/components/ImageCaptureCard";
import { MobileHeader } from "@/components/MobileHeader";
import { createBrowserSupabaseClient } from "@/lib/supabase/client";
import { uploadReceiptImages } from "@/lib/storage/upload-receipt-images";
import type { ReceiptImageFiles, RequiredReceiptImageId } from "@/lib/storage/upload-receipt-images";

const requiredImages: Array<{ id: RequiredReceiptImageId; title: string; description: string }> = [
  { id: "truck_plate", title: "ทะเบียนรถ", description: "Truck Plate" },
  { id: "moisture_meter", title: "เครื่องวัดความชื้น", description: "Moisture Meter" },
  { id: "wood_load", title: "ไม้บนรถ + PVC", description: "Wood + PVC Reference" },
];

export default function NewReceiptPage() {
  const [receiptId, setReceiptId] = useState("");
  const [readyImages, setReadyImages] = useState<Record<string, boolean>>({});
  const [imageFiles, setImageFiles] = useState<Partial<Record<RequiredReceiptImageId, File>>>({});
  const [isUploading, setIsUploading] = useState(false);
  const [uploadMessage, setUploadMessage] = useState("");
  const readyCount = useMemo(() => requiredImages.filter((image) => readyImages[image.id]).length, [readyImages]);
  const allImagesReady = readyCount === requiredImages.length;
  const canUpload = allImagesReady && Boolean(receiptId.trim()) && !isUploading;

  function handleReadyChange(id: string, ready: boolean) {
    setReadyImages((current) => ({ ...current, [id]: ready }));
  }

  function handleFileChange(id: string, file: File | null) {
    setImageFiles((current) => ({ ...current, [id]: file || undefined }));
  }

  async function handleUploadImages() {
    if (!canUpload) return;

    const files = requiredImages.reduce<Partial<ReceiptImageFiles>>((current, image) => {
      const file = imageFiles[image.id];
      if (file) current[image.id] = file;
      return current;
    }, {});

    if (!files.wood_load || !files.moisture_meter || !files.truck_plate) return;

    setIsUploading(true);
    setUploadMessage("");

    try {
      const supabase = createBrowserSupabaseClient();
      await uploadReceiptImages({
        supabase,
        receiptId: receiptId.trim(),
        files: files as ReceiptImageFiles,
      });
      setUploadMessage("อัปโหลดรูปและบันทึก receipt_images แล้ว");
    } catch (error) {
      setUploadMessage(error instanceof Error ? error.message : "อัปโหลดไม่สำเร็จ");
    } finally {
      setIsUploading(false);
    }
  }

  return (
    <AppShell
      bottomAction={
        <BottomActionBar
          primaryLabel="Upload Images"
          secondaryLabel="บันทึก Draft"
          primaryDisabled={!canUpload}
          primaryLoading={isUploading}
          onPrimaryClick={handleUploadImages}
        />
      }
    >
      <MobileHeader title="รับไม้ใหม่" subtitle="Create receipt bill" backUrl="/" />

      <section className="mb-4 grid gap-3 rounded-2xl border border-orange-100 bg-white p-4 text-sm shadow-soft">
        <label className="grid gap-2">
          <span className="font-semibold text-slate-500">Receipt ID</span>
          <input
            value={receiptId}
            onChange={(event) => setReceiptId(event.target.value)}
            placeholder="UUID ของ wood_receipts ที่สร้างแล้ว"
            className="h-12 rounded-2xl border border-slate-200 px-4 font-medium text-slate-900 outline-none focus:border-brand-primary"
          />
        </label>
        <div className="flex justify-between"><span className="text-slate-500">User</span><strong>ทีมรับไม้</strong></div>
        <div className="flex justify-between"><span className="text-slate-500">Date Time</span><strong>05 Jun 2026 08:30</strong></div>
        <div className="flex justify-between"><span className="text-slate-500">GPS</span><strong>รอตำแหน่ง</strong></div>
      </section>

      <section className="mb-4 rounded-2xl border border-orange-100 bg-white p-4 shadow-soft">
        <div className="mb-3 flex items-center justify-between gap-3">
          <div>
            <p className="text-xs font-black uppercase text-brand-primary">Required images</p>
            <h2 className="font-bold text-[#14213d]">รูปบังคับ {readyCount}/3</h2>
          </div>
          <span className={`rounded-full px-3 py-1 text-xs font-bold ${allImagesReady ? "bg-orange-50 text-[#14213d]" : "bg-slate-100 text-slate-500"}`}>
            {allImagesReady ? "พร้อมอัปโหลด" : "ยังไม่ครบ"}
          </span>
        </div>
        <div className="grid grid-cols-3 gap-2 text-center text-xs font-bold">
          {requiredImages.map((image) => (
            <span key={image.id} className={`rounded-xl px-2 py-2 ${readyImages[image.id] ? "bg-orange-50 text-[#14213d]" : "bg-slate-100 text-slate-500"}`}>
              {image.title}
            </span>
          ))}
        </div>
        {uploadMessage ? <p className="mt-3 rounded-xl bg-slate-100 px-3 py-2 text-sm font-medium text-slate-700">{uploadMessage}</p> : null}
      </section>

      <div className="space-y-4">
        {requiredImages.map((image) => (
          <ImageCaptureCard
            key={image.id}
            id={image.id}
            title={image.title}
            description={image.description}
            required
            onReadyChange={handleReadyChange}
            onFileChange={handleFileChange}
          />
        ))}
      </div>
    </AppShell>
  );
}
