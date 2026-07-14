"use client";

import { useEffect, useState } from "react";
import { BackOfficeLayout } from "@/components/BackOfficeLayout";
import { LoginRequiredMessage } from "@/components/LoginRequiredMessage";
import { LogoutButton } from "@/components/LogoutButton";
import { StatusBadge } from "@/components/StatusBadge";
import { createBrowserSupabaseClient } from "@/lib/supabase/client";

type OutboundReceipt = {
  id: string;
  receipt_no: string;
  truck_plate: string | null;
  status: string;
  inbound_weight_kg: number | null;
  reviewed_grade: string | null;
  reviewed_at: string | null;
  reviewed_by_name: string | null;
};

type OutboundScaleResponse = {
  id?: string;
  status?: string;
  inbound_weight_kg?: number | null;
  outbound_weight_kg?: number | null;
  net_weight_kg?: number | null;
  outbound_at?: string | null;
  outbound_by_name?: string | null;
  error?: string;
  detail?: string;
};

function formatDate(value: string | null) {
  return value ? new Date(value).toLocaleString("th-TH") : "-";
}

function formatNumber(value: number | null) {
  return value === null ? "-" : value.toLocaleString();
}

function parsePositiveWeight(value: string) {
  const numberValue = Number(value.replace(/,/g, "").trim());
  return Number.isFinite(numberValue) && numberValue > 0 ? numberValue : null;
}

export default function OutboundScalePage() {
  const [receipts, setReceipts] = useState<OutboundReceipt[]>([]);
  const [outboundWeights, setOutboundWeights] = useState<Record<string, string>>({});
  const [savingReceipts, setSavingReceipts] = useState<Record<string, boolean>>({});
  const [message, setMessage] = useState("กำลังโหลดงานรอชั่งขาออก");
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loginRequired, setLoginRequired] = useState(false);

  useEffect(() => {
    let isMounted = true;

    async function loadPendingOutboundScale() {
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
          .select("id, receipt_no, truck_plate, status, inbound_weight_kg, reviewed_grade, reviewed_at, reviewed_by_name")
          .is("deleted_at", null)
          .in("status", ["pending_outbound_scale", "Pending Outbound Scale"])
          .order("reviewed_at", { ascending: false })
          .limit(50);

        if (error) throw error;

        if (isMounted) {
          setReceipts((data ?? []) as OutboundReceipt[]);
          setMessage(data?.length ? "" : "ยังไม่มีงานรอชั่งขาออก");
        }
      } catch (error) {
        if (isMounted) setMessage(error instanceof Error ? error.message : "โหลดงานชั่งขาออกไม่สำเร็จ");
      }
    }

    loadPendingOutboundScale();

    return () => {
      isMounted = false;
    };
  }, []);

  async function handleSaveOutboundScale(receiptId: string) {
    const outboundWeightKg = parsePositiveWeight(outboundWeights[receiptId] || "");
    const receipt = receipts.find((item) => item.id === receiptId);
    const inboundWeightKg = receipt?.inbound_weight_kg ?? null;

    if (!receipt || !outboundWeightKg || !inboundWeightKg || outboundWeightKg >= inboundWeightKg || savingReceipts[receiptId]) return;

    setSavingReceipts((current) => ({ ...current, [receiptId]: true }));
    setMessage("");

    try {
      const supabase = createBrowserSupabaseClient();
      const { data: sessionData, error: sessionError } = await supabase.auth.getSession();

      if (sessionError) throw sessionError;
      if (!sessionData.session?.access_token) throw new Error("กรุณาเข้าสู่ระบบก่อนบันทึกน้ำหนักออก");

      const response = await fetch("/api/outbound-scale/save", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${sessionData.session.access_token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          receiptId,
          outboundWeightKg,
        }),
      });

      const responseBody = (await response.json()) as OutboundScaleResponse;
      if (!response.ok) throw new Error(responseBody.detail || responseBody.error || "บันทึกน้ำหนักออกไม่สำเร็จ");

      setReceipts((current) => current.filter((item) => item.id !== receiptId));
      setMessage("บันทึกน้ำหนักออกและปิดงานแล้ว");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "บันทึกน้ำหนักออกไม่สำเร็จ");
    } finally {
      setSavingReceipts((current) => ({ ...current, [receiptId]: false }));
    }
  }

  return (
    <BackOfficeLayout title="ห้องชั่งขาออก" subtitle="บันทึกน้ำหนักรถเปล่าและคำนวณน้ำหนักสุทธิ">
      <div className="mb-4 flex justify-end">
        {isAuthenticated ? <LogoutButton /> : null}
      </div>

      <div className="space-y-4">
        {loginRequired ? <LoginRequiredMessage message="กรุณาเข้าสู่ระบบก่อนเปิดห้องชั่งขาออก" /> : null}
        {message ? <p className="rounded-2xl bg-white p-4 text-sm font-semibold text-slate-500 shadow-soft">{message}</p> : null}

        {receipts.map((receipt) => {
          const outboundWeight = outboundWeights[receipt.id] || "";
          const parsedOutboundWeight = parsePositiveWeight(outboundWeight);
          const inboundWeight = receipt.inbound_weight_kg;
          const netWeight = parsedOutboundWeight && inboundWeight ? inboundWeight - parsedOutboundWeight : null;
          const isSaving = Boolean(savingReceipts[receipt.id]);
          const canSave = Boolean(parsedOutboundWeight && inboundWeight && netWeight && netWeight > 0 && !isSaving);

          return (
            <article key={receipt.id} className="rounded-3xl bg-white p-5 shadow-soft">
              <div className="grid gap-5 xl:grid-cols-[1fr_420px]">
                <section>
                  <div className="mb-4 flex items-start justify-between gap-3">
                    <div>
                      <p className="text-sm font-semibold uppercase tracking-wide text-brand-primary">Receipt</p>
                      <h2 className="text-xl font-bold text-slate-950">{receipt.receipt_no}</h2>
                      <p className="text-sm text-slate-500">ทะเบียน {receipt.truck_plate || "-"} · Reviewed {formatDate(receipt.reviewed_at)}</p>
                    </div>
                    <StatusBadge status={receipt.status} />
                  </div>

                  <div className="grid gap-2 text-sm sm:grid-cols-4">
                    <div className="rounded-2xl bg-slate-50 p-3">
                      <p className="text-slate-500">Gross</p>
                      <p className="font-bold text-slate-950">{formatNumber(receipt.inbound_weight_kg)} kg</p>
                    </div>
                    <div className="rounded-2xl bg-slate-50 p-3">
                      <p className="text-slate-500">Grade</p>
                      <p className="font-bold text-slate-950">{receipt.reviewed_grade || "-"}</p>
                    </div>
                    <div className="rounded-2xl bg-slate-50 p-3">
                      <p className="text-slate-500">Reviewed by</p>
                      <p className="font-bold text-slate-950">{receipt.reviewed_by_name || "-"}</p>
                    </div>
                    <div className="rounded-2xl bg-slate-50 p-3">
                      <p className="text-slate-500">Next</p>
                      <p className="font-bold text-slate-950">Closed</p>
                    </div>
                  </div>
                </section>

                <section className="rounded-2xl border border-orange-100 bg-orange-50/40 p-4">
                  <label className="grid gap-2 text-sm" htmlFor={`outbound-${receipt.id}`}>
                    <span className="font-semibold text-slate-600">Outbound / tare weight (kg)</span>
                    <input
                      id={`outbound-${receipt.id}`}
                      value={outboundWeight}
                      onChange={(event) => setOutboundWeights((current) => ({ ...current, [receipt.id]: event.target.value }))}
                      inputMode="decimal"
                      className="h-12 rounded-2xl border border-slate-200 bg-white px-4 font-semibold text-slate-950 outline-none focus:border-brand-primary"
                      placeholder="10,200"
                    />
                  </label>

                  <div className="mt-3 rounded-2xl bg-white p-3 text-sm">
                    <p className="text-slate-500">Net weight</p>
                    <p className={`text-xl font-bold ${netWeight && netWeight > 0 ? "text-slate-950" : "text-brand-danger"}`}>
                      {netWeight && netWeight > 0 ? `${formatNumber(netWeight)} kg` : "รอน้ำหนักออกที่น้อยกว่า Gross"}
                    </p>
                  </div>

                  <button
                    type="button"
                    disabled={!canSave}
                    onClick={() => handleSaveOutboundScale(receipt.id)}
                    className="mt-4 h-12 w-full rounded-2xl bg-brand-primary px-6 font-bold text-white shadow-soft disabled:bg-slate-300"
                  >
                    {isSaving ? "Saving..." : "คำนวณและปิดงาน"}
                  </button>
                </section>
              </div>
            </article>
          );
        })}
      </div>
    </BackOfficeLayout>
  );
}
