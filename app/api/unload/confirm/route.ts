import { NextResponse } from "next/server";
import { requireEmployeeRole } from "@/lib/api/require-employee-role";
import { normalizeReceiptStatus } from "@/lib/receipt-status";
import { createServerSupabaseClient } from "@/lib/supabase/server";

type UnloadConfirmRequest = {
  receiptId?: unknown;
  unloadingLocation?: unknown;
};

function parseUnloadConfirmRequest(value: unknown) {
  const body = (value && typeof value === "object" ? value : {}) as UnloadConfirmRequest;
  const receiptId = typeof body.receiptId === "string" ? body.receiptId.trim() : "";
  const unloadingLocation = typeof body.unloadingLocation === "string" ? body.unloadingLocation.trim().slice(0, 100) : "";

  return { receiptId, unloadingLocation };
}

export async function POST(request: Request) {
  try {
    const { receiptId, unloadingLocation } = parseUnloadConfirmRequest(await request.json());
    if (!receiptId) return NextResponse.json({ error: "Missing receiptId" }, { status: 400 });
    if (!unloadingLocation) return NextResponse.json({ error: "unloadingLocation is required" }, { status: 400 });

    const serverClient = createServerSupabaseClient();
    const roleGuard = await requireEmployeeRole({
      request,
      serverClient,
      allowedRoles: ["unload_team", "admin"],
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
      .select("id, status, unloading_location, unloaded_at, unloaded_by, unloaded_by_name")
      .eq("id", receiptId)
      .is("deleted_at", null)
      .single();

    if (beforeError) throw beforeError;

    if (normalizeReceiptStatus(beforeReceipt.status) !== "pending_unload") {
      return NextResponse.json({ error: "Receipt is not waiting for unload confirmation" }, { status: 409 });
    }

    const unloadedAt = new Date().toISOString();
    const updatePayload = {
      status: "pending_review",
      unloading_location: unloadingLocation,
      unloaded_at: unloadedAt,
      unloaded_by: user.id,
      unloaded_by_name: employeeName || null,
    };

    const { data: updatedReceipt, error: updateError } = await serverClient
      .from("wood_receipts")
      .update(updatePayload)
      .eq("id", receiptId)
      .is("deleted_at", null)
      .select("id, status, unloading_location, unloaded_at, unloaded_by_name")
      .single();

    if (updateError) throw updateError;

    const { error: auditError } = await serverClient.from("audit_logs").insert({
      wood_receipt_id: receiptId,
      actor_id: user.id,
      action: "unload_confirmed",
      entity_type: "wood_receipts",
      entity_id: receiptId,
      before_data: beforeReceipt,
      after_data: updatePayload,
      metadata: { source: "unload_confirm_api", actor_name: employeeName || null, actor_role: employeeRole, role_guard_enforced: roleGuardEnforced },
    });

    if (auditError) {
      return NextResponse.json(
        {
          error: "Unload confirmation saved, but audit log insert failed",
          detail: auditError.message,
        },
        { status: 500 },
      );
    }

    return NextResponse.json(updatedReceipt);
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unload confirmation failed" },
      { status: 500 },
    );
  }
}
