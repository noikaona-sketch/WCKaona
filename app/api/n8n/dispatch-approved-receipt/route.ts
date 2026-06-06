import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { dispatchApprovedReceiptToN8n } from "@/lib/n8n/dispatch-approved-receipt";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import type { N8nApprovedReceiptPayload } from "@/lib/n8n/dispatch-approved-receipt";

type DispatchRequest = {
  receiptId?: unknown;
};

type ReceiptRow = {
  id: string;
  receipt_no: string;
  supplier_id: string;
  truck_plate: string | null;
  net_weight_kg: number | null;
  moisture_percent: number | null;
  reviewed_grade: string | null;
  reviewer_note: string | null;
  reviewed_at: string | null;
  unloading_location: string | null;
  review_status: string;
};

type AnalysisRow = Record<string, unknown> | null;

type ImageRow = {
  id: string;
  image_type: string;
  file_path: string;
  file_name: string | null;
  mime_type: string | null;
  file_size_bytes: number | null;
  captured_at: string | null;
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

function getReceiptId(value: unknown) {
  const body = (value && typeof value === "object" ? value : {}) as DispatchRequest;
  return typeof body.receiptId === "string" ? body.receiptId.trim() : "";
}

function buildPayload(receipt: ReceiptRow, aiAnalysis: AnalysisRow, images: ImageRow[]): N8nApprovedReceiptPayload {
  return {
    receipt_id: receipt.id,
    receipt_no: receipt.receipt_no,
    supplier_id: receipt.supplier_id,
    truck_plate: receipt.truck_plate || "",
    net_weight_kg: receipt.net_weight_kg,
    moisture_percent: receipt.moisture_percent,
    reviewed_grade: receipt.reviewed_grade || "",
    reviewer_note: receipt.reviewer_note || "",
    reviewed_at: receipt.reviewed_at || "",
    unloading_location: receipt.unloading_location || "",
    ai_analysis: aiAnalysis ?? {},
    images,
  };
}

export async function POST(request: Request) {
  try {
    const accessToken = getBearerToken(request);
    if (!accessToken) {
      return NextResponse.json({ error: "Missing authenticated Supabase session" }, { status: 401 });
    }

    const receiptId = getReceiptId(await request.json());
    if (!receiptId) return NextResponse.json({ error: "Missing receiptId" }, { status: 400 });

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
    const [receiptResult, analysisResult, imagesResult] = await Promise.all([
      serverClient
        .from("wood_receipts")
        .select("id, receipt_no, supplier_id, truck_plate, net_weight_kg, moisture_percent, reviewed_grade, reviewer_note, reviewed_at, unloading_location, review_status")
        .eq("id", receiptId)
        .is("deleted_at", null)
        .single(),
      serverClient
        .from("ai_analysis")
        .select("truck_plate, moisture_percent, estimated_log_count, estimated_diameter_min_cm, estimated_diameter_max_cm, wood_condition, suggested_grade, confidence, warnings, summary")
        .eq("wood_receipt_id", receiptId)
        .is("deleted_at", null)
        .maybeSingle(),
      serverClient
        .from("receipt_images")
        .select("id, image_type, file_path, file_name, mime_type, file_size_bytes, captured_at")
        .eq("wood_receipt_id", receiptId)
        .is("deleted_at", null)
        .order("image_type", { ascending: true }),
    ]);

    if (receiptResult.error) throw receiptResult.error;
    if (analysisResult.error) throw analysisResult.error;
    if (imagesResult.error) throw imagesResult.error;

    const receipt = receiptResult.data as ReceiptRow;
    if (receipt.review_status !== "approved") {
      return NextResponse.json({ error: "Receipt must be approved before n8n dispatch" }, { status: 409 });
    }

    const payload = buildPayload(receipt, analysisResult.data as AnalysisRow, (imagesResult.data ?? []) as ImageRow[]);
    const dispatchResult = await dispatchApprovedReceiptToN8n(payload);

    const { error: auditError } = await serverClient.from("audit_logs").insert({
      wood_receipt_id: receiptId,
      actor_id: userData.user.id,
      action: "n8n_dispatched",
      entity_type: "wood_receipts",
      entity_id: receiptId,
      before_data: null,
      after_data: payload,
      metadata: {
        source: "n8n_dispatch_api",
        webhook_status: dispatchResult.status,
        webhook_response: dispatchResult.responseText.slice(0, 500),
      },
    });

    if (auditError) {
      return NextResponse.json(
        {
          error: "n8n dispatch succeeded, but audit log insert failed",
          detail: auditError.message,
        },
        { status: 500 },
      );
    }

    return NextResponse.json({ dispatched: true, receipt_id: receiptId });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "n8n dispatch failed" },
      { status: 500 },
    );
  }
}
