import "server-only";

export type N8nApprovedReceiptPayload = {
  receipt_id: string;
  receipt_no: string;
  supplier_id: string;
  truck_plate: string;
  net_weight_kg: number | null;
  moisture_percent: number | null;
  reviewed_grade: string;
  reviewer_note: string;
  reviewed_at: string;
  unloading_location: string;
  ai_analysis: Record<string, unknown>;
  images: Array<Record<string, unknown>>;
};

export async function dispatchApprovedReceiptToN8n(payload: N8nApprovedReceiptPayload) {
  const webhookUrl = process.env.N8N_WEBHOOK_URL;

  if (!webhookUrl) {
    throw new Error("Missing N8N_WEBHOOK_URL");
  }

  const response = await fetch(webhookUrl, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });

  const responseText = await response.text();

  if (!response.ok) {
    throw new Error(responseText || `n8n webhook failed with status ${response.status}`);
  }

  return {
    status: response.status,
    responseText,
  };
}
