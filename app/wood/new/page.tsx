"use client";

import { useMemo, useState } from "react";
import { AppShell } from "@/components/AppShell";
import { BottomActionBar } from "@/components/BottomActionBar";
import { ImageCaptureCard } from "@/components/ImageCaptureCard";
import { MobileHeader } from "@/components/MobileHeader";

const requiredImages = [
  { id: "truck_plate", title: "ทะเบียนรถ", description: "Truck Plate" },
  { id: "moisture_meter", title: "เครื่องวัดความชื้น", description: "Moisture Meter" },
  { id: "wood_load", title: "ไม้บนรถ + PVC", description: "Wood + PVC Reference" },
] as const;

export default function NewReceiptPage() {
  const [readyImages, setReadyImages] = useState<Record<string, boolean>>({});
  const readyCount = useMemo(() => requiredImages.filter((image) => readyImages[image.id]).length, [readyImages]);
  const allImagesReady = readyCount === requiredImages.length;

  function handleReadyChange(id: string, ready: boolean) {
    setReadyImages((current) => ({ ...current, [id]: ready }));
  }

  return (
    <AppShell bottomAction={<BottomActionBar primaryLabel="Save and Send AI" secondaryLabel="บันทึก Draft" primaryDisabled={!allImagesReady} />}>
      <MobileHeader title="รับไม้ใหม่" subtitle="Create receipt bill" backUrl="/" />

      <section className="mb-4 grid gap-3 rounded-2xl border border-orange-100 bg-white p-4 text-sm shadow-soft">
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
            {allImagesReady ? "พร้อมส่ง AI" : "ยังไม่ครบ"}
          </span>
        </div>
        <div className="grid grid-cols-3 gap-2 text-center text-xs font-bold">
          {requiredImages.map((image) => (
            <span key={image.id} className={`rounded-xl px-2 py-2 ${readyImages[image.id] ? "bg-orange-50 text-[#14213d]" : "bg-slate-100 text-slate-500"}`}>
              {image.title}
            </span>
          ))}
        </div>
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
          />
        ))}
      </div>
    </AppShell>
  );
}
