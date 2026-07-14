"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { BackOfficeLayout } from "@/components/BackOfficeLayout";
import { LoginRequiredMessage } from "@/components/LoginRequiredMessage";
import { StatusBadge } from "@/components/StatusBadge";
import { getReceiptStatusLabel, normalizeReceiptStatus, type ReceiptStatus } from "@/lib/receipt-status";
import { createBrowserSupabaseClient } from "@/lib/supabase/client";

type LoadState = "loading" | "ready" | "login_required" | "error";

type AdminReceipt = {
  id: string;
  receipt_no: string | null;
  truck_plate: string | null;
  status: string | null;
  review_status: "pending" | "approved" | "rejected" | string | null;
  n8n_dispatch_status: "dispatching" | "dispatched" | "failed" | string | null;
  received_at: string | null;
  inbound_weight_kg: number | null;
  outbound_weight_kg: number | null;
  net_weight_kg: number | null;
  reviewed_grade: string | null;
  created_by_name: string | null;
  reviewed_by_name: string | null;
  unloaded_by_name: string | null;
  ai_analysis: Array<{ id: string }> | null;
};

type MetricKey =
  | "active"
  | "pendingInbound"
  | "pendingUnload"
  | "pendingReview"
  | "pendingOutbound"
  | "closed"
  | "manualReview"
  | "n8nFailed";

const metricCards: Array<{ key: MetricKey; label: string; tone: string }> = [
  { key: "active", label: "Active Jobs", tone: "border-slate-200" },
  { key: "pendingInbound", label: "Inbound Scale", tone: "border-blue-200" },
  { key: "pendingUnload", label: "Unload", tone: "border-amber-200" },
  { key: "pendingReview", label: "Review", tone: "border-purple-200" },
  { key: "pendingOutbound", label: "Outbound Scale", tone: "border-cyan-200" },
  { key: "closed", label: "Closed", tone: "border-emerald-200" },
  { key: "manualReview", label: "Manual Review", tone: "border-orange-200" },
  { key: "n8nFailed", label: "n8n Failed", tone: "border-red-200" },
];

const adminReadiness = [
  ["Users", "มี employee profile แล้ว แต่ยังไม่มีหน้าจัดการผู้ใช้แบบ admin"],
  ["Roles", "RLS ตอนนี้ยังเป็น authenticated broad access ต้องแยก role policy"],
  ["Grade Rules", "ยังไม่มีตาราง rule กลางสำหรับเกรด/การปรับเกรด"],
  ["Reopen Jobs", "ยังไม่มี API เปิดงาน closed กลับมาแก้พร้อม audit note"],
] as const;

function formatDate(value: string | null) {
  return value ? new Date(value).toLocaleString("th-TH") : "-";
}

function formatNumber(value: number | null) {
  return value === null ? "-" : value.toLocaleString();
}

function getStatus(receipt: AdminReceipt): ReceiptStatus {
  return normalizeReceiptStatus(receipt.status);
}

function hasAiResult(receipt: AdminReceipt) {
  return Boolean(receipt.ai_analysis && receipt.ai_analysis.length > 0);
}

export default function AdminPage() {
  const [loadState, setLoadState] = useState<LoadState>("loading");
  const [receipts, setReceipts] = useState<AdminReceipt[]>([]);
  const [message, setMessage] = useState("");

  useEffect(() => {
    let isMounted = true;

    async function loadReceipts() {
      setLoadState("loading");
      setMessage("");

      try {
        const supabase = createBrowserSupabaseClient();
        const { data: sessionData, error: sessionError } = await supabase.auth.getSession();

        if (sessionError) throw sessionError;
        if (!sessionData.session) {
          if (isMounted) setLoadState("login_required");
          return;
        }

        const { data, error } = await supabase
          .from("wood_receipts")
          .select(
            "id, receipt_no, truck_plate, status, review_status, n8n_dispatch_status, received_at, inbound_weight_kg, outbound_weight_kg, net_weight_kg, reviewed_grade, created_by_name, reviewed_by_name, unloaded_by_name, ai_analysis(id)",
          )
          .is("deleted_at", null)
          .order("created_at", { ascending: false })
          .limit(80);

        if (error) throw error;

        if (isMounted) {
          setReceipts((data ?? []) as AdminReceipt[]);
          setLoadState("ready");
        }
      } catch (error) {
        if (isMounted) {
          setMessage(error instanceof Error ? error.message : "โหลด Admin console ไม่สำเร็จ");
          setLoadState("error");
        }
      }
    }

    loadReceipts();

    return () => {
      isMounted = false;
    };
  }, []);

  const metrics = useMemo<Record<MetricKey, number>>(() => {
    return {
      active: receipts.filter((receipt) => getStatus(receipt) !== "closed" && getStatus(receipt) !== "rejected").length,
      pendingInbound: receipts.filter((receipt) => getStatus(receipt) === "pending_inbound_scale").length,
      pendingUnload: receipts.filter((receipt) => getStatus(receipt) === "pending_unload").length,
      pendingReview: receipts.filter((receipt) => getStatus(receipt) === "pending_review").length,
      pendingOutbound: receipts.filter((receipt) => getStatus(receipt) === "pending_outbound_scale").length,
      closed: receipts.filter((receipt) => getStatus(receipt) === "closed").length,
      manualReview: receipts.filter((receipt) => getStatus(receipt) === "pending_manual_review").length,
      n8nFailed: receipts.filter((receipt) => receipt.n8n_dispatch_status === "failed").length,
    };
  }, [receipts]);

  const watchList = useMemo(() => {
    return receipts.filter((receipt) => {
      const status = getStatus(receipt);
      return status === "pending_manual_review" || status === "ai_failed" || receipt.n8n_dispatch_status === "failed";
    });
  }, [receipts]);

  return (
    <BackOfficeLayout title="Admin Operations" subtitle="Real-time operational status, monitoring, and admin readiness">
      <div className="space-y-5">
        {loadState === "login_required" ? <LoginRequiredMessage message="กรุณาเข้าสู่ระบบก่อนเปิด Admin Operations" /> : null}
        {loadState === "error" ? <p className="rounded-2xl border border-red-200 bg-red-50 p-4 text-sm font-semibold text-red-900">{message}</p> : null}

        <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          {metricCards.map((card) => (
            <article key={card.key} className={`rounded-2xl border ${card.tone} bg-white p-4 shadow-soft`}>
              <p className="text-xs font-bold uppercase text-slate-500">{card.label}</p>
              <p className="mt-2 text-3xl font-black text-slate-950">{loadState === "loading" ? "-" : metrics[card.key]}</p>
            </article>
          ))}
        </section>

        <section className="rounded-2xl bg-white p-4 shadow-soft">
          <div className="mb-3 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-xs font-black uppercase text-brand-primary">Watch List</p>
              <h2 className="text-lg font-bold text-slate-950">งานที่ควรตรวจทันที</h2>
            </div>
            <Link href="/admin/status" className="h-11 rounded-2xl border border-slate-200 px-4 py-3 text-center text-sm font-bold text-slate-700">
              Smoke Dashboard
            </Link>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-slate-100 text-sm">
              <thead className="text-left text-xs font-bold uppercase text-slate-500">
                <tr>
                  <th className="px-3 py-2">Receipt</th>
                  <th className="px-3 py-2">Status</th>
                  <th className="px-3 py-2">AI</th>
                  <th className="px-3 py-2">n8n</th>
                  <th className="px-3 py-2">Received</th>
                  <th className="px-3 py-2">Open</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {loadState === "loading" ? (
                  <tr><td className="px-3 py-4 text-slate-500" colSpan={6}>กำลังโหลดข้อมูล</td></tr>
                ) : null}
                {loadState === "ready" && watchList.length === 0 ? (
                  <tr><td className="px-3 py-4 text-slate-500" colSpan={6}>ยังไม่มีงานผิดปกติที่ต้องตรวจทันที</td></tr>
                ) : null}
                {watchList.map((receipt) => (
                  <tr key={receipt.id} className="align-top">
                    <td className="whitespace-nowrap px-3 py-3">
                      <p className="font-bold text-slate-950">{receipt.receipt_no || "-"}</p>
                      <p className="text-xs text-slate-500">ทะเบียน {receipt.truck_plate || "-"}</p>
                    </td>
                    <td className="whitespace-nowrap px-3 py-3"><StatusBadge status={getStatus(receipt)} /></td>
                    <td className="whitespace-nowrap px-3 py-3">{hasAiResult(receipt) ? "done" : "pending"}</td>
                    <td className="whitespace-nowrap px-3 py-3">{receipt.n8n_dispatch_status || "-"}</td>
                    <td className="whitespace-nowrap px-3 py-3">{formatDate(receipt.received_at)}</td>
                    <td className="whitespace-nowrap px-3 py-3">
                      <Link className="font-bold text-brand-primary underline-offset-4 hover:underline" href={`/wood/review/${receipt.id}`}>Review</Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        <section className="grid gap-4 xl:grid-cols-[1fr_360px]">
          <div className="rounded-2xl bg-white p-4 shadow-soft">
            <div className="mb-3">
              <p className="text-xs font-black uppercase text-brand-primary">Recent Receipts</p>
              <h2 className="text-lg font-bold text-slate-950">สถานะงานล่าสุด</h2>
            </div>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-slate-100 text-sm">
                <thead className="text-left text-xs font-bold uppercase text-slate-500">
                  <tr>
                    <th className="px-3 py-2">Receipt</th>
                    <th className="px-3 py-2">Workflow</th>
                    <th className="px-3 py-2">Gross</th>
                    <th className="px-3 py-2">Tare</th>
                    <th className="px-3 py-2">Net</th>
                    <th className="px-3 py-2">Grade</th>
                    <th className="px-3 py-2">Owner</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {loadState === "ready" && receipts.length === 0 ? (
                    <tr><td className="px-3 py-4 text-slate-500" colSpan={7}>ยังไม่มี receipt</td></tr>
                  ) : null}
                  {receipts.slice(0, 20).map((receipt) => (
                    <tr key={receipt.id} className="align-top">
                      <td className="whitespace-nowrap px-3 py-3">
                        <p className="font-bold">{receipt.receipt_no || "-"}</p>
                        <p className="text-xs text-slate-500">{receipt.truck_plate || "-"}</p>
                      </td>
                      <td className="whitespace-nowrap px-3 py-3">{getReceiptStatusLabel(receipt.status)}</td>
                      <td className="whitespace-nowrap px-3 py-3">{formatNumber(receipt.inbound_weight_kg)}</td>
                      <td className="whitespace-nowrap px-3 py-3">{formatNumber(receipt.outbound_weight_kg)}</td>
                      <td className="whitespace-nowrap px-3 py-3 font-bold">{formatNumber(receipt.net_weight_kg)}</td>
                      <td className="whitespace-nowrap px-3 py-3">{receipt.reviewed_grade || "-"}</td>
                      <td className="whitespace-nowrap px-3 py-3">{receipt.reviewed_by_name || receipt.unloaded_by_name || receipt.created_by_name || "-"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <aside className="rounded-2xl bg-white p-4 shadow-soft">
            <p className="text-xs font-black uppercase text-brand-primary">Admin Readiness</p>
            <h2 className="mt-1 text-lg font-bold text-slate-950">งานระบบสิทธิ์ที่ยังเหลือ</h2>
            <div className="mt-4 space-y-3">
              {adminReadiness.map(([title, description]) => (
                <div key={title} className="rounded-xl border border-slate-200 p-3">
                  <p className="font-bold text-slate-950">{title}</p>
                  <p className="mt-1 text-sm text-slate-500">{description}</p>
                </div>
              ))}
            </div>
          </aside>
        </section>
      </div>
    </BackOfficeLayout>
  );
}
