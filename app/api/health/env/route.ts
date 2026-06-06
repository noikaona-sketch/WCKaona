import { NextResponse } from "next/server";
import { getMissingRequiredEnvNames, getRequiredEnvStatus } from "@/lib/env/required-env";

export const dynamic = "force-dynamic";

export async function GET() {
  const env = getRequiredEnvStatus();
  const missing = getMissingRequiredEnvNames(env);

  return NextResponse.json(
    {
      ok: missing.length === 0,
      env,
      missing,
    },
    {
      headers: {
        "Cache-Control": "no-store",
      },
    },
  );
}
