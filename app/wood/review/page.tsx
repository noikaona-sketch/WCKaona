"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { AppShell } from "@/components/AppShell";
import { MobileHeader } from "@/components/MobileHeader";
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
  ai_analysis: ReviewAnalysis | ReviewAnalysis[] | null;
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

  useEffect(() => {
    let isMounted = true;

    async function loadReceipts() {
      try {
        const supabase = createBrowserSupabaseClient();
        const { data: sessionData, error: sessionError } = await supabase.auth.getSession();

        if (sessionError) throw sessionError;
        if (!sessionData.session) {
          if (isMounted) setMessage("กรุณาเข้าสู่ระบบก่อนดูงานรอตรวจ");
          return;
        }

        const { data, error } = await supabase
          .from("wood_receipts")
          .select("id, receipt_no, truck_plate, status, review_status, inbound_weight_kg, moisture_percent, received_at, ai_analysis(suggested_grade, confidence)")
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
      <MobileHeader title="งานรอตรวจ" subtitle="Pending review jobs" backUrl="/" />
      <div className="space-y-4">
        {message ? <p className="rounded-2xl bg-white p-4 text-sm font-semibold text-slate-500 shadow-soft">{message}</p> : null}
        {receipts.map((receipt) => {
          const analysis = getAnalysis(receipt.ai_analysis);

          return (
            <Link key={receipt.id} href={`/wood/review/${receipt.id}`} className="block rounded-2xl bg-white p-4 shadow-soft">
              <div className="mb-3 flex items-start justify-between gap-3">
                <div>
                  <p className="font-semibold text-slate-950">{receipt.receipt_no}</p>
                  <p className="text-sm text-slate-500">ทะเบียน {receipt.truck_plate || "-"}</p>
                </div>
                <StatusBadge status="Pending Review" />
              </div>
              <div className="grid grid-cols-3 gap-2 text-center text-sm">
                <div className="rounded-xl bg-slate-50 p-3"><p className="text-slate-500">AI Grade</p><p className="text-lg font-bold">{analysis?.suggested_grade || "-"}</p></div>
                <div className="rounded-xl bg-slate-50 p-3"><p className="text-slate-500">Moisture</p><p className="text-lg font-bold">{formatNumber(receipt.moisture_percent)}%</p></div>
                <div className="rounded-xl bg-slate-50 p-3"><p className="text-slate-500">Gross</p><p className="text-lg font-bold">{formatNumber(receipt.inbound_weight_kg)}</p></div>
              </div>
            </Link>
          );
        })}
      </div>
    </AppShell>
  );
}
