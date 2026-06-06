import "server-only";

import type { SupabaseClient } from "@supabase/supabase-js";
import { createServerSupabaseClient } from "@/lib/supabase/server";

const BUCKET_NAME = "wood-receipts";
const DEFAULT_OPENAI_MODEL = "gpt-4.1-mini";
const DEFAULT_ANTHROPIC_MODEL = "claude-haiku-4-5-20251001";
const PROMPT_VERSION = "receipt-vision-v1";
const REQUIRED_IMAGE_TYPES = ["size", "moisture", "license"] as const;
const MAX_WARNINGS = 10;
const MAX_WARNING_LENGTH = 200;
const ANALYSIS_PROMPT =
  "Analyze these wood receipt images and return JSON only. Use null when a number cannot be read confidently. Do not include markdown.";

type AiProvider = "openai" | "claude";

export type ReceiptVisionAnalysisResult = {
  truck_plate: string;
  moisture_percent: number | null;
  estimated_log_count: number | null;
  estimated_diameter_min_cm: number | null;
  estimated_diameter_max_cm: number | null;
  wood_condition: string;
  suggested_grade: string;
  confidence: number;
  warnings: string[];
};

type ReceiptImageRow = {
  image_type: string;
  file_path: string;
  mime_type: string | null;
};

type ImageDataUrl = {
  imageType: string;
  imageUrl: string;
  mimeType: string;
  base64Data: string;
};

type VisionProviderResult = {
  provider: AiProvider;
  modelName: string;
  rawResponse: unknown;
  result: ReceiptVisionAnalysisResult;
};

type OpenAIResponseContent = {
  text?: unknown;
};

type OpenAIResponseItem = {
  content?: OpenAIResponseContent[];
};

type OpenAIResponseBody = {
  output_text?: unknown;
  output?: OpenAIResponseItem[];
  error?: { message?: string } | string;
};

type AnthropicResponseContent = {
  type?: unknown;
  text?: unknown;
};

type AnthropicResponseBody = {
  content?: AnthropicResponseContent[];
  error?: { message?: string } | string;
};

const receiptAnalysisJsonSchema = {
  type: "object",
  additionalProperties: false,
  properties: {
    truck_plate: { type: "string" },
    moisture_percent: { type: ["number", "null"] },
    estimated_log_count: { type: ["number", "null"] },
    estimated_diameter_min_cm: { type: ["number", "null"] },
    estimated_diameter_max_cm: { type: ["number", "null"] },
    wood_condition: { type: "string" },
    suggested_grade: { type: "string" },
    confidence: { type: "number", minimum: 0, maximum: 100 },
    warnings: { type: "array", items: { type: "string" } },
  },
  required: [
    "truck_plate",
    "moisture_percent",
    "estimated_log_count",
    "estimated_diameter_min_cm",
    "estimated_diameter_max_cm",
    "wood_condition",
    "suggested_grade",
    "confidence",
    "warnings",
  ],
};

const emptyResult: ReceiptVisionAnalysisResult = {
  truck_plate: "",
  moisture_percent: null,
  estimated_log_count: null,
  estimated_diameter_min_cm: null,
  estimated_diameter_max_cm: null,
  wood_condition: "",
  suggested_grade: "",
  confidence: 0,
  warnings: [],
};

function getAiProvider(): AiProvider {
  const provider = (process.env.AI_PROVIDER || "openai").trim().toLowerCase();
  if (provider === "openai" || provider === "claude") return provider;
  throw new Error("Invalid AI_PROVIDER. Use openai or claude.");
}

function clampConfidence(value: unknown) {
  const numberValue = typeof value === "number" ? value : Number(value);
  if (!Number.isFinite(numberValue)) return 0;
  return Math.min(100, Math.max(0, Math.round(numberValue)));
}

function boundedNumber(value: unknown, options?: { min?: number; max?: number; integer?: boolean }) {
  if (value === null || value === undefined || value === "") return null;

  const numberValue = typeof value === "number" ? value : Number(value);
  if (!Number.isFinite(numberValue)) return null;
  if (options?.min !== undefined && numberValue < options.min) return null;
  if (options?.max !== undefined && numberValue > options.max) return null;

  return options?.integer ? Math.round(numberValue) : numberValue;
}

function normalizeWarnings(value: unknown) {
  if (!Array.isArray(value)) return [];

  return value
    .filter((warning): warning is string => typeof warning === "string")
    .map((warning) => warning.trim().slice(0, MAX_WARNING_LENGTH))
    .filter(Boolean)
    .slice(0, MAX_WARNINGS);
}

function normalizeAnalysisResult(value: Partial<ReceiptVisionAnalysisResult>): ReceiptVisionAnalysisResult {
  return {
    truck_plate: typeof value.truck_plate === "string" ? value.truck_plate.trim() : "",
    moisture_percent: boundedNumber(value.moisture_percent, { min: 0, max: 100 }),
    estimated_log_count: boundedNumber(value.estimated_log_count, { min: 0, integer: true }),
    estimated_diameter_min_cm: boundedNumber(value.estimated_diameter_min_cm, { min: 0 }),
    estimated_diameter_max_cm: boundedNumber(value.estimated_diameter_max_cm, { min: 0 }),
    wood_condition: typeof value.wood_condition === "string" ? value.wood_condition.trim() : "",
    suggested_grade: typeof value.suggested_grade === "string" ? value.suggested_grade.trim() : "",
    confidence: clampConfidence(value.confidence),
    warnings: normalizeWarnings(value.warnings),
  };
}

function parseVisionJson(responseText: string) {
  if (!responseText) return emptyResult;

  try {
    return JSON.parse(responseText) as Partial<ReceiptVisionAnalysisResult>;
  } catch {
    throw new Error("Vision AI returned invalid JSON");
  }
}

function extractOpenAIResponseText(responseJson: OpenAIResponseBody) {
  if (typeof responseJson.output_text === "string") return responseJson.output_text;
  if (!Array.isArray(responseJson.output)) return "";

  return responseJson.output
    .flatMap((item) => item.content ?? [])
    .map((contentItem) => (typeof contentItem.text === "string" ? contentItem.text : ""))
    .join("\n")
    .trim();
}

function extractAnthropicResponseText(responseJson: AnthropicResponseBody) {
  if (!Array.isArray(responseJson.content)) return "";

  return responseJson.content
    .filter((contentItem) => contentItem.type === "text")
    .map((contentItem) => (typeof contentItem.text === "string" ? contentItem.text : ""))
    .join("\n")
    .trim();
}

function getProviderErrorMessage(error: OpenAIResponseBody["error"] | AnthropicResponseBody["error"], fallback: string) {
  if (typeof error === "string") return error;
  if (error?.message) return error.message;
  return fallback;
}

function splitDataUrl(dataUrl: string, fallbackMimeType: string) {
  const match = dataUrl.match(/^data:([^;]+);base64,(.+)$/);
  if (!match) return { mimeType: fallbackMimeType, base64Data: dataUrl };

  return { mimeType: match[1] || fallbackMimeType, base64Data: match[2] || "" };
}

async function blobToImageDataUrl(blob: Blob, mimeType: string): Promise<ImageDataUrl["imageUrl"]> {
  const buffer = Buffer.from(await blob.arrayBuffer());
  return `data:${mimeType};base64,${buffer.toString("base64")}`;
}

async function fetchReceiptImages(supabase: SupabaseClient, receiptId: string) {
  const { data, error } = await supabase
    .from("receipt_images")
    .select("image_type, file_path, mime_type")
    .eq("wood_receipt_id", receiptId)
    .is("deleted_at", null)
    .in("image_type", [...REQUIRED_IMAGE_TYPES]);

  if (error) throw error;

  const images = (data ?? []) as ReceiptImageRow[];
  const missingImageTypes = REQUIRED_IMAGE_TYPES.filter(
    (imageType) => !images.some((image) => image.image_type === imageType),
  );

  if (missingImageTypes.length > 0) {
    throw new Error(`Missing receipt images: ${missingImageTypes.join(", ")}`);
  }

  return REQUIRED_IMAGE_TYPES.map((imageType) => images.find((image) => image.image_type === imageType) as ReceiptImageRow);
}

async function downloadReceiptImageDataUrls(supabase: SupabaseClient, images: ReceiptImageRow[]) {
  return Promise.all(
    images.map(async (image) => {
      const mimeType = image.mime_type || "image/jpeg";
      const { data, error } = await supabase.storage.from(BUCKET_NAME).download(image.file_path);
      if (error) throw error;

      const imageUrl = await blobToImageDataUrl(data, mimeType);
      const { base64Data } = splitDataUrl(imageUrl, mimeType);

      return {
        imageType: image.image_type,
        imageUrl,
        mimeType,
        base64Data,
      };
    }),
  );
}

async function requestOpenAIVisionAnalysis(imageDataUrls: ImageDataUrl[]): Promise<VisionProviderResult> {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) throw new Error("Missing OPENAI_API_KEY");

  const modelName = process.env.OPENAI_VISION_MODEL || DEFAULT_OPENAI_MODEL;
  const response = await fetch("https://api.openai.com/v1/responses", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: modelName,
      input: [
        {
          role: "user",
          content: [
            {
              type: "input_text",
              text: ANALYSIS_PROMPT,
            },
            ...imageDataUrls.map((image) => ({
              type: "input_image",
              image_url: image.imageUrl,
              detail: image.imageType === "license" || image.imageType === "moisture" ? "high" : "auto",
            })),
          ],
        },
      ],
      text: {
        format: {
          type: "json_schema",
          name: "receipt_vision_analysis",
          strict: true,
          schema: receiptAnalysisJsonSchema,
        },
      },
    }),
  });

  const responseJson = (await response.json()) as OpenAIResponseBody;
  if (!response.ok) throw new Error(getProviderErrorMessage(responseJson.error, "OpenAI Vision request failed"));

  const parsedResult = parseVisionJson(extractOpenAIResponseText(responseJson));

  return {
    provider: "openai",
    modelName,
    rawResponse: responseJson,
    result: normalizeAnalysisResult(parsedResult),
  };
}

async function requestClaudeVisionAnalysis(imageDataUrls: ImageDataUrl[]): Promise<VisionProviderResult> {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) throw new Error("Missing ANTHROPIC_API_KEY");

  const modelName = process.env.ANTHROPIC_VISION_MODEL || DEFAULT_ANTHROPIC_MODEL;
  const response = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "x-api-key": apiKey,
      "anthropic-version": "2023-06-01",
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: modelName,
      max_tokens: 1024,
      messages: [
        {
          role: "user",
          content: [
            {
              type: "text",
              text: `${ANALYSIS_PROMPT}\n\nReturn exactly this JSON shape with no extra keys: ${JSON.stringify(emptyResult)}`,
            },
            ...imageDataUrls.map((image) => ({
              type: "image",
              source: {
                type: "base64",
                media_type: image.mimeType,
                data: image.base64Data,
              },
            })),
          ],
        },
      ],
    }),
  });

  const responseJson = (await response.json()) as AnthropicResponseBody;
  if (!response.ok) throw new Error(getProviderErrorMessage(responseJson.error, "Claude Vision request failed"));

  const parsedResult = parseVisionJson(extractAnthropicResponseText(responseJson));

  return {
    provider: "claude",
    modelName,
    rawResponse: responseJson,
    result: normalizeAnalysisResult(parsedResult),
  };
}

async function requestVisionAnalysis(imageDataUrls: ImageDataUrl[]) {
  const provider = getAiProvider();

  if (provider === "claude") return requestClaudeVisionAnalysis(imageDataUrls);
  return requestOpenAIVisionAnalysis(imageDataUrls);
}

export async function analyzeReceiptImages(receiptId: string): Promise<ReceiptVisionAnalysisResult> {
  const supabase = createServerSupabaseClient();
  const images = await fetchReceiptImages(supabase, receiptId);
  const imageDataUrls = await downloadReceiptImageDataUrls(supabase, images);
  const { provider, modelName, rawResponse, result } = await requestVisionAnalysis(imageDataUrls);

  const { error } = await supabase.from("ai_analysis").upsert(
    {
      wood_receipt_id: receiptId,
      model_name: modelName,
      prompt_version: `${PROMPT_VERSION}-${provider}`,
      truck_plate: result.truck_plate,
      moisture_percent: result.moisture_percent,
      estimated_log_count: result.estimated_log_count,
      estimated_diameter_min_cm: result.estimated_diameter_min_cm,
      estimated_diameter_max_cm: result.estimated_diameter_max_cm,
      wood_condition: result.wood_condition,
      suggested_grade: result.suggested_grade,
      confidence: result.confidence,
      warnings: result.warnings,
      raw_response: { provider, response: rawResponse },
      summary: null,
    },
    { onConflict: "wood_receipt_id" },
  );

  if (error) throw error;

  return result;
}
