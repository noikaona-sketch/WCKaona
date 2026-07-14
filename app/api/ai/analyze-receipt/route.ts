import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { analyzeReceiptImages } from "@/lib/ai/analyze-receipt-images";
import { normalizeReceiptStatus } from "@/lib/receipt-status";
import { createServerSupabaseClient } from "@/lib/supabase/server";

const analyzableStatuses = new Set(["draft", "submitted", "ai_processing", "ai_failed", "pending_manual_review"]);

function createAuthCheckClient(accessToken: string) {
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

function getReceiptId(value: unknown) {
  if (!value || typeof value !== "object" || !("receiptId" in value)) return "";
  return typeof value.receiptId === "string" ? value.receiptId.trim() : "";
}

export async function POST(request: Request) {
  let receiptId = "";
  let actorId = "";

  try {
    const accessToken = getBearerToken(request);
    if (!accessToken) {
      return NextResponse.json({ error: "Missing authenticated Supabase session" }, { status: 401 });
    }

    const authClient = createAuthCheckClient(accessToken);
    const { data, error } = await authClient.auth.getUser(accessToken);

    if (error || !data.user) {
      return NextResponse.json({ error: "Invalid or expired Supabase session" }, { status: 401 });
    }

    actorId = data.user.id;
    receiptId = getReceiptId(await request.json());
    if (!receiptId) {
      return NextResponse.json({ error: "Missing receiptId" }, { status: 400 });
    }

    const { data: receipt, error: receiptError } = await authClient
      .from("wood_receipts")
      .select("id")
      .eq("id", receiptId)
      .is("deleted_at", null)
      .maybeSingle();

    if (receiptError) throw receiptError;
    if (!receipt) {
      return NextResponse.json({ error: "Receipt not found or not accessible" }, { status: 404 });
    }

    const serverClient = createServerSupabaseClient();
    const { data: beforeReceipt, error: beforeError } = await serverClient
      .from("wood_receipts")
      .select("id, status, truck_plate, moisture_percent")
      .eq("id", receiptId)
      .is("deleted_at", null)
      .single();

    if (beforeError) throw beforeError;

    if (!analyzableStatuses.has(normalizeReceiptStatus(beforeReceipt.status))) {
      return NextResponse.json({ error: "Receipt is not ready for AI analysis" }, { status: 409 });
    }

    const { error: processingError } = await serverClient
      .from("wood_receipts")
      .update({ status: "ai_processing" })
      .eq("id", receiptId)
      .is("deleted_at", null);

    if (processingError) throw processingError;

    const result = await analyzeReceiptImages(receiptId);
    const successPayload = {
      status: "pending_inbound_scale",
      truck_plate: result.truck_plate || null,
      moisture_percent: result.moisture_percent,
    };

    const { data: updatedReceipt, error: updateError } = await serverClient
      .from("wood_receipts")
      .update(successPayload)
      .eq("id", receiptId)
      .is("deleted_at", null)
      .select("id, status, truck_plate, moisture_percent")
      .single();

    if (updateError) throw updateError;

    await serverClient.from("audit_logs").insert({
      wood_receipt_id: receiptId,
      actor_id: actorId,
      action: "ai_analysis_completed",
      entity_type: "wood_receipts",
      entity_id: receiptId,
      before_data: beforeReceipt,
      after_data: successPayload,
      metadata: { source: "ai_analyze_receipt_api" },
    });

    return NextResponse.json({ ...result, receipt: updatedReceipt });
  } catch (error) {
    if (receiptId && actorId) {
      try {
        const serverClient = createServerSupabaseClient();
        const failurePayload = {
          status: "pending_manual_review",
        };

        await serverClient
          .from("wood_receipts")
          .update(failurePayload)
          .eq("id", receiptId)
          .is("deleted_at", null);

        await serverClient.from("audit_logs").insert({
          wood_receipt_id: receiptId,
          actor_id: actorId,
          action: "ai_analysis_failed",
          entity_type: "wood_receipts",
          entity_id: receiptId,
          before_data: null,
          after_data: failurePayload,
          metadata: {
            source: "ai_analyze_receipt_api",
            error: error instanceof Error ? error.message : "AI analysis failed",
          },
        });
      } catch {
        // Preserve the original AI error response if failure-state logging also fails.
      }
    }

    return NextResponse.json(
      { error: error instanceof Error ? error.message : "AI analysis failed" },
      { status: 500 },
    );
  }
}
