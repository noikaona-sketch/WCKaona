"use client";

import { useEffect, useState } from "react";
import { AppShell } from "@/components/AppShell";
import { MobileHeader } from "@/components/MobileHeader";
import { ReceiptImagePreviewCards } from "@/components/ReceiptImagePreviewCards";
import type { ReceiptPreviewImage } from "@/components/ReceiptImagePreviewCards";
import { StatusBadge } from "@/components/StatusBadge";
import { createBrowserSupabaseClient } from "@/lib/supabase/client";

const presetLocations = ["ลานรับไม้", "โกดัง A", "โกดัง B", "จุดรอตรวจ", "อื่น ๆ"];

type UnloadReceipt = {
  id: string;
  receipt_no: string;
  truck_plate: string | null;
  status: string;
  inbound_weight_kg: number | null;
  moisture_percent: number | null;
  received_at: string | null;
  receipt_images: ReceiptPreviewImage[] | null;
};

function formatNumber(value: number | null) {
  return value === null ? "-" : value.toLocaleString();
}

function formatDate(value: string | null) {
  return value ? new Date(value).toLocaleString("th-TH") : "-";
}

export default function UnloadPage() {
  const [pendingReceipts, setPendingReceipts] = useState<UnloadReceipt[]>([]);
  const [selectedLocations, setSelectedLocations] = useState<Record<string, string>>({});
  const [customLocations, setCustomLocations] = useState<Record<string, string>>({});
  const [confirmedLocations, setConfirmedLocations] = useState<Record<string, string>>({});
  const [message, setMessage] = useState("กำลังโหลดงานรอลงสินค้า");

  useEffect(() => {
    let isMounted = true;

    async function loadPendingUnload() {
      try {
        const supabase = createBrowserSupabaseClient();
        const { data: sessionData, error: sessionError } = await supabase.auth.getSession();

        if (sessionError) throw sessionError;
        if (!sessionData.session) {
          if (isMounted) setMessage("กรุณาเข้าสู่ระบบก่อนดูงานลงสินค้า");
          return;
        }

        const { data, error } = await supabase
          .from("wood_receipts")
          .select("id, receipt_no, truck_plate, status, inbound_weight_kg, moisture_percent, received_at, receipt_images(image_type, file_path, file_name)")
          .is("deleted_at", null)
          .eq("status", "Pending Unload")
          .order("created_at", { ascending: false })
          .limit(20);

        if (error) throw error;

        if (isMounted) {
          setPendingReceipts((data ?? []) as UnloadReceipt[]);
          setMessage(data?.length ? "" : "ยังไม่มีงานรอลงสินค้า");
        }
      } catch (error) {
        if (isMounted) setMessage(error instanceof Error ? error.message : "โหลดงานลงสินค้าไม่สำเร็จ");
      }
    }

    loadPendingUnload();

    return () => {
      isMounted = false;
    };
  }, []);

  function getTrimmedLocation(receiptId: string) {
    const selectedLocation = selectedLocations[receiptId] || "";
    const customLocation = customLocations[receiptId] || "";
    return (selectedLocation === "อื่น ๆ" ? customLocation : selectedLocation).trim();
  }

  function handleConfirmUnload(receiptId: string) {
    const unloadingLocation = getTrimmedLocation(receiptId);
    if (!unloadingLocation || unloadingLocation.length > 100) return;

    setConfirmedLocations((current) => ({ ...current, [receiptId]: unloadingLocation }));
    setCustomLocations((current) => ({ ...current, [receiptId]: current[receiptId]?.trim() || "" }));
  }

  return (
    <AppShell>
      <MobileHeader title="ลงสินค้า" subtitle="Confirm unloading" backUrl="/" />
      <div className="space-y-4">
        {message ? <p className="rounded-2xl bg-white p-4 text-sm font-semibold text-slate-500 shadow-soft">{message}</p> : null}
        {pendingReceipts.map((receipt) => {
          const selectedLocation = selectedLocations[receipt.id] || "";
          const customLocation = customLocations[receipt.id] || "";
          const unloadingLocation = getTrimmedLocation(receipt.id);
          const showCustomLocation = selectedLocation === "อื่น ๆ";
          const isLocationValid = unloadingLocation.length > 0 && unloadingLocation.length <= 100;
          const customTooLong = showCustomLocation && customLocation.trim().length > 100;

          return (
            <div key={receipt.id} className="space-y-3">
              <article className="rounded-2xl bg-white p-4 shadow-soft">
                <div className="mb-3 flex items-start justify-between gap-3">
                  <div>
                    <p className="font-semibold text-slate-950">{receipt.receipt_no}</p>
                    <p className="text-sm text-slate-500">ทะเบียน {receipt.truck_plate || "-"} · {formatDate(receipt.received_at)}</p>
                  </div>
                  <StatusBadge status="Pending Unload" />
                </div>
                <div className="grid grid-cols-2 gap-2 text-center text-sm">
                  <div className="rounded-xl bg-slate-50 p-3"><p className="text-slate-500">Gross</p><p className="text-lg font-bold">{formatNumber(receipt.inbound_weight_kg)}</p></div>
                  <div className="rounded-xl bg-slate-50 p-3"><p className="text-slate-500">Moisture</p><p className="text-lg font-bold">{formatNumber(receipt.moisture_percent)}%</p></div>
                </div>
                <ReceiptImagePreviewCards images={receipt.receipt_images} className="mt-3" />
              </article>

              <section className="rounded-2xl border border-orange-100 bg-white p-4 shadow-soft">
                <label className="grid gap-2 text-sm">
                  <span className="font-semibold text-slate-500">สถานที่ลงสินค้า</span>
                  <select
                    value={selectedLocation}
                    onChange={(event) => setSelectedLocations((current) => ({ ...current, [receipt.id]: event.target.value }))}
                    className="h-12 rounded-2xl border border-slate-200 bg-white px-4 font-medium text-slate-900 outline-none focus:border-brand-primary"
                  >
                    <option value="">เลือกสถานที่</option>
                    {presetLocations.map((location) => (
                      <option key={location} value={location}>
                        {location}
                      </option>
                    ))}
                  </select>
                </label>

                {showCustomLocation ? (
                  <label className="mt-3 grid gap-2 text-sm">
                    <span className="font-semibold text-slate-500">ระบุสถานที่</span>
                    <input
                      value={customLocation}
                      onChange={(event) => setCustomLocations((current) => ({ ...current, [receipt.id]: event.target.value.slice(0, 100) }))}
                      maxLength={100}
                      placeholder="กรอกสถานที่ลงสินค้า"
                      className="h-12 rounded-2xl border border-slate-200 px-4 font-medium text-slate-900 outline-none focus:border-brand-primary"
                    />
                    <span className={`text-xs font-medium ${customTooLong ? "text-brand-danger" : "text-slate-400"}`}>
                      {customLocation.trim().length}/100
                    </span>
                  </label>
                ) : null}

                {confirmedLocations[receipt.id] ? (
                  <p className="mt-3 rounded-xl bg-orange-50 px-3 py-2 text-sm font-bold text-[#14213d]">
                    ยืนยันลงสินค้า: {confirmedLocations[receipt.id]}
                  </p>
                ) : null}
              </section>

              <button
                type="button"
                disabled={!isLocationValid}
                onClick={() => handleConfirmUnload(receipt.id)}
                className="h-12 w-full rounded-2xl bg-brand-success font-bold text-white shadow-soft disabled:bg-slate-300"
              >
                Confirm Unload
              </button>
            </div>
          );
        })}
      </div>
    </AppShell>
  );
}
