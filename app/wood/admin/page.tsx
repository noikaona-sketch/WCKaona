"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { BackOfficeLayout } from "@/components/BackOfficeLayout";
import { LoginRequiredMessage } from "@/components/LoginRequiredMessage";
import { StatusBadge } from "@/components/StatusBadge";
import { employeeRoleLabels, employeeRoles, normalizeEmployeeRole, type EmployeeRole } from "@/lib/employee-roles";
import { getCurrentEmployeeProfile } from "@/lib/employee-profile";
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

type CurrentProfile = {
  displayName: string;
  role: EmployeeRole;
};

type EmployeeProfileAdmin = {
  user_id: string;
  employee_code: string;
  display_name: string;
  phone: string | null;
  role: string | null;
  is_active: boolean;
  created_at: string | null;
  updated_at: string | null;
};

type EmployeeProfilesResponse = {
  error?: string;
  profiles?: EmployeeProfileAdmin[];
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
  ["Users", "มีหน้าจัดการ role และ active status ของ employee profiles แล้ว"],
  ["Roles", "API หลักมี role guard แบบ cutover-safe แล้ว แต่ RLS ยังเป็น broad authenticated access"],
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

async function loadEmployeeProfiles(accessToken: string) {
  const response = await fetch("/api/admin/employee-profiles", {
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  });
  const body = (await response.json()) as EmployeeProfilesResponse;

  if (!response.ok) throw new Error(body.error || "โหลดรายชื่อ employee ไม่สำเร็จ");
  return body.profiles ?? [];
}

export default function AdminPage() {
  const [loadState, setLoadState] = useState<LoadState>("loading");
  const [receipts, setReceipts] = useState<AdminReceipt[]>([]);
  const [employeeProfiles, setEmployeeProfiles] = useState<EmployeeProfileAdmin[]>([]);
  const [currentProfile, setCurrentProfile] = useState<CurrentProfile | null>(null);
  const [message, setMessage] = useState("");
  const [roleMessage, setRoleMessage] = useState("");
  const [savingUserId, setSavingUserId] = useState("");

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

        const profileResult = await getCurrentEmployeeProfile(supabase);
        const [receiptResult, employeeProfileResult] = await Promise.all([
          supabase
            .from("wood_receipts")
            .select(
              "id, receipt_no, truck_plate, status, review_status, n8n_dispatch_status, received_at, inbound_weight_kg, outbound_weight_kg, net_weight_kg, reviewed_grade, created_by_name, reviewed_by_name, unloaded_by_name, ai_analysis(id)",
            )
            .is("deleted_at", null)
            .order("created_at", { ascending: false })
            .limit(80),
          profileResult.role === "admin" ? loadEmployeeProfiles(sessionData.session.access_token) : Promise.resolve([]),
        ]);

        if (receiptResult.error) throw receiptResult.error;

        if (isMounted) {
          setCurrentProfile({ displayName: profileResult.displayName || "-", role: profileResult.role });
          setReceipts((receiptResult.data ?? []) as AdminReceipt[]);
          setEmployeeProfiles(employeeProfileResult);
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

  async function updateEmployeeProfile(userId: string, nextRole: EmployeeRole, nextIsActive: boolean) {
    setSavingUserId(userId);
    setRoleMessage("");

    try {
      const supabase = createBrowserSupabaseClient();
      const { data: sessionData, error: sessionError } = await supabase.auth.getSession();
      if (sessionError) throw sessionError;
      if (!sessionData.session) throw new Error("กรุณาเข้าสู่ระบบก่อนแก้ role");

      const response = await fetch("/api/admin/employee-profiles", {
        method: "PATCH",
        headers: {
          Authorization: `Bearer ${sessionData.session.access_token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ userId, role: nextRole, isActive: nextIsActive }),
      });
      const body = (await response.json()) as { error?: string; profile?: EmployeeProfileAdmin };

      if (!response.ok || !body.profile) throw new Error(body.error || "บันทึก role ไม่สำเร็จ");

      setEmployeeProfiles((current) => current.map((profile) => (profile.user_id === userId ? body.profile! : profile)));
      setRoleMessage("บันทึก role แล้ว");
    } catch (error) {
      setRoleMessage(error instanceof Error ? error.message : "บันทึก role ไม่สำเร็จ");
    } finally {
      setSavingUserId("");
    }
  }

  return (
    <BackOfficeLayout title="Admin Operations" subtitle="Real-time operational status, monitoring, and admin readiness">
      <div className="space-y-5">
        {loadState === "login_required" ? <LoginRequiredMessage message="กรุณาเข้าสู่ระบบก่อนเปิด Admin Operations" /> : null}
        {loadState === "error" ? <p className="rounded-2xl border border-red-200 bg-red-50 p-4 text-sm font-semibold text-red-900">{message}</p> : null}
        {currentProfile ? (
          <section className="flex flex-col gap-2 rounded-2xl border border-slate-200 bg-white p-4 text-sm shadow-soft sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-xs font-black uppercase text-brand-primary">Signed in profile</p>
              <p className="font-bold text-slate-950">{currentProfile.displayName}</p>
            </div>
            <p className="rounded-full bg-slate-100 px-3 py-2 font-bold text-slate-700">{employeeRoleLabels[currentProfile.role]}</p>
          </section>
        ) : null}

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

        {currentProfile?.role === "admin" ? (
          <section className="rounded-2xl bg-white p-4 shadow-soft">
            <div className="mb-3 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="text-xs font-black uppercase text-brand-primary">Employee Roles</p>
                <h2 className="text-lg font-bold text-slate-950">กำหนด role ก่อนเปิด enforcement</h2>
              </div>
              {roleMessage ? <p className="rounded-full bg-slate-100 px-3 py-2 text-sm font-bold text-slate-700">{roleMessage}</p> : null}
            </div>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-slate-100 text-sm">
                <thead className="text-left text-xs font-bold uppercase text-slate-500">
                  <tr>
                    <th className="px-3 py-2">Employee</th>
                    <th className="px-3 py-2">Code</th>
                    <th className="px-3 py-2">Role</th>
                    <th className="px-3 py-2">Active</th>
                    <th className="px-3 py-2">Updated</th>
                    <th className="px-3 py-2">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {employeeProfiles.length === 0 ? (
                    <tr><td className="px-3 py-4 text-slate-500" colSpan={6}>ยังไม่มี employee profile หรือ user นี้ไม่ใช่ admin</td></tr>
                  ) : null}
                  {employeeProfiles.map((profile) => {
                    const profileRole = normalizeEmployeeRole(profile.role);
                    const isSaving = savingUserId === profile.user_id;
                    return (
                      <tr key={profile.user_id} className="align-top">
                        <td className="whitespace-nowrap px-3 py-3">
                          <p className="font-bold text-slate-950">{profile.display_name}</p>
                          <p className="text-xs text-slate-500">{profile.phone || "-"}</p>
                        </td>
                        <td className="whitespace-nowrap px-3 py-3">{profile.employee_code}</td>
                        <td className="whitespace-nowrap px-3 py-3">
                          <select
                            value={profileRole}
                            disabled={isSaving}
                            onChange={(event) => updateEmployeeProfile(profile.user_id, event.target.value as EmployeeRole, profile.is_active)}
                            className="h-10 rounded-xl border border-slate-200 bg-white px-3 font-semibold text-slate-900 outline-none focus:border-brand-primary"
                          >
                            {employeeRoles.map((role) => (
                              <option key={role} value={role}>{employeeRoleLabels[role]}</option>
                            ))}
                          </select>
                        </td>
                        <td className="whitespace-nowrap px-3 py-3">
                          <input
                            type="checkbox"
                            checked={profile.is_active}
                            disabled={isSaving}
                            onChange={(event) => updateEmployeeProfile(profile.user_id, profileRole, event.target.checked)}
                            className="h-5 w-5 accent-brand-primary"
                            aria-label={`Set ${profile.display_name} active`}
                          />
                        </td>
                        <td className="whitespace-nowrap px-3 py-3">{formatDate(profile.updated_at)}</td>
                        <td className="whitespace-nowrap px-3 py-3 text-slate-500">{isSaving ? "Saving..." : "Auto-save"}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </section>
        ) : null}
      </div>
    </BackOfficeLayout>
  );
}
