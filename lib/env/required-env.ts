import "server-only";

export const requiredEnvNames = [
  "NEXT_PUBLIC_SUPABASE_URL",
  "NEXT_PUBLIC_SUPABASE_ANON_KEY",
  "SUPABASE_SERVICE_ROLE_KEY",
  "OPENAI_API_KEY",
  "N8N_WEBHOOK_URL",
] as const;

export type RequiredEnvName = (typeof requiredEnvNames)[number];
export type EnvPresenceStatus = "present" | "missing";
export type RequiredEnvStatus = Record<RequiredEnvName, EnvPresenceStatus>;

export function getRequiredEnvStatus(): RequiredEnvStatus {
  return requiredEnvNames.reduce((status, envName) => {
    status[envName] = process.env[envName]?.trim() ? "present" : "missing";
    return status;
  }, {} as RequiredEnvStatus);
}

export function getMissingRequiredEnvNames(status = getRequiredEnvStatus()) {
  return requiredEnvNames.filter((envName) => status[envName] === "missing");
}
