"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { LoginRequiredMessage } from "@/components/LoginRequiredMessage";
import { LogoutButton } from "@/components/LogoutButton";
import { createBrowserSupabaseClient } from "@/lib/supabase/client";

type ReceiptRow = {
  id: string;
  receipt_no: string | null;
  truck_plate: string | null;
  review_status: "pending" | "approved" | "rejected" | string | null;
  n8n_dispatch_status: "dispatching" | "dispatched" | "failed" | string | null;
  received_at: string | null;
  reviewed_at: string | null;
  ai_analysis: Array<{ id: string }> | null;
};

type LoadState = "loading" | "ready" | "login_required" | "error";

const statusCards = [
  { key: "total", label: "Total receipts" },
  { key: "pendingAi", label: "Pending AI" },
  { key: "pendingReview", label: "Pending Review" },
  { key: "approved", label: "Approved" },
  { key: "rejected", label: "Rejected" },
  { key: "n8nDispatched", label: "n8n Dispatched" },
  { key: "n8nFailed", label: "n8n Failed" },
] as const;

function formatDate(value: string | null) {
  if (!value) return "-";
  return new Intl.DateTimeFormat("th-TH", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
}

function getAiStatus(receipt: ReceiptRow) {
  return receipt.ai_analysis && receipt.ai_analysis.length > 0 ? "done" : "pending";
}

function getReviewHref(receiptId: string) {
  return `/wood/review/${receiptId}`;
}

export default function AdminStatusPage() {
  const [loadState, setLoadState] = useState<LoadState>("loading");
  const [receipts, setReceipts] = useState<ReceiptRow[]>([]);
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    let isMounted = true;

    async function loadDashboard() {
      setLoadState("loading");
      setErrorMessage("");

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
            "id, receipt_no, truck_plate, review_status, n8n_dispatch_status, received_at, reviewed_at, ai_analysis(id)",
          )
          .is("deleted_at", null)
          .order("created_at", { ascending: false })
          .limit(50);

        if (error) throw error;

        if (isMounted) {
          setReceipts((data ?? []) as ReceiptRow[]);
          setLoadState("ready");
        }
      } catch (error) {
        if (isMounted) {
          setErrorMessage(error instanceof Error ? error.message : "Load status dashboard failed");
          setLoadState("error");
        }
      }
    }

    loadDashboard();

    return () => {
      isMounted = false;
    };
  }, []);

  const metrics = useMemo(() => {
    return {
      total: receipts.length,
      pendingAi: receipts.filter((receipt) => getAiStatus(receipt) === "pending").length,
      pendingReview: receipts.filter((receipt) => (receipt.review_status || "pending") === "pending").length,
      approved: receipts.filter((receipt) => receipt.review_status === "approved").length,
      rejected: receipts.filter((receipt) => receipt.review_status === "rejected").length,
      n8nDispatched: receipts.filter((receipt) => receipt.n8n_dispatch_status === "dispatched").length,
      n8nFailed: receipts.filter((receipt) => receipt.n8n_dispatch_status === "failed").length,
    };
  }, [receipts]);

  return (
    <main className="min-h-screen bg-slate-50 px-4 py-6 text-slate-950 sm:px-6 lg:px-8">
      <div className="mx-auto flex max-w-6xl flex-col gap-6">
        <header className="flex flex-col gap-3 border-b border-slate-200 pb-4 sm:flex-row sm:items-start sm:justify-between">
          <div className="flex flex-col gap-2">
            <p className="text-xs font-bold uppercase text-brand-primary">Admin</p>
            <h1 className="text-2xl font-black">Status Dashboard</h1>
            <p className="max-w-2xl text-sm text-slate-600">
              Read-only E2E smoke test visibility for receipt, AI, review, and n8n dispatch status.
            </p>
          </div>
          {loadState === "ready" ? <LogoutButton /> : null}
        </header>

        {loadState === "login_required" ? <LoginRequiredMessage message="Login required. Please sign in before opening the admin status dashboard." /> : null}

        {loadState === "error" ? (
          <section className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm font-medium text-red-900">
            {errorMessage}
          </section>
        ) : null}

        <section className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {statusCards.map((card) => (
            <article key={card.key} className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
              <p className="text-xs font-bold uppercase text-slate-500">{card.label}</p>
              <p className="mt-2 text-3xl font-black text-slate-950">
                {loadState === "loading" ? "-" : metrics[card.key]}
              </p>
            </article>
          ))}
        </section>

        <section className="overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm">
          <div className="border-b border-slate-200 px-4 py-3">
            <h2 className="text-sm font-black uppercase text-slate-600">Receipts</h2>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-slate-200 text-sm">
              <thead className="bg-slate-100 text-left text-xs font-bold uppercase text-slate-600">
                <tr>
                  <th className="px-4 py-3">receipt_no</th>
                  <th className="px-4 py-3">truck_plate</th>
                  <th className="px-4 py-3">review_status</th>
                  <th className="px-4 py-3">AI status</th>
                  <th className="px-4 py-3">n8n_dispatch_status</th>
                  <th className="px-4 py-3">received_at</th>
                  <th className="px-4 py-3">reviewed_at</th>
                  <th className="px-4 py-3">review detail</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {loadState === "loading" ? (
                  <tr>
                    <td className="px-4 py-6 text-slate-500" colSpan={8}>
                      Loading status data...
                    </td>
                  </tr>
                ) : null}
                {loadState === "ready" && receipts.length === 0 ? (
                  <tr>
                    <td className="px-4 py-6 text-slate-500" colSpan={8}>
                      No active receipts found.
                    </td>
                  </tr>
                ) : null}
                {loadState === "ready"
                  ? receipts.map((receipt) => (
                      <tr key={receipt.id} className="align-top">
                        <td className="whitespace-nowrap px-4 py-3 font-bold">{receipt.receipt_no || "-"}</td>
                        <td className="whitespace-nowrap px-4 py-3">{receipt.truck_plate || "-"}</td>
                        <td className="whitespace-nowrap px-4 py-3">{receipt.review_status || "pending"}</td>
                        <td className="whitespace-nowrap px-4 py-3">{getAiStatus(receipt)}</td>
                        <td className="whitespace-nowrap px-4 py-3">{receipt.n8n_dispatch_status || "-"}</td>
                        <td className="whitespace-nowrap px-4 py-3">{formatDate(receipt.received_at)}</td>
                        <td className="whitespace-nowrap px-4 py-3">{formatDate(receipt.reviewed_at)}</td>
                        <td className="whitespace-nowrap px-4 py-3">
                          <Link className="font-bold text-brand-primary underline-offset-4 hover:underline" href={getReviewHref(receipt.id)}>
                            Open
                          </Link>
                        </td>
                      </tr>
                    ))
                  : null}
              </tbody>
            </table>
          </div>
        </section>
      </div>
    </main>
  );
}
