import "server-only";

import type { SupabaseClient } from "@supabase/supabase-js";
import { createServerSupabaseClient } from "@/lib/supabase/server";

const BUCKET_NAME = "wood-receipts";
const DEFAULT_MODEL = "gpt-4.1-mini";
const PROMPT_VERSION = "receipt-vision-v1";
const REQUIRED_IMAGE_TYPES = ["size", "moisture", "license"] as const;

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

function clampConfidence(value: unknown) {
  const numberValue = typeof value === "number" ? value : Number(value);
  if (!Number.isFinite(numberValue)) return 0;
  return Math.min(100, Math.max(0, Math.round(numberValue)));
}

function nullableNumber(value: unknown) {
  if (value === null || value === undefined || value === "") return null;
  const numberValue = typeof value === "number" ? value : Number(value);
  return Number.isFinite(numberValue) ? numberValue : null;
}

function normalizeAnalysisResult(value: Partial<ReceiptVisionAnalysisResult>): ReceiptVisionAnalysisResult {
  return {
    truck_plate: typeof value.truck_plate === "string" ? value.truck_plate.trim() : "",
    moisture_percent: nullableNumber(value.moisture_percent),
    estimated_log_count: nullableNumber(value.estimated_log_count),
    estimated_diameter_min_cm: nullableNumber(value.estimated_diameter_min_cm),
    estimated_diameter_max_cm: nullableNumber(value.estimated_diameter_max_cm),
    wood_condition: typeof value.wood_condition === "string" ? value.wood_condition.trim() : "",
    suggested_grade: typeof value.suggested_grade === "string" ? value.suggested_grade.trim() : "",
    confidence: clampConfidence(value.confidence),
    warnings: Array.isArray(value.warnings) ? value.warnings.filter((warning): warning is string => typeof warning === "string") : [],
  };
}

function extractResponseText(responseJson: OpenAIResponseBody) {
  if (typeof responseJson.output_text === "string") return responseJson.output_text;
  if (!Array.isArray(responseJson.output)) return "";

  return responseJson.output
    .flatMap((item) => item.content ?? [])
    .map((contentItem) => (typeof contentItem.text === "string" ? contentItem.text : ""))
    .join("\n")
    .trim();
}

function getOpenAIErrorMessage(error: OpenAIResponseBody["error"]) {
  if (typeof error === "string") return error;
  if (error?.message) return error.message;
  return "Vision AI request failed";
}

async function blobToDataUrl(blob: Blob, mimeType: string) {
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
      const { data, error } = await supabase.storage.from(BUCKET_NAME).download(image.file_path);
      if (error) throw error;

      return {
        imageType: image.image_type,
        imageUrl: await blobToDataUrl(data, image.mime_type || "image/jpeg"),
      };
    }),
  );
}

async function requestVisionAnalysis(imageDataUrls: Array<{ imageType: string; imageUrl: string }>) {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) throw new Error("Missing OPENAI_API_KEY");

  const response = await fetch("https://api.openai.com/v1/responses", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: process.env.OPENAI_VISION_MODEL || DEFAULT_MODEL,
      input: [
        {
          role: "user",
          content: [
            {
              type: "input_text",
              text:
                "Analyze these wood receipt images and return JSON only. Use null when a number cannot be read confidently. Do not include markdown.",
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
          schema: {
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
          },
        },
      },
    }),
  });

  const responseJson = (await response.json()) as OpenAIResponseBody;
  if (!response.ok) throw new Error(getOpenAIErrorMessage(responseJson.error));

  const responseText = extractResponseText(responseJson);
  const parsedResult = responseText ? (JSON.parse(responseText) as Partial<ReceiptVisionAnalysisResult>) : emptyResult;

  return {
    rawResponse: responseJson,
    result: normalizeAnalysisResult(parsedResult),
  };
}

export async function analyzeReceiptImages(receiptId: string): Promise<ReceiptVisionAnalysisResult> {
  const supabase = createServerSupabaseClient();
  const images = await fetchReceiptImages(supabase, receiptId);
  const imageDataUrls = await downloadReceiptImageDataUrls(supabase, images);
  const { rawResponse, result } = await requestVisionAnalysis(imageDataUrls);

  const { error } = await supabase.from("ai_analysis").upsert(
    {
      wood_receipt_id: receiptId,
      model_name: process.env.OPENAI_VISION_MODEL || DEFAULT_MODEL,
      prompt_version: PROMPT_VERSION,
      truck_plate: result.truck_plate,
      moisture_percent: result.moisture_percent,
      estimated_log_count: result.estimated_log_count,
      estimated_diameter_min_cm: result.estimated_diameter_min_cm,
      estimated_diameter_max_cm: result.estimated_diameter_max_cm,
      wood_condition: result.wood_condition,
      suggested_grade: result.suggested_grade,
      confidence: result.confidence,
      warnings: result.warnings,
      raw_response: rawResponse,
      summary: null,
    },
    { onConflict: "wood_receipt_id" },
  );

  if (error) throw error;

  return result;
}
