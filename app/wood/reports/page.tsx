"use client";

import { useEffect, useMemo, useState } from "react";
import { AppShell } from "@/components/AppShell";
import { KpiCard } from "@/components/KpiCard";
import { LoginRequiredMessage } from "@/components/LoginRequiredMessage";
import { LogoutButton } from "@/components/LogoutButton";
import { MobileHeader } from "@/components/MobileHeader";
import { normalizeReceiptStatus } from "@/lib/receipt-status";
import { createBrowserSupabaseClient } from "@/lib/supabase/client";

type ReportReceipt = {
  id: string;
  status: string | null;
  review_status: string | null;
  reviewed_grade: string | null;
  final_grade: string | null;
  inbound_weight_kg: number | null;
  net_weight_kg: number | null;
  moisture_percent: number | null;
  received_at: string | null;
};

function startOfTodayIso() {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return today.toISOString();
}

function formatNumber(value: number, options?: Intl.NumberFormatOptions) {
  return value.toLocaleString("th-TH", options);
}

function getGrade(receipt: ReportReceipt) {
  return receipt.reviewed_grade || receipt.final_grade || "ไม่ระบุ";
}

export default function ReportsPage() {
  const [receipts, setReceipts] = useState<ReportReceipt[]>([]);
  const [message, setMessage] = useState("กำลังโหลดรายงานวันนี้");
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loginRequired, setLoginRequired] = useState(false);

  useEffect(() => {
    let isMounted = true;

    async function loadReportData() {
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
          .select("id, status, review_status, reviewed_grade, final_grade, inbound_weight_kg, net_weight_kg, moisture_percent, received_at")
          .is("deleted_at", null)
          .gte("received_at", startOfTodayIso())
          .order("received_at", { ascending: false });

        if (error) throw error;

        if (isMounted) {
          setReceipts((data ?? []) as ReportReceipt[]);
          setMessage(data?.length ? "" : "ยังไม่มีรายการรับไม้วันนี้");
        }
      } catch (error) {
        if (isMounted) setMessage(error instanceof Error ? error.message : "โหลดรายงานไม่สำเร็จ");
      }
    }

    loadReportData();

    return () => {
      isMounted = false;
    };
  }, []);

  const summary = useMemo(() => {
    const totalTrips = receipts.length;
    const totalNetWeightKg = receipts.reduce((sum, receipt) => sum + (receipt.net_weight_kg ?? 0), 0);
    const totalGrossWeightKg = receipts.reduce((sum, receipt) => sum + (receipt.inbound_weight_kg ?? 0), 0);
    const moistureValues = receipts
      .map((receipt) => receipt.moisture_percent)
      .filter((value): value is number => typeof value === "number");
    const averageMoisture = moistureValues.length
      ? moistureValues.reduce((sum, value) => sum + value, 0) / moistureValues.length
      : 0;
    const acceptedTrips = receipts.filter((receipt) => receipt.review_status === "approved").length;
    const closedTrips = receipts.filter((receipt) => normalizeReceiptStatus(receipt.status) === "closed").length;
    const gradeCounts = receipts.reduce<Record<string, number>>((counts, receipt) => {
      const grade = getGrade(receipt);
      counts[grade] = (counts[grade] ?? 0) + 1;
      return counts;
    }, {});

    return {
      totalTrips,
      totalNetWeightKg,
      totalGrossWeightKg,
      averageMoisture,
      acceptedTrips,
      closedTrips,
      gradeCounts: Object.entries(gradeCounts).sort(([leftGrade], [rightGrade]) => leftGrade.localeCompare(rightGrade)),
    };
  }, [receipts]);

  return (
    <AppShell>
      <MobileHeader title="สรุปเกรดวันนี้" subtitle="Daily summary" backUrl="/" rightAction={isAuthenticated ? <LogoutButton /> : null} />

      <div className="space-y-4">
        {loginRequired ? <LoginRequiredMessage message="กรุณาเข้าสู่ระบบก่อนดูรายงาน" /> : null}
        {message ? <p className="rounded-2xl bg-white p-4 text-sm font-semibold text-slate-500 shadow-soft">{message}</p> : null}

        <section className="grid grid-cols-2 gap-3">
          <KpiCard label="Trips" value={formatNumber(summary.totalTrips)} />
          <KpiCard label="Net Weight" value={formatNumber(summary.totalNetWeightKg / 1000, { maximumFractionDigits: 1 })} unit="ตัน" />
          <KpiCard label="Approved" value={formatNumber(summary.acceptedTrips)} tone="success" />
          <KpiCard label="Average Moisture" value={formatNumber(summary.averageMoisture, { maximumFractionDigits: 1 })} unit="%" tone="warning" />
        </section>

        <section className="grid grid-cols-2 gap-3">
          <KpiCard label="Gross Weight" value={formatNumber(summary.totalGrossWeightKg / 1000, { maximumFractionDigits: 1 })} unit="ตัน" />
          <KpiCard label="Closed" value={formatNumber(summary.closedTrips)} tone="success" />
        </section>

        <section className="rounded-2xl bg-white p-4 shadow-soft">
          <h2 className="font-bold">Grade summary</h2>
          {summary.gradeCounts.length === 0 ? (
            <p className="mt-3 rounded-xl bg-slate-50 p-3 text-sm font-semibold text-slate-500">ยังไม่มีข้อมูลเกรดวันนี้</p>
          ) : (
            summary.gradeCounts.map(([grade, count]) => (
              <div key={grade} className="mt-3 flex items-center justify-between rounded-xl bg-slate-50 p-3">
                <span>{grade}</span>
                <strong>{formatNumber(count)} เที่ยว</strong>
              </div>
            ))
          )}
        </section>
      </div>
    </AppShell>
  );
}
