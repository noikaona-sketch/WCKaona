"use client";

import { useEffect, useMemo, useState } from "react";
import { AppShell } from "@/components/AppShell";
import { BottomActionBar } from "@/components/BottomActionBar";
import { ImageCaptureCard } from "@/components/ImageCaptureCard";
import { MobileHeader } from "@/components/MobileHeader";
import { getCurrentEmployeeName } from "@/lib/employee-profile";
import { createBrowserSupabaseClient } from "@/lib/supabase/client";
import { createDraftWoodReceipt, uploadReceiptImages } from "@/lib/storage/upload-receipt-images";
import type { ReceiptImageFiles, RequiredReceiptImageId } from "@/lib/storage/upload-receipt-images";

type SupplierOption = {
  id: string;
  name: string;
  supplier_code: string;
};

type AiAnalyzeResponse = {
  error?: string;
  receipt?: {
    status?: string;
  };
};

const requiredImages: Array<{ id: RequiredReceiptImageId; title: string; description: string }> = [
  { id: "truck_plate", title: "ทะเบียนรถ", description: "Truck Plate" },
  { id: "moisture_meter", title: "เครื่องวัดความชื้น", description: "Moisture Meter" },
  { id: "wood_load", title: "ไม้บนรถ + PVC", description: "Wood + PVC Reference" },
];

function collectReceiptFiles(imageFiles: Partial<Record<RequiredReceiptImageId, File>>): ReceiptImageFiles | null {
  const woodLoad = imageFiles.wood_load;
  const moistureMeter = imageFiles.moisture_meter;
  const truckPlate = imageFiles.truck_plate;

  if (!woodLoad || !moistureMeter || !truckPlate) return null;

  return {
    wood_load: woodLoad,
    moisture_meter: moistureMeter,
    truck_plate: truckPlate,
  };
}

export default function NewReceiptPage() {
  const [readyImages, setReadyImages] = useState<Record<string, boolean>>({});
  const [imageFiles, setImageFiles] = useState<Partial<Record<RequiredReceiptImageId, File>>>({});
  const [suppliers, setSuppliers] = useState<SupplierOption[]>([]);
  const [selectedSupplierId, setSelectedSupplierId] = useState("");
  const [employeeName, setEmployeeName] = useState("-");
  const [isLoadingSuppliers, setIsLoadingSuppliers] = useState(true);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadMessage, setUploadMessage] = useState("");
  const readyCount = useMemo(() => requiredImages.filter((image) => readyImages[image.id]).length, [readyImages]);
  const allImagesReady = readyCount === requiredImages.length;
  const canUpload = allImagesReady && Boolean(selectedSupplierId) && !isUploading && !isLoadingSuppliers;

  useEffect(() => {
    let isMounted = true;

    async function loadSuppliers() {
      setIsLoadingSuppliers(true);
      setUploadMessage("");

      try {
        const supabase = createBrowserSupabaseClient();
        const { data: sessionData, error: sessionError } = await supabase.auth.getSession();

        if (sessionError) throw sessionError;
        if (!sessionData.session) {
          if (isMounted) setUploadMessage("กรุณาเข้าสู่ระบบก่อนอัปโหลดรูป");
          return;
        }

        const [employeeResult, supplierResult] = await Promise.all([
          getCurrentEmployeeName(supabase),
          supabase.from("suppliers").select("id, name, supplier_code").order("name", { ascending: true }),
        ]);

        if (supplierResult.error) throw supplierResult.error;

        if (isMounted) {
          const supplierOptions = supplierResult.data ?? [];
          setEmployeeName(employeeResult.displayName || "-");
          setSuppliers(supplierOptions);
          setSelectedSupplierId((current) => current || supplierOptions[0]?.id || "");
          if (supplierOptions.length === 0) setUploadMessage("ยังไม่มี supplier สำหรับสร้าง draft receipt");
        }
      } catch (error) {
        if (isMounted) setUploadMessage(error instanceof Error ? error.message : "โหลด supplier ไม่สำเร็จ");
      } finally {
        if (isMounted) setIsLoadingSuppliers(false);
      }
    }

    loadSuppliers();

    return () => {
      isMounted = false;
    };
  }, []);

  function handleReadyChange(id: string, ready: boolean) {
    setReadyImages((current) => ({ ...current, [id]: ready }));
  }

  function handleFileChange(id: string, file: File | null) {
    setImageFiles((current) => ({ ...current, [id]: file || undefined }));
  }

  async function handleUploadImages() {
    if (!canUpload) return;

    const files = collectReceiptFiles(imageFiles);
    if (!files) return;

    setIsUploading(true);
    setUploadMessage("");

    try {
      const supabase = createBrowserSupabaseClient();
      const { data: sessionData, error: sessionError } = await supabase.auth.getSession();

      if (sessionError) throw sessionError;
      if (!sessionData.session) throw new Error("กรุณาเข้าสู่ระบบก่อนอัปโหลดรูป");

      const receipt = await createDraftWoodReceipt({
        supabase,
        supplierId: selectedSupplierId,
      });

      await uploadReceiptImages({
        supabase,
        receiptId: receipt.id,
        files,
      });

      const aiResponse = await fetch("/api/ai/analyze-receipt", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${sessionData.session.access_token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ receiptId: receipt.id }),
      });
      const aiResponseBody = (await aiResponse.json()) as AiAnalyzeResponse;

      if (!aiResponse.ok) {
        setUploadMessage(`สร้าง receipt ${receipt.receipt_no} และบันทึกรูปครบแล้ว แต่ AI ไม่สำเร็จ: ${aiResponseBody.error || "ส่งตรวจ manual review"}`);
        return;
      }

      setUploadMessage(`สร้าง receipt ${receipt.receipt_no}, วิเคราะห์ AI แล้ว และส่งต่อห้องชั่งขาเข้า`);
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
          <span className="font-semibold text-slate-500">Supplier</span>
          <select
            value={selectedSupplierId}
            onChange={(event) => setSelectedSupplierId(event.target.value)}
            disabled={isLoadingSuppliers || suppliers.length === 0}
            className="h-12 rounded-2xl border border-slate-200 bg-white px-4 font-medium text-slate-900 outline-none focus:border-brand-primary disabled:bg-slate-100 disabled:text-slate-400"
          >
            {suppliers.length === 0 ? <option value="">ไม่มี supplier</option> : null}
            {suppliers.map((supplier) => (
              <option key={supplier.id} value={supplier.id}>
                {supplier.name} ({supplier.supplier_code})
              </option>
            ))}
          </select>
        </label>
        <div className="flex justify-between"><span className="text-slate-500">Receipt</span><strong>สร้างอัตโนมัติ</strong></div>
        <div className="flex justify-between"><span className="text-slate-500">Employee</span><strong>{employeeName}</strong></div>
        <div className="flex justify-between"><span className="text-slate-500">Date Time</span><strong>{new Date().toLocaleString("th-TH")}</strong></div>
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
