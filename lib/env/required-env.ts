import "server-only";

const commonEnvNames = [
  "NEXT_PUBLIC_SUPABASE_URL",
  "NEXT_PUBLIC_SUPABASE_ANON_KEY",
  "SUPABASE_SERVICE_ROLE_KEY",
  "N8N_WEBHOOK_URL",
] as const;

const openAiEnvNames = ["OPENAI_API_KEY"] as const;
const claudeEnvNames = ["ANTHROPIC_API_KEY", "ANTHROPIC_VISION_MODEL"] as const;

export type EnvName = (typeof commonEnvNames)[number] | (typeof openAiEnvNames)[number] | (typeof claudeEnvNames)[number];
export type EnvPresenceStatus = "present" | "missing";
export type EnvStatus = Partial<Record<EnvName, EnvPresenceStatus>>;
export type AiProvider = "openai" | "claude";

function getAiProvider(): AiProvider {
  const provider = (process.env.AI_PROVIDER || "openai").trim().toLowerCase();
  return provider === "claude" ? "claude" : "openai";
}

function getRequiredEnvNamesForProvider(provider = getAiProvider()): EnvName[] {
  return [...commonEnvNames, ...(provider === "claude" ? claudeEnvNames : openAiEnvNames)];
}

export function getRequiredEnvStatus(): EnvStatus {
  return getRequiredEnvNamesForProvider().reduce((status, envName) => {
    status[envName] = process.env[envName]?.trim() ? "present" : "missing";
    return status;
  }, {} as EnvStatus);
}

export function getMissingRequiredEnvNames(status = getRequiredEnvStatus()) {
  return getRequiredEnvNamesForProvider().filter((envName) => status[envName] === "missing");
}

export function getEnvValidationContext() {
  return {
    provider: getAiProvider(),
    required: getRequiredEnvNamesForProvider(),
  };
}
