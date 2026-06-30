"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { AppShell } from "@/components/AppShell";
import { LoginRequiredMessage } from "@/components/LoginRequiredMessage";
import { LogoutButton } from "@/components/LogoutButton";
import { MobileHeader } from "@/components/MobileHeader";
import { ReceiptImagePreviewCards } from "@/components/ReceiptImagePreviewCards";
import type { ReceiptPreviewImage } from "@/components/ReceiptImagePreviewCards";
import { StatusBadge } from "@/components/StatusBadge";
import { createBrowserSupabaseClient } from "@/lib/supabase/client";

type ReviewAnalysis = {
  suggested_grade: string | null;
  confidence: number | null;
};

type ReviewReceipt = {
  id: string;
  receipt_no: string;
  truck_plate: string | null;
  status: string;
  review_status: "pending" | "approved" | "rejected";
  inbound_weight_kg: number | null;
  moisture_percent: number | null;
  received_at: string | null;
  created_by_name: string | null;
  ai_analysis: ReviewAnalysis | ReviewAnalysis[] | null;
  receipt_images: ReceiptPreviewImage[] | null;
};

function formatNumber(value: number | null) {
  return value === null ? "-" : value.toLocaleString();
}

function getAnalysis(value: ReviewReceipt["ai_analysis"]) {
  if (Array.isArray(value)) return value[0] ?? null;
  return value;
}

export default function ReviewListPage() {
  const [receipts, setReceipts] = useState<ReviewReceipt[]>([]);
  const [message, setMessage] = useState("กำลังโหลดงานรอตรวจ");
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
          .select("id, receipt_no, truck_plate, status, review_status, inbound_weight_kg, moisture_percent, received_at, created_by_name, ai_analysis(suggested_grade, confidence), receipt_images(image_type, file_path, file_name)")
          .is("deleted_at", null)
          .eq("review_status", "pending")
          .order("created_at", { ascending: false })
          .limit(20);

        if (error) throw error;

        if (isMounted) {
          setReceipts((data ?? []) as ReviewReceipt[]);
          setMessage(data?.length ? "" : "ยังไม่มีงานรอตรวจ");
        }
      } catch (error) {
        if (isMounted) setMessage(error instanceof Error ? error.message : "โหลดงานรอตรวจไม่สำเร็จ");
      }
    }

    loadReceipts();

    return () => {
      isMounted = false;
    };
  }, []);

  return (
    <AppShell>
      <MobileHeader title="งานรอตรวจ" subtitle="Pending review jobs" backUrl="/" rightAction={isAuthenticated ? <LogoutButton /> : null} />
      <div className="space-y-4">
        {loginRequired ? <LoginRequiredMessage message="กรุณาเข้าสู่ระบบก่อนดูงานรอตรวจ" /> : null}
        {message ? <p className="rounded-2xl bg-white p-4 text-sm font-semibold text-slate-500 shadow-soft">{message}</p> : null}
        {receipts.map((receipt) => {
          const analysis = getAnalysis(receipt.ai_analysis);

          return (
            <article key={receipt.id} className="rounded-2xl bg-white p-4 shadow-soft">
              <div className="mb-3 flex items-start justify-between gap-3">
                <div>
                  <p className="font-semibold text-slate-950">{receipt.receipt_no}</p>
                  <p className="text-sm text-slate-500">ทะเบียน {receipt.truck_plate || "-"}</p>
                  <p className="text-xs font-semibold text-slate-400">Created by {receipt.created_by_name || "-"}</p>
                </div>
                <StatusBadge status="Pending Review" />
              </div>
              <div className="grid grid-cols-3 gap-2 text-center text-sm">
                <div className="rounded-xl bg-slate-50 p-3"><p className="text-slate-500">AI Grade</p><p className="text-lg font-bold">{analysis?.suggested_grade || "-"}</p></div>
                <div className="rounded-xl bg-slate-50 p-3"><p className="text-slate-500">Moisture</p><p className="text-lg font-bold">{formatNumber(receipt.moisture_percent)}%</p></div>
                <div className="rounded-xl bg-slate-50 p-3"><p className="text-slate-500">Gross</p><p className="text-lg font-bold">{formatNumber(receipt.inbound_weight_kg)}</p></div>
              </div>
              <ReceiptImagePreviewCards images={receipt.receipt_images} className="mt-3" />
              <Link href={`/wood/review/${receipt.id}`} className="mt-3 block h-11 rounded-2xl bg-brand-primary px-4 py-3 text-center text-sm font-bold text-white">
                Open Review
              </Link>
            </article>
          );
        })}
      </div>
    </AppShell>
  );
}
