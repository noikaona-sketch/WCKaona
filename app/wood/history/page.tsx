"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { AppShell } from "@/components/AppShell";
import { LoginRequiredMessage } from "@/components/LoginRequiredMessage";
import { LogoutButton } from "@/components/LogoutButton";
import { MobileHeader } from "@/components/MobileHeader";
import { ReceiptImagePreviewCards } from "@/components/ReceiptImagePreviewCards";
import type { ReceiptPreviewImage } from "@/components/ReceiptImagePreviewCards";
import { StatusBadge } from "@/components/StatusBadge";
import { createBrowserSupabaseClient } from "@/lib/supabase/client";
import type { ReceiptStatus } from "@/lib/mock-data";

const filters = ["Today", "Approved", "Closed"] as const;
const knownStatuses: ReceiptStatus[] = [
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
  "Rejected",
  "Need Retake Photo",
  "Need Scale Correction",
  "Reopened",
];

type HistoryFilter = (typeof filters)[number];

type HistoryReceipt = {
  id: string;
  receipt_no: string;
  truck_plate: string | null;
  status: string;
  review_status: "pending" | "approved" | "rejected" | string | null;
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

function startOfTodayIso() {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return today.toISOString();
}

function getDisplayStatus(receipt: HistoryReceipt): ReceiptStatus {
  if (receipt.review_status === "approved") return "Approved";
  if (receipt.review_status === "rejected") return "Rejected";
  return knownStatuses.includes(receipt.status as ReceiptStatus) ? (receipt.status as ReceiptStatus) : "Submitted";
}

export default function HistoryPage() {
  const [activeFilter, setActiveFilter] = useState<HistoryFilter>("Today");
  const [receipts, setReceipts] = useState<HistoryReceipt[]>([]);
  const [message, setMessage] = useState("กำลังโหลดประวัติวันนี้");
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loginRequired, setLoginRequired] = useState(false);

  useEffect(() => {
    let isMounted = true;

    async function loadReceipts() {
      try {
        const supabase = createBrowserSupabaseClient();
        const { data: sessionData, error: sessionError } = await supabase.auth.getSession();

        if (sessionError) throw sessionError;
        if (!sessionData.session) {
          if (isMounted) {
            setLoginRequired(true);
            setMessage("");
          }
          return;
        }

        if (isMounted) setIsAuthenticated(true);

        const { data, error } = await supabase
          .from("wood_receipts")
          .select("id, receipt_no, truck_plate, status, review_status, inbound_weight_kg, moisture_percent, received_at, receipt_images(image_type, file_path, file_name)")
          .is("deleted_at", null)
          .gte("received_at", startOfTodayIso())
          .order("created_at", { ascending: false })
          .limit(50);

        if (error) throw error;

        if (isMounted) {
          setReceipts((data ?? []) as HistoryReceipt[]);
          setMessage(data?.length ? "" : "ยังไม่มีประวัติวันนี้");
        }
      } catch (error) {
        if (isMounted) setMessage(error instanceof Error ? error.message : "โหลดประวัติไม่สำเร็จ");
      }
    }

    loadReceipts();

    return () => {
      isMounted = false;
    };
  }, []);

  const filteredReceipts = useMemo(() => {
    if (activeFilter === "Approved") return receipts.filter((receipt) => receipt.review_status === "approved");
    if (activeFilter === "Closed") return receipts.filter((receipt) => receipt.status === "Closed");
    return receipts;
  }, [activeFilter, receipts]);

  return (
    <AppShell>
      <MobileHeader title="ประวัติวันนี้" subtitle="Daily history" backUrl="/" rightAction={isAuthenticated ? <LogoutButton /> : null} />
      <div className="mb-4 flex gap-2 overflow-x-auto">
        {filters.map((filter) => (
          <button
            key={filter}
            type="button"
            onClick={() => setActiveFilter(filter)}
            className={`h-11 rounded-full px-4 text-sm font-semibold shadow-soft ${activeFilter === filter ? "bg-brand-primary text-white" : "bg-white text-slate-700"}`}
          >
            {filter}
          </button>
        ))}
      </div>
      <div className="space-y-4">
        {loginRequired ? <LoginRequiredMessage message="กรุณาเข้าสู่ระบบก่อนดูประวัติวันนี้" /> : null}
        {message ? <p className="rounded-2xl bg-white p-4 text-sm font-semibold text-slate-500 shadow-soft">{message}</p> : null}
        {!message && !loginRequired && filteredReceipts.length === 0 ? <p className="rounded-2xl bg-white p-4 text-sm font-semibold text-slate-500 shadow-soft">ไม่พบรายการในตัวกรองนี้</p> : null}
        {filteredReceipts.map((receipt) => (
          <article key={receipt.id} className="rounded-2xl bg-white p-4 shadow-soft">
            <div className="mb-3 flex items-start justify-between gap-3">
              <div>
                <p className="font-semibold text-slate-950">{receipt.receipt_no}</p>
                <p className="text-sm text-slate-500">ทะเบียน {receipt.truck_plate || "-"} · {formatDate(receipt.received_at)}</p>
              </div>
              <StatusBadge status={getDisplayStatus(receipt)} />
            </div>
            <div className="grid grid-cols-2 gap-2 text-center text-sm">
              <div className="rounded-xl bg-slate-50 p-3"><p className="text-slate-500">Gross</p><p className="text-lg font-bold">{formatNumber(receipt.inbound_weight_kg)}</p></div>
              <div className="rounded-xl bg-slate-50 p-3"><p className="text-slate-500">Moisture</p><p className="text-lg font-bold">{formatNumber(receipt.moisture_percent)}%</p></div>
            </div>
            <ReceiptImagePreviewCards images={receipt.receipt_images} className="mt-3" />
            <Link href={`/wood/review/${receipt.id}`} className="mt-3 block h-11 rounded-2xl border border-brand-primary px-4 py-3 text-center text-sm font-bold text-brand-primary">
              Review Detail
            </Link>
          </article>
        ))}
      </div>
    </AppShell>
  );
}
