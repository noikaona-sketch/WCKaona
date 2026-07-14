import { NextResponse } from "next/server";
import { requireEmployeeRole } from "@/lib/api/require-employee-role";
import { normalizeReceiptStatus } from "@/lib/receipt-status";
import { createServerSupabaseClient } from "@/lib/supabase/server";

type OutboundScaleRequest = {
  receiptId?: unknown;
  outboundWeightKg?: unknown;
};

function parseWeight(value: unknown) {
  if (typeof value === "number") return value;
  if (typeof value !== "string") return Number.NaN;
  return Number(value.replace(/,/g, "").trim());
}

function parseOutboundScaleRequest(value: unknown) {
  const body = (value && typeof value === "object" ? value : {}) as OutboundScaleRequest;
  const receiptId = typeof body.receiptId === "string" ? body.receiptId.trim() : "";
  const outboundWeightKg = parseWeight(body.outboundWeightKg);

  return { receiptId, outboundWeightKg };
}

export async function POST(request: Request) {
  try {
    const { receiptId, outboundWeightKg } = parseOutboundScaleRequest(await request.json());
    if (!receiptId) return NextResponse.json({ error: "Missing receiptId" }, { status: 400 });
    if (!Number.isFinite(outboundWeightKg) || outboundWeightKg <= 0) {
      return NextResponse.json({ error: "outboundWeightKg must be greater than 0" }, { status: 400 });
    }

    const serverClient = createServerSupabaseClient();
    const roleGuard = await requireEmployeeRole({
      request,
      serverClient,
      allowedRoles: ["outbound_scale", "admin"],
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
      .select("id, status, inbound_weight_kg, outbound_weight_kg, net_weight_kg, outbound_at, outbound_by, outbound_by_name")
      .eq("id", receiptId)
      .is("deleted_at", null)
      .single();

    if (beforeError) throw beforeError;

    if (normalizeReceiptStatus(beforeReceipt.status) !== "pending_outbound_scale") {
      return NextResponse.json({ error: "Receipt is not waiting for outbound scale" }, { status: 409 });
    }

    const inboundWeightKg = Number(beforeReceipt.inbound_weight_kg);
    if (!Number.isFinite(inboundWeightKg) || inboundWeightKg <= 0) {
      return NextResponse.json({ error: "Receipt is missing valid inbound weight" }, { status: 409 });
    }

    if (outboundWeightKg >= inboundWeightKg) {
      return NextResponse.json({ error: "outboundWeightKg must be less than inbound weight" }, { status: 400 });
    }

    const outboundAt = new Date().toISOString();
    const netWeightKg = inboundWeightKg - outboundWeightKg;
    const updatePayload = {
      status: "closed",
      outbound_weight_kg: outboundWeightKg,
      net_weight_kg: netWeightKg,
      outbound_at: outboundAt,
      outbound_by: user.id,
      outbound_by_name: employeeName || null,
    };

    const { data: updatedReceipt, error: updateError } = await serverClient
      .from("wood_receipts")
      .update(updatePayload)
      .eq("id", receiptId)
      .is("deleted_at", null)
      .select("id, status, inbound_weight_kg, outbound_weight_kg, net_weight_kg, outbound_at, outbound_by_name")
      .single();

    if (updateError) throw updateError;

    const { error: auditError } = await serverClient.from("audit_logs").insert({
      wood_receipt_id: receiptId,
      actor_id: user.id,
      action: "outbound_scale_saved",
      entity_type: "wood_receipts",
      entity_id: receiptId,
      before_data: beforeReceipt,
      after_data: updatePayload,
      metadata: { source: "outbound_scale_api", actor_name: employeeName || null, actor_role: employeeRole, role_guard_enforced: roleGuardEnforced },
    });

    if (auditError) {
      return NextResponse.json(
        {
          error: "Outbound scale saved, but audit log insert failed",
          detail: auditError.message,
        },
        { status: 500 },
      );
    }

    return NextResponse.json(updatedReceipt);
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Outbound scale save failed" },
      { status: 500 },
    );
  }
}
