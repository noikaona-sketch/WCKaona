import { NextResponse } from "next/server";
import { requireEmployeeRole } from "@/lib/api/require-employee-role";
import { normalizeReceiptStatus } from "@/lib/receipt-status";
import { createServerSupabaseClient } from "@/lib/supabase/server";

type InboundScaleRequest = {
  receiptId?: unknown;
  scaleTicketNo?: unknown;
  grossWeightKg?: unknown;
};

function parseWeight(value: unknown) {
  if (typeof value === "number") return value;
  if (typeof value !== "string") return Number.NaN;
  return Number(value.replace(/,/g, "").trim());
}

function parseInboundScaleRequest(value: unknown) {
  const body = (value && typeof value === "object" ? value : {}) as InboundScaleRequest;
  const receiptId = typeof body.receiptId === "string" ? body.receiptId.trim() : "";
  const scaleTicketNo = typeof body.scaleTicketNo === "string" ? body.scaleTicketNo.trim().slice(0, 50) : "";
  const grossWeightKg = parseWeight(body.grossWeightKg);

  return { receiptId, scaleTicketNo, grossWeightKg };
}

export async function POST(request: Request) {
  try {
    const { receiptId, scaleTicketNo, grossWeightKg } = parseInboundScaleRequest(await request.json());
    if (!receiptId) return NextResponse.json({ error: "Missing receiptId" }, { status: 400 });
    if (!scaleTicketNo) return NextResponse.json({ error: "scaleTicketNo is required" }, { status: 400 });
    if (!Number.isFinite(grossWeightKg) || grossWeightKg <= 0) {
      return NextResponse.json({ error: "grossWeightKg must be greater than 0" }, { status: 400 });
    }

    const serverClient = createServerSupabaseClient();
    const roleGuard = await requireEmployeeRole({
      request,
      serverClient,
      allowedRoles: ["inbound_scale", "admin"],
    });
    if (!roleGuard.ok) return roleGuard.response;

    const { userClient, user, employeeName, employeeRole, roleGuardEnforced } = roleGuard.guard;
    const { data: receiptAccess, error: accessError } = await userClient
      .from("wood_receipts")
      .select("id")
      .eq("id", receiptId)
      .is("deleted_at", null)
      .maybeSingle();

    if (accessError) throw accessError;
    if (!receiptAccess) {
      return NextResponse.json({ error: "Receipt not found or not accessible" }, { status: 404 });
    }

    const { data: beforeReceipt, error: beforeError } = await serverClient
      .from("wood_receipts")
      .select("id, status, scale_ticket_no, inbound_weight_kg, inbound_at, inbound_by, inbound_by_name")
      .eq("id", receiptId)
      .is("deleted_at", null)
      .single();

    if (beforeError) throw beforeError;

    if (normalizeReceiptStatus(beforeReceipt.status) !== "pending_inbound_scale") {
      return NextResponse.json({ error: "Receipt is not waiting for inbound scale" }, { status: 409 });
    }

    const inboundAt = new Date().toISOString();
    const updatePayload = {
      status: "pending_unload",
      scale_ticket_no: scaleTicketNo,
      inbound_weight_kg: grossWeightKg,
      inbound_at: inboundAt,
      inbound_by: user.id,
      inbound_by_name: employeeName || null,
    };

    const { data: updatedReceipt, error: updateError } = await serverClient
      .from("wood_receipts")
      .update(updatePayload)
      .eq("id", receiptId)
      .is("deleted_at", null)
      .select("id, status, scale_ticket_no, inbound_weight_kg, inbound_at, inbound_by_name")
      .single();

    if (updateError) {
      if (updateError.code === "23505") {
        return NextResponse.json({ error: "Duplicate scale ticket number" }, { status: 409 });
      }
      throw updateError;
    }

    const { error: auditError } = await serverClient.from("audit_logs").insert({
      wood_receipt_id: receiptId,
      actor_id: user.id,
      action: "inbound_scale_saved",
      entity_type: "wood_receipts",
      entity_id: receiptId,
      before_data: beforeReceipt,
      after_data: updatePayload,
      metadata: { source: "inbound_scale_api", actor_name: employeeName || null, actor_role: employeeRole, role_guard_enforced: roleGuardEnforced },
    });

    if (auditError) {
      return NextResponse.json(
        {
          error: "Inbound scale saved, but audit log insert failed",
          detail: auditError.message,
        },
        { status: 500 },
      );
    }

    return NextResponse.json(updatedReceipt);
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Inbound scale save failed" },
      { status: 500 },
    );
  }
}
