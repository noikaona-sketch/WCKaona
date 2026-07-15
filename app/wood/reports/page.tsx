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
  receipt_no: string | null;
  supplier_id: string | null;
  status: string | null;
  review_status: string | null;
  reviewed_grade: string | null;
  final_grade: string | null;
  inbound_weight_kg: number | null;
  net_weight_kg: number | null;
  moisture_percent: number | null;
  received_at: string | null;
  suppliers:
    | {
        name: string | null;
        supplier_code: string | null;
      }
    | Array<{
    name: string | null;
    supplier_code: string | null;
  }>
    | null;
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

function getSupplierLabel(receipt: ReportReceipt) {
  const supplier = Array.isArray(receipt.suppliers) ? receipt.suppliers[0] : receipt.suppliers;
  const name = supplier?.name || "ไม่ระบุ Supplier";
  const code = supplier?.supplier_code;
  return code ? `${name} (${code})` : name;
}

function escapeCsvValue(value: string | number | null | undefined) {
  const text = value === null || value === undefined ? "" : String(value);
  return `"${text.replace(/"/g, '""')}"`;
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
          .select("id, receipt_no, supplier_id, status, review_status, reviewed_grade, final_grade, inbound_weight_kg, net_weight_kg, moisture_percent, received_at, suppliers(name, supplier_code)")
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
    const supplierSummary = receipts.reduce<Record<string, { trips: number; grossKg: number; netKg: number; moistureTotal: number; moistureCount: number }>>(
      (summaryBySupplier, receipt) => {
        const supplier = getSupplierLabel(receipt);
        const current = summaryBySupplier[supplier] ?? { trips: 0, grossKg: 0, netKg: 0, moistureTotal: 0, moistureCount: 0 };
        current.trips += 1;
        current.grossKg += receipt.inbound_weight_kg ?? 0;
        current.netKg += receipt.net_weight_kg ?? 0;
        if (typeof receipt.moisture_percent === "number") {
          current.moistureTotal += receipt.moisture_percent;
          current.moistureCount += 1;
        }
        summaryBySupplier[supplier] = current;
        return summaryBySupplier;
      },
      {},
    );

    return {
      totalTrips,
      totalNetWeightKg,
      totalGrossWeightKg,
      averageMoisture,
      acceptedTrips,
      closedTrips,
      gradeCounts: Object.entries(gradeCounts).sort(([leftGrade], [rightGrade]) => leftGrade.localeCompare(rightGrade)),
      supplierSummary: Object.entries(supplierSummary).sort(([leftSupplier], [rightSupplier]) => leftSupplier.localeCompare(rightSupplier)),
    };
  }, [receipts]);

  function exportDailyCsv() {
    const headers = [
      "receipt_no",
      "supplier",
      "status",
      "review_status",
      "grade",
      "gross_weight_kg",
      "net_weight_kg",
      "moisture_percent",
      "received_at",
    ];
    const rows = receipts.map((receipt) => [
      receipt.receipt_no || "",
      getSupplierLabel(receipt),
      normalizeReceiptStatus(receipt.status),
      receipt.review_status || "",
      getGrade(receipt),
      receipt.inbound_weight_kg ?? "",
      receipt.net_weight_kg ?? "",
      receipt.moisture_percent ?? "",
      receipt.received_at ? new Date(receipt.received_at).toISOString() : "",
    ]);
    const csv = [headers, ...rows].map((row) => row.map(escapeCsvValue).join(",")).join("\r\n");
    const blob = new Blob([`\uFEFF${csv}`], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    const date = new Date().toISOString().slice(0, 10);
    link.href = url;
    link.download = `wood-daily-report-${date}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  }

  return (
    <AppShell>
      <MobileHeader title="สรุปเกรดวันนี้" subtitle="Daily summary" backUrl="/" rightAction={isAuthenticated ? <LogoutButton /> : null} />

      <div className="space-y-4">
        {loginRequired ? <LoginRequiredMessage message="กรุณาเข้าสู่ระบบก่อนดูรายงาน" /> : null}
        {message ? <p className="rounded-2xl bg-white p-4 text-sm font-semibold text-slate-500 shadow-soft">{message}</p> : null}
        {!loginRequired && receipts.length > 0 ? (
          <button
            type="button"
            onClick={exportDailyCsv}
            className="h-11 w-full rounded-2xl border border-brand-primary bg-white px-4 text-sm font-bold text-brand-primary shadow-soft"
          >
            Export CSV
          </button>
        ) : null}

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

        <section className="rounded-2xl bg-white p-4 shadow-soft">
          <h2 className="font-bold">Supplier summary</h2>
          {summary.supplierSummary.length === 0 ? (
            <p className="mt-3 rounded-xl bg-slate-50 p-3 text-sm font-semibold text-slate-500">ยังไม่มีข้อมูล Supplier วันนี้</p>
          ) : (
            summary.supplierSummary.map(([supplier, supplierData]) => {
              const averageMoisture = supplierData.moistureCount ? supplierData.moistureTotal / supplierData.moistureCount : 0;
              return (
                <div key={supplier} className="mt-3 rounded-xl bg-slate-50 p-3">
                  <div className="flex items-center justify-between gap-3">
                    <span className="font-semibold">{supplier}</span>
                    <strong>{formatNumber(supplierData.trips)} เที่ยว</strong>
                  </div>
                  <div className="mt-2 grid grid-cols-3 gap-2 text-center text-xs">
                    <div className="rounded-lg bg-white p-2">
                      <p className="text-slate-500">Gross</p>
                      <p className="font-bold">{formatNumber(supplierData.grossKg / 1000, { maximumFractionDigits: 1 })} ตัน</p>
                    </div>
                    <div className="rounded-lg bg-white p-2">
                      <p className="text-slate-500">Net</p>
                      <p className="font-bold">{formatNumber(supplierData.netKg / 1000, { maximumFractionDigits: 1 })} ตัน</p>
                    </div>
                    <div className="rounded-lg bg-white p-2">
                      <p className="text-slate-500">Moisture</p>
                      <p className="font-bold">{formatNumber(averageMoisture, { maximumFractionDigits: 1 })}%</p>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </section>
      </div>
    </AppShell>
  );
}
