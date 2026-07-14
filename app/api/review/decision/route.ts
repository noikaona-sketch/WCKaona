import { NextResponse } from "next/server";
import { requireEmployeeRole } from "@/lib/api/require-employee-role";
import { normalizeReceiptStatus } from "@/lib/receipt-status";
import { createServerSupabaseClient } from "@/lib/supabase/server";

type ReviewRequest = {
  receiptId?: unknown;
  reviewStatus?: unknown;
  reviewedGrade?: unknown;
  reviewerNote?: unknown;
};

function parseReviewRequest(value: unknown) {
  const body = (value && typeof value === "object" ? value : {}) as ReviewRequest;
  const receiptId = typeof body.receiptId === "string" ? body.receiptId.trim() : "";
  const reviewStatus = body.reviewStatus === "approved" || body.reviewStatus === "rejected" ? body.reviewStatus : null;
  const reviewedGrade = typeof body.reviewedGrade === "string" ? body.reviewedGrade.trim().slice(0, 20) : "";
  const reviewerNote = typeof body.reviewerNote === "string" ? body.reviewerNote.trim().slice(0, 300) : "";

  return { receiptId, reviewStatus, reviewedGrade, reviewerNote };
}

export async function POST(request: Request) {
  try {
    const { receiptId, reviewStatus, reviewedGrade, reviewerNote } = parseReviewRequest(await request.json());
    if (!receiptId) return NextResponse.json({ error: "Missing receiptId" }, { status: 400 });
    if (!reviewStatus) return NextResponse.json({ error: "Invalid reviewStatus" }, { status: 400 });
    if (reviewStatus === "approved" && !reviewedGrade) {
      return NextResponse.json({ error: "reviewedGrade is required for approval" }, { status: 400 });
    }
    if (reviewStatus === "rejected" && !reviewerNote) {
      return NextResponse.json({ error: "reviewerNote is required for rejection" }, { status: 400 });
    }

    const serverClient = createServerSupabaseClient();
    const roleGuard = await requireEmployeeRole({
      request,
      serverClient,
      allowedRoles: ["inspector", "admin"],
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
      .select("id, status, review_status, reviewed_grade, reviewer_note, reviewed_at, reviewed_by_name")
      .eq("id", receiptId)
      .is("deleted_at", null)
      .single();

    if (beforeError) throw beforeError;

    const currentStatus = normalizeReceiptStatus(beforeReceipt.status);
    if (currentStatus !== "pending_review" && currentStatus !== "pending_manual_review") {
      return NextResponse.json({ error: "Receipt is not waiting for review" }, { status: 409 });
    }

    const reviewedAt = new Date().toISOString();
    const updatePayload = {
      status: reviewStatus === "approved" ? "pending_outbound_scale" : "rejected",
      review_status: reviewStatus,
      reviewed_grade: reviewedGrade || null,
      reviewer_note: reviewerNote || null,
      reviewed_at: reviewedAt,
      reviewed_by: user.id,
      reviewed_by_name: employeeName || null,
    };

    const { data: updatedReceipt, error: updateError } = await serverClient
      .from("wood_receipts")
      .update(updatePayload)
      .eq("id", receiptId)
      .is("deleted_at", null)
      .select("id, status, review_status, reviewed_grade, reviewer_note, reviewed_at, reviewed_by_name")
      .single();

    if (updateError) throw updateError;

    const { error: auditError } = await serverClient.from("audit_logs").insert({
      wood_receipt_id: receiptId,
      actor_id: user.id,
      action: reviewStatus === "approved" ? "review_approved" : "review_rejected",
      entity_type: "wood_receipts",
      entity_id: receiptId,
      before_data: beforeReceipt,
      after_data: updatePayload,
      metadata: { source: "review_decision_api", actor_name: employeeName || null, actor_role: employeeRole, role_guard_enforced: roleGuardEnforced },
    });

    if (auditError) {
      return NextResponse.json(
        {
          error: "Review decision saved, but audit log insert failed",
          detail: auditError.message,
        },
        { status: 500 },
      );
    }

    return NextResponse.json(updatedReceipt);
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Review decision save failed" },
      { status: 500 },
    );
  }
}
