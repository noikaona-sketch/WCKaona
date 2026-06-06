import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { analyzeReceiptImages } from "@/lib/ai/analyze-receipt-images";

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

    const receiptId = getReceiptId(await request.json());
    if (!receiptId) {
      return NextResponse.json({ error: "Missing receiptId" }, { status: 400 });
    }

    const result = await analyzeReceiptImages(receiptId);
    return NextResponse.json(result);
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "AI analysis failed" },
      { status: 500 },
    );
  }
}
