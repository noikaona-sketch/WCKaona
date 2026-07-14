import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { getEmployeeNameByUserId } from "@/lib/employee-profile";
import { normalizeReceiptStatus } from "@/lib/receipt-status";
import { createServerSupabaseClient } from "@/lib/supabase/server";

type UnloadConfirmRequest = {
  receiptId?: unknown;
  unloadingLocation?: unknown;
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

function parseUnloadConfirmRequest(value: unknown) {
  const body = (value && typeof value === "object" ? value : {}) as UnloadConfirmRequest;
  const receiptId = typeof body.receiptId === "string" ? body.receiptId.trim() : "";
  const unloadingLocation = typeof body.unloadingLocation === "string" ? body.unloadingLocation.trim().slice(0, 100) : "";

  return { receiptId, unloadingLocation };
}

export async function POST(request: Request) {
  try {
    const accessToken = getBearerToken(request);
    if (!accessToken) {
      return NextResponse.json({ error: "Missing authenticated Supabase session" }, { status: 401 });
    }

    const { receiptId, unloadingLocation } = parseUnloadConfirmRequest(await request.json());
    if (!receiptId) return NextResponse.json({ error: "Missing receiptId" }, { status: 400 });
    if (!unloadingLocation) return NextResponse.json({ error: "unloadingLocation is required" }, { status: 400 });

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
      .select("id, status, unloading_location, unloaded_at, unloaded_by, unloaded_by_name")
      .eq("id", receiptId)
      .is("deleted_at", null)
      .single();

    if (beforeError) throw beforeError;

    if (normalizeReceiptStatus(beforeReceipt.status) !== "pending_unload") {
      return NextResponse.json({ error: "Receipt is not waiting for unload confirmation" }, { status: 409 });
    }

    const unloadedByName = await getEmployeeNameByUserId(serverClient, userData.user.id, userData.user.email || "");
    const unloadedAt = new Date().toISOString();
    const updatePayload = {
      status: "pending_review",
      unloading_location: unloadingLocation,
      unloaded_at: unloadedAt,
      unloaded_by: userData.user.id,
      unloaded_by_name: unloadedByName || null,
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
      actor_id: userData.user.id,
      action: "unload_confirmed",
      entity_type: "wood_receipts",
      entity_id: receiptId,
      before_data: beforeReceipt,
      after_data: updatePayload,
      metadata: { source: "unload_confirm_api", actor_name: unloadedByName || null },
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
