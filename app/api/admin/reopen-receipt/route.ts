import { NextResponse } from "next/server";
import { requireEmployeeRole } from "@/lib/api/require-employee-role";
import { normalizeReceiptStatus, type ReceiptStatus } from "@/lib/receipt-status";
import { createServerSupabaseClient } from "@/lib/supabase/server";

type ReopenTargetStatus = Extract<ReceiptStatus, "pending_inbound_scale" | "pending_review" | "pending_outbound_scale">;

type ReopenReceiptRequest = {
  receiptId?: unknown;
  targetStatus?: unknown;
  note?: unknown;
};

const allowedTargetStatuses = new Set<ReopenTargetStatus>(["pending_inbound_scale", "pending_review", "pending_outbound_scale"]);

function parseReopenReceiptRequest(value: unknown) {
  const body = (value && typeof value === "object" ? value : {}) as ReopenReceiptRequest;
  const receiptId = typeof body.receiptId === "string" ? body.receiptId.trim() : "";
  const targetStatus = typeof body.targetStatus === "string" && allowedTargetStatuses.has(body.targetStatus as ReopenTargetStatus)
    ? (body.targetStatus as ReopenTargetStatus)
    : null;
  const note = typeof body.note === "string" ? body.note.trim().slice(0, 500) : "";

  return { receiptId, targetStatus, note };
}

export async function POST(request: Request) {
  try {
    const serverClient = createServerSupabaseClient();
    const roleGuard = await requireEmployeeRole({
      request,
      serverClient,
      allowedRoles: ["admin"],
      enforce: true,
    });
    if (!roleGuard.ok) return roleGuard.response;

    const { user, employeeName, employeeRole } = roleGuard.guard;
    const { receiptId, targetStatus, note } = parseReopenReceiptRequest(await request.json());

    if (!receiptId) return NextResponse.json({ error: "Missing receiptId" }, { status: 400 });
    if (!targetStatus) return NextResponse.json({ error: "Invalid targetStatus" }, { status: 400 });
    if (note.length < 5) return NextResponse.json({ error: "Reopen note must be at least 5 characters" }, { status: 400 });

    const { data: beforeReceipt, error: beforeError } = await serverClient
      .from("wood_receipts")
      .select("id, receipt_no, status, inbound_weight_kg, review_status, reviewed_grade, outbound_weight_kg, net_weight_kg, reopened_at, reopened_by_name, reopen_note")
      .eq("id", receiptId)
      .is("deleted_at", null)
      .single();

    if (beforeError) throw beforeError;

    if (normalizeReceiptStatus(beforeReceipt.status) !== "closed") {
      return NextResponse.json({ error: "Only closed receipts can be reopened" }, { status: 409 });
    }

    if (targetStatus === "pending_outbound_scale") {
      const inboundWeightKg = Number(beforeReceipt.inbound_weight_kg);
      if (!Number.isFinite(inboundWeightKg) || inboundWeightKg <= 0) {
        return NextResponse.json({ error: "Receipt needs valid inbound weight before reopening to outbound scale" }, { status: 409 });
      }
    }

    const reopenedAt = new Date().toISOString();
    const updatePayload = {
      status: targetStatus,
      reopened_at: reopenedAt,
      reopened_by: user.id,
      reopened_by_name: employeeName || null,
      reopen_note: note,
    };

    const { data: updatedReceipt, error: updateError } = await serverClient
      .from("wood_receipts")
      .update(updatePayload)
      .eq("id", receiptId)
      .is("deleted_at", null)
      .select("id, receipt_no, status, review_status, reviewed_grade, inbound_weight_kg, outbound_weight_kg, net_weight_kg, reopened_at, reopened_by_name, reopen_note")
      .single();

    if (updateError) throw updateError;

    const { error: auditError } = await serverClient.from("audit_logs").insert({
      wood_receipt_id: receiptId,
      actor_id: user.id,
      action: "receipt_reopened",
      entity_type: "wood_receipts",
      entity_id: receiptId,
      before_data: beforeReceipt,
      after_data: updatedReceipt,
      metadata: { source: "admin_reopen_receipt_api", actor_name: employeeName, actor_role: employeeRole, target_status: targetStatus },
    });

    if (auditError) {
      return NextResponse.json(
        {
          error: "Receipt reopened, but audit log insert failed",
          detail: auditError.message,
        },
        { status: 500 },
      );
    }

    return NextResponse.json({ receipt: updatedReceipt });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Reopen receipt failed" },
      { status: 500 },
    );
  }
}
