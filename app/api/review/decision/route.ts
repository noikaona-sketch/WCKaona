import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { createServerSupabaseClient } from "@/lib/supabase/server";

type ReviewDecision = "approved" | "rejected";

type ReviewRequest = {
  receiptId?: unknown;
  reviewStatus?: unknown;
  reviewedGrade?: unknown;
  reviewerNote?: unknown;
};

function createUserScopedClient(accessToken: string) {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error("Missing NEXT_PUBLIC_SUPABASE_URL or NEXT_PUBLIC_SUPABASE_ANON_KEY");
  }

  return createClient(supabaseUrl, supabaseAnonKey, {
    global: {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    },
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  });
}

function getBearerToken(request: Request) {
  const authorizationHeader = request.headers.get("authorization") || "";
  const [scheme, token] = authorizationHeader.split(" ");

  if (scheme.toLowerCase() !== "bearer" || !token) return null;
  return token;
}

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
    const accessToken = getBearerToken(request);
    if (!accessToken) {
      return NextResponse.json({ error: "Missing authenticated Supabase session" }, { status: 401 });
    }

    const { receiptId, reviewStatus, reviewedGrade, reviewerNote } = parseReviewRequest(await request.json());
    if (!receiptId) return NextResponse.json({ error: "Missing receiptId" }, { status: 400 });
    if (!reviewStatus) return NextResponse.json({ error: "Invalid reviewStatus" }, { status: 400 });
    if (reviewStatus === "approved" && !reviewedGrade) {
      return NextResponse.json({ error: "reviewedGrade is required for approval" }, { status: 400 });
    }
    if (reviewStatus === "rejected" && !reviewerNote) {
      return NextResponse.json({ error: "reviewerNote is required for rejection" }, { status: 400 });
    }

    const userClient = createUserScopedClient(accessToken);
    const { data: userData, error: userError } = await userClient.auth.getUser(accessToken);

    if (userError || !userData.user) {
      return NextResponse.json({ error: "Invalid or expired Supabase session" }, { status: 401 });
    }

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

    const serverClient = createServerSupabaseClient();
    const { data: beforeReceipt, error: beforeError } = await serverClient
      .from("wood_receipts")
      .select("id, review_status, reviewed_grade, reviewer_note, reviewed_at")
      .eq("id", receiptId)
      .is("deleted_at", null)
      .single();

    if (beforeError) throw beforeError;

    const reviewedAt = new Date().toISOString();
    const updatePayload = {
      review_status: reviewStatus,
      reviewed_grade: reviewedGrade || null,
      reviewer_note: reviewerNote || null,
      reviewed_at: reviewedAt,
      reviewed_by: userData.user.id,
    };

    const { data: updatedReceipt, error: updateError } = await serverClient
      .from("wood_receipts")
      .update(updatePayload)
      .eq("id", receiptId)
      .is("deleted_at", null)
      .select("id, review_status, reviewed_grade, reviewer_note, reviewed_at")
      .single();

    if (updateError) throw updateError;

    const { error: auditError } = await serverClient.from("audit_logs").insert({
      wood_receipt_id: receiptId,
      actor_id: userData.user.id,
      action: reviewStatus === "approved" ? "review_approved" : "review_rejected",
      entity_type: "wood_receipts",
      entity_id: receiptId,
      before_data: beforeReceipt,
      after_data: updatePayload,
      metadata: { source: "review_decision_api" },
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
