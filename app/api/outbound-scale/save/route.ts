import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { getEmployeeNameByUserId } from "@/lib/employee-profile";
import { normalizeReceiptStatus } from "@/lib/receipt-status";
import { createServerSupabaseClient } from "@/lib/supabase/server";

type OutboundScaleRequest = {
  receiptId?: unknown;
  outboundWeightKg?: unknown;
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
    const accessToken = getBearerToken(request);
    if (!accessToken) {
      return NextResponse.json({ error: "Missing authenticated Supabase session" }, { status: 401 });
    }

    const { receiptId, outboundWeightKg } = parseOutboundScaleRequest(await request.json());
    if (!receiptId) return NextResponse.json({ error: "Missing receiptId" }, { status: 400 });
    if (!Number.isFinite(outboundWeightKg) || outboundWeightKg <= 0) {
      return NextResponse.json({ error: "outboundWeightKg must be greater than 0" }, { status: 400 });
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

    const outboundByName = await getEmployeeNameByUserId(serverClient, userData.user.id, userData.user.email || "");
    const outboundAt = new Date().toISOString();
    const netWeightKg = inboundWeightKg - outboundWeightKg;
    const updatePayload = {
      status: "closed",
      outbound_weight_kg: outboundWeightKg,
      net_weight_kg: netWeightKg,
      outbound_at: outboundAt,
      outbound_by: userData.user.id,
      outbound_by_name: outboundByName || null,
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
      actor_id: userData.user.id,
      action: "outbound_scale_saved",
      entity_type: "wood_receipts",
      entity_id: receiptId,
      before_data: beforeReceipt,
      after_data: updatePayload,
      metadata: { source: "outbound_scale_api", actor_name: outboundByName || null },
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
