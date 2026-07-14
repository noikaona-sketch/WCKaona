"use client";

import { useEffect, useState } from "react";
import { BackOfficeLayout } from "@/components/BackOfficeLayout";
import { LoginRequiredMessage } from "@/components/LoginRequiredMessage";
import { LogoutButton } from "@/components/LogoutButton";
import { StatusBadge } from "@/components/StatusBadge";
import { createBrowserSupabaseClient } from "@/lib/supabase/client";

type InboundReceipt = {
  id: string;
  receipt_no: string;
  truck_plate: string | null;
  status: string;
  received_at: string | null;
  created_by_name: string | null;
  moisture_percent: number | null;
};

type InboundScaleResponse = {
  id?: string;
  status?: string;
  scale_ticket_no?: string | null;
  inbound_weight_kg?: number | null;
  inbound_at?: string | null;
  inbound_by_name?: string | null;
  error?: string;
  detail?: string;
};

type DuplicateTicketWarning = {
  isChecking: boolean;
  message: string;
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

export default function InboundScalePage() {
  const [receipts, setReceipts] = useState<InboundReceipt[]>([]);
  const [ticketNumbers, setTicketNumbers] = useState<Record<string, string>>({});
  const [ticketWarnings, setTicketWarnings] = useState<Record<string, DuplicateTicketWarning>>({});
  const [grossWeights, setGrossWeights] = useState<Record<string, string>>({});
  const [savingReceipts, setSavingReceipts] = useState<Record<string, boolean>>({});
  const [message, setMessage] = useState("กำลังโหลดงานรอชั่งขาเข้า");
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loginRequired, setLoginRequired] = useState(false);

  useEffect(() => {
    let isMounted = true;

    async function loadPendingInboundScale() {
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
          .select("id, receipt_no, truck_plate, status, received_at, created_by_name, moisture_percent")
          .is("deleted_at", null)
          .in("status", ["pending_inbound_scale", "Pending Inbound Scale"])
          .order("created_at", { ascending: false })
          .limit(50);

        if (error) throw error;

        if (isMounted) {
          setReceipts((data ?? []) as InboundReceipt[]);
          setMessage(data?.length ? "" : "ยังไม่มีงานรอชั่งขาเข้า");
        }
      } catch (error) {
        if (isMounted) setMessage(error instanceof Error ? error.message : "โหลดงานชั่งขาเข้าไม่สำเร็จ");
      }
    }

    loadPendingInboundScale();

    return () => {
      isMounted = false;
    };
  }, []);

  async function checkDuplicateTicket(receiptId: string, ticketValue: string) {
    const scaleTicketNo = ticketValue.trim();

    if (!scaleTicketNo) {
      setTicketWarnings((current) => ({ ...current, [receiptId]: { isChecking: false, message: "" } }));
      return "";
    }

    setTicketWarnings((current) => ({ ...current, [receiptId]: { isChecking: true, message: "" } }));

    try {
      const supabase = createBrowserSupabaseClient();
      const { data, error } = await supabase
        .from("wood_receipts")
        .select("id, receipt_no")
        .eq("scale_ticket_no", scaleTicketNo)
        .neq("id", receiptId)
        .is("deleted_at", null)
        .limit(1)
        .maybeSingle();

      if (error) throw error;

      const warningMessage = data?.id ? `เลขตั๋วชั่งนี้ถูกใช้แล้วใน ${data.receipt_no || "receipt อื่น"}` : "";
      setTicketWarnings((current) => ({ ...current, [receiptId]: { isChecking: false, message: warningMessage } }));
      return warningMessage;
    } catch (error) {
      const warningMessage = error instanceof Error ? error.message : "ตรวจเลขตั๋วชั่งไม่สำเร็จ";
      setTicketWarnings((current) => ({ ...current, [receiptId]: { isChecking: false, message: warningMessage } }));
      return warningMessage;
    }
  }

  async function handleSaveInboundScale(receiptId: string) {
    const scaleTicketNo = (ticketNumbers[receiptId] || "").trim();
    const grossWeightKg = parsePositiveWeight(grossWeights[receiptId] || "");

    if (!scaleTicketNo || !grossWeightKg || savingReceipts[receiptId]) return;

    const duplicateWarning = await checkDuplicateTicket(receiptId, scaleTicketNo);
    if (duplicateWarning) return;

    setSavingReceipts((current) => ({ ...current, [receiptId]: true }));
    setMessage("");

    try {
      const supabase = createBrowserSupabaseClient();
      const { data: sessionData, error: sessionError } = await supabase.auth.getSession();

      if (sessionError) throw sessionError;
      if (!sessionData.session?.access_token) throw new Error("กรุณาเข้าสู่ระบบก่อนบันทึกน้ำหนักเข้า");

      const response = await fetch("/api/inbound-scale/save", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${sessionData.session.access_token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          receiptId,
          scaleTicketNo,
          grossWeightKg,
        }),
      });

      const responseBody = (await response.json()) as InboundScaleResponse;
      if (!response.ok) throw new Error(responseBody.detail || responseBody.error || "บันทึกน้ำหนักเข้าไม่สำเร็จ");

      setReceipts((current) => current.filter((receipt) => receipt.id !== receiptId));
      setMessage("บันทึกน้ำหนักเข้าแล้ว และส่งต่องานไปลงสินค้า");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "บันทึกน้ำหนักเข้าไม่สำเร็จ");
    } finally {
      setSavingReceipts((current) => ({ ...current, [receiptId]: false }));
    }
  }

  return (
    <BackOfficeLayout title="ห้องชั่งขาเข้า" subtitle="บันทึกเลขตั๋วชั่งและน้ำหนัก Gross">
      <div className="mb-4 flex justify-end">
        {isAuthenticated ? <LogoutButton /> : null}
      </div>

      <div className="space-y-4">
        {loginRequired ? <LoginRequiredMessage message="กรุณาเข้าสู่ระบบก่อนเปิดห้องชั่งขาเข้า" /> : null}
        {message ? <p className="rounded-2xl bg-white p-4 text-sm font-semibold text-slate-500 shadow-soft">{message}</p> : null}

        {receipts.map((receipt) => {
          const ticketNumber = ticketNumbers[receipt.id] || "";
          const ticketWarning = ticketWarnings[receipt.id] || { isChecking: false, message: "" };
          const grossWeight = grossWeights[receipt.id] || "";
          const parsedWeight = parsePositiveWeight(grossWeight);
          const isSaving = Boolean(savingReceipts[receipt.id]);
          const canSave =
            ticketNumber.trim().length > 0 &&
            ticketNumber.trim().length <= 50 &&
            Boolean(parsedWeight) &&
            !ticketWarning.isChecking &&
            !ticketWarning.message &&
            !isSaving;

          return (
            <article key={receipt.id} className="rounded-3xl bg-white p-5 shadow-soft">
              <div className="grid gap-5 xl:grid-cols-[1fr_420px]">
                <section>
                  <div className="mb-4 flex items-start justify-between gap-3">
                    <div>
                      <p className="text-sm font-semibold uppercase tracking-wide text-brand-primary">Receipt</p>
                      <h2 className="text-xl font-bold text-slate-950">{receipt.receipt_no}</h2>
                      <p className="text-sm text-slate-500">ทะเบียน {receipt.truck_plate || "-"} · {formatDate(receipt.received_at)}</p>
                    </div>
                    <StatusBadge status={receipt.status} />
                  </div>

                  <div className="grid gap-2 text-sm sm:grid-cols-3">
                    <div className="rounded-2xl bg-slate-50 p-3">
                      <p className="text-slate-500">Created by</p>
                      <p className="font-bold text-slate-950">{receipt.created_by_name || "-"}</p>
                    </div>
                    <div className="rounded-2xl bg-slate-50 p-3">
                      <p className="text-slate-500">Moisture</p>
                      <p className="font-bold text-slate-950">{formatNumber(receipt.moisture_percent)}%</p>
                    </div>
                    <div className="rounded-2xl bg-slate-50 p-3">
                      <p className="text-slate-500">Next</p>
                      <p className="font-bold text-slate-950">Pending Unload</p>
                    </div>
                  </div>
                </section>

                <section className="rounded-2xl border border-orange-100 bg-orange-50/40 p-4">
                  <label className="grid gap-2 text-sm" htmlFor={`ticket-${receipt.id}`}>
                    <span className="font-semibold text-slate-600">Scale ticket number</span>
                    <input
                      id={`ticket-${receipt.id}`}
                      value={ticketNumber}
                      onBlur={(event) => checkDuplicateTicket(receipt.id, event.target.value)}
                      onChange={(event) => {
                        setTicketNumbers((current) => ({ ...current, [receipt.id]: event.target.value.slice(0, 50) }));
                        setTicketWarnings((current) => ({ ...current, [receipt.id]: { isChecking: false, message: "" } }));
                      }}
                      className="h-12 rounded-2xl border border-slate-200 bg-white px-4 font-semibold text-slate-950 outline-none focus:border-brand-primary"
                      placeholder="IN-20260605-001"
                    />
                    {ticketWarning.isChecking ? <span className="text-xs font-semibold text-slate-500">กำลังตรวจเลขตั๋วชั่ง</span> : null}
                    {ticketWarning.message ? <span className="text-xs font-semibold text-brand-danger">{ticketWarning.message}</span> : null}
                  </label>

                  <label className="mt-3 grid gap-2 text-sm" htmlFor={`gross-${receipt.id}`}>
                    <span className="font-semibold text-slate-600">Gross weight (kg)</span>
                    <input
                      id={`gross-${receipt.id}`}
                      value={grossWeight}
                      onChange={(event) => setGrossWeights((current) => ({ ...current, [receipt.id]: event.target.value }))}
                      inputMode="decimal"
                      className="h-12 rounded-2xl border border-slate-200 bg-white px-4 font-semibold text-slate-950 outline-none focus:border-brand-primary"
                      placeholder="31,250"
                    />
                  </label>

                  <button
                    type="button"
                    disabled={!canSave}
                    onClick={() => handleSaveInboundScale(receipt.id)}
                    className="mt-4 h-12 w-full rounded-2xl bg-brand-primary px-6 font-bold text-white shadow-soft disabled:bg-slate-300"
                  >
                    {isSaving ? "Saving..." : "บันทึกน้ำหนักเข้า"}
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
