"use client";

import { useMemo, useState } from "react";
import { AppShell } from "@/components/AppShell";
import { MobileHeader } from "@/components/MobileHeader";
import { ReceiptCard } from "@/components/ReceiptCard";
import { receipts } from "@/lib/mock-data";

const presetLocations = ["ลานรับไม้", "โกดัง A", "โกดัง B", "จุดรอตรวจ", "อื่น ๆ"];

export default function UnloadPage() {
  const pendingReceipts = useMemo(() => receipts.filter((receipt) => receipt.status === "Pending Unload"), []);
  const [selectedLocations, setSelectedLocations] = useState<Record<string, string>>({});
  const [customLocations, setCustomLocations] = useState<Record<string, string>>({});
  const [confirmedLocations, setConfirmedLocations] = useState<Record<string, string>>({});

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
        {pendingReceipts.map((receipt) => {
          const selectedLocation = selectedLocations[receipt.id] || "";
          const customLocation = customLocations[receipt.id] || "";
          const unloadingLocation = getTrimmedLocation(receipt.id);
          const showCustomLocation = selectedLocation === "อื่น ๆ";
          const isLocationValid = unloadingLocation.length > 0 && unloadingLocation.length <= 100;
          const customTooLong = showCustomLocation && customLocation.trim().length > 100;

          return (
            <div key={receipt.id} className="space-y-3">
              <ReceiptCard receipt={receipt} />

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
