import { NextResponse } from "next/server";
import { getEnvValidationContext, getMissingRequiredEnvNames, getRequiredEnvStatus } from "@/lib/env/required-env";

export const dynamic = "force-dynamic";

export async function GET() {
  const env = getRequiredEnvStatus();
  const missing = getMissingRequiredEnvNames(env);
  const validation = getEnvValidationContext();

  return NextResponse.json(
    {
      ok: missing.length === 0,
      provider: validation.provider,
      required: validation.required,
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
