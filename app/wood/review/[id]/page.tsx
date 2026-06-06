"use client";

import Image from "next/image";
import { useEffect, useMemo, useState } from "react";
import { AppShell } from "@/components/AppShell";
import { BottomActionBar } from "@/components/BottomActionBar";
import { MobileHeader } from "@/components/MobileHeader";
import { StatusBadge } from "@/components/StatusBadge";
import { createBrowserSupabaseClient } from "@/lib/supabase/client";

const BUCKET_NAME = "wood-receipts";
const imageLabels: Record<string, string> = {
  license: "ทะเบียนรถ",
  moisture: "เครื่องวัดความชื้น",
  size: "ไม้บนรถ + PVC",
};

type ReceiptDetail = {
  id: string;
  receipt_no: string;
  truck_plate: string | null;
  status: string;
  inbound_weight_kg: number | null;
  outbound_weight_kg: number | null;
  net_weight_kg: number | null;
  moisture_percent: number | null;
  final_grade: string | null;
  unloading_location: string | null;
  received_at: string | null;
};

type ReceiptImage = {
  image_type: string;
  file_path: string;
  file_name: string | null;
};

type Analysis = {
  truck_plate: string | null;
  moisture_percent: number | null;
  estimated_log_count: number | null;
  estimated_diameter_min_cm: number | null;
  estimated_diameter_max_cm: number | null;
  wood_condition: string | null;
  suggested_grade: string | null;
  confidence: number | null;
  warnings: string[] | null;
};

type SignedImage = ReceiptImage & {
  signedUrl: string;
};

function formatNumber(value: number | null | undefined, suffix = "") {
  return value === null || value === undefined ? "-" : `${value.toLocaleString()}${suffix}`;
}

function formatDate(value: string | null) {
  return value ? new Date(value).toLocaleString("th-TH") : "-";
}

export default function ReviewDetailPage({ params }: { params: { id: string } }) {
  const [receipt, setReceipt] = useState<ReceiptDetail | null>(null);
  const [analysis, setAnalysis] = useState<Analysis | null>(null);
  const [images, setImages] = useState<SignedImage[]>([]);
  const [suggestedGrade, setSuggestedGrade] = useState("");
  const [reviewerNote, setReviewerNote] = useState("");
  const [reviewDecision, setReviewDecision] = useState<"approved" | "rejected" | "">("");
  const [message, setMessage] = useState("กำลังโหลดผลตรวจ");

  const warnings = useMemo(() => analysis?.warnings ?? [], [analysis]);

  useEffect(() => {
    let isMounted = true;

    async function loadReviewData() {
      try {
        const supabase = createBrowserSupabaseClient();
        const { data: sessionData, error: sessionError } = await supabase.auth.getSession();

        if (sessionError) throw sessionError;
        if (!sessionData.session) {
          if (isMounted) setMessage("กรุณาเข้าสู่ระบบก่อนตรวจผล AI");
          return;
        }

        const [receiptResult, imageResult, analysisResult] = await Promise.all([
          supabase
            .from("wood_receipts")
            .select("id, receipt_no, truck_plate, status, inbound_weight_kg, outbound_weight_kg, net_weight_kg, moisture_percent, final_grade, unloading_location, received_at")
            .eq("id", params.id)
            .is("deleted_at", null)
            .maybeSingle(),
          supabase
            .from("receipt_images")
            .select("image_type, file_path, file_name")
            .eq("wood_receipt_id", params.id)
            .is("deleted_at", null),
          supabase
            .from("ai_analysis")
            .select("truck_plate, moisture_percent, estimated_log_count, estimated_diameter_min_cm, estimated_diameter_max_cm, wood_condition, suggested_grade, confidence, warnings")
            .eq("wood_receipt_id", params.id)
            .is("deleted_at", null)
            .maybeSingle(),
        ]);

        if (receiptResult.error) throw receiptResult.error;
        if (imageResult.error) throw imageResult.error;
        if (analysisResult.error) throw analysisResult.error;
        if (!receiptResult.data) {
          if (isMounted) setMessage("ไม่พบ receipt หรือไม่มีสิทธิ์เข้าถึง");
          return;
        }

        const signedImages = await Promise.all(
          ((imageResult.data ?? []) as ReceiptImage[]).map(async (image) => {
            const { data, error } = await supabase.storage.from(BUCKET_NAME).createSignedUrl(image.file_path, 60 * 10);
            if (error) throw error;
            return { ...image, signedUrl: data.signedUrl };
          }),
        );

        if (isMounted) {
          const loadedAnalysis = analysisResult.data as Analysis | null;
          setReceipt(receiptResult.data as ReceiptDetail);
          setImages(signedImages);
          setAnalysis(loadedAnalysis);
          setSuggestedGrade(loadedAnalysis?.suggested_grade || receiptResult.data.final_grade || "");
          setMessage("");
        }
      } catch (error) {
        if (isMounted) setMessage(error instanceof Error ? error.message : "โหลดผลตรวจไม่สำเร็จ");
      }
    }

    loadReviewData();

    return () => {
      isMounted = false;
    };
  }, [params.id]);

  function handleReview(decision: "approved" | "rejected") {
    setReviewDecision(decision);
  }

  return (
    <AppShell
      bottomAction={
        <BottomActionBar
          primaryLabel="Approve"
          secondaryLabel="Reject"
          primaryDisabled={!receipt || !suggestedGrade.trim()}
          onPrimaryClick={() => handleReview("approved")}
        />
      }
    >
      <MobileHeader title="ตรวจงาน" subtitle={receipt?.receipt_no || "AI Result"} backUrl="/wood/review" rightAction={<StatusBadge status="Pending Review" />} />

      {message ? <p className="mb-4 rounded-2xl bg-white p-4 text-sm font-semibold text-slate-500 shadow-soft">{message}</p> : null}

      {receipt ? (
        <>
          <section className="mb-4 rounded-2xl bg-white p-4 shadow-soft">
            <div className="mb-3 flex items-start justify-between gap-3">
              <div>
                <p className="text-xs font-black uppercase text-brand-primary">Receipt Summary</p>
                <h2 className="text-lg font-bold text-[#14213d]">{receipt.receipt_no}</h2>
              </div>
              <StatusBadge status="Pending Review" />
            </div>
            <dl className="grid grid-cols-2 gap-3 text-sm">
              <div><dt className="text-slate-500">ทะเบียน</dt><dd className="font-semibold text-slate-900">{receipt.truck_plate || analysis?.truck_plate || "-"}</dd></div>
              <div><dt className="text-slate-500">รับเข้า</dt><dd className="font-semibold text-slate-900">{formatDate(receipt.received_at)}</dd></div>
              <div><dt className="text-slate-500">Gross</dt><dd className="font-semibold text-slate-900">{formatNumber(receipt.inbound_weight_kg, " kg")}</dd></div>
              <div><dt className="text-slate-500">Unload</dt><dd className="font-semibold text-slate-900">{receipt.unloading_location || "-"}</dd></div>
            </dl>
          </section>

          <section className="mb-4 grid grid-cols-3 gap-2">
            {["license", "moisture", "size"].map((imageType) => {
              const image = images.find((item) => item.image_type === imageType);

              return (
                <div key={imageType} className="overflow-hidden rounded-2xl bg-white shadow-soft">
                  <div className="relative aspect-square bg-slate-100">
                    {image ? <Image src={image.signedUrl} alt="" fill sizes="33vw" unoptimized className="object-cover" /> : null}
                  </div>
                  <p className="px-2 py-2 text-center text-xs font-bold text-slate-600">{imageLabels[imageType]}</p>
                </div>
              );
            })}
          </section>

          <section className="mb-4 rounded-2xl bg-white p-4 shadow-soft">
            <h2 className="font-bold text-slate-950">AI Result</h2>
            <dl className="mt-3 grid grid-cols-2 gap-3 text-sm">
              <div><dt className="text-slate-500">ทะเบียน</dt><dd className="font-semibold">{analysis?.truck_plate || "-"}</dd></div>
              <div><dt className="text-slate-500">Grade</dt><dd className="font-semibold">{analysis?.suggested_grade || "-"}</dd></div>
              <div><dt className="text-slate-500">Moisture</dt><dd className="font-semibold">{formatNumber(analysis?.moisture_percent, "%")}</dd></div>
              <div><dt className="text-slate-500">Confidence</dt><dd className="font-semibold">{formatNumber(analysis?.confidence, "%")}</dd></div>
              <div><dt className="text-slate-500">Log Count</dt><dd className="font-semibold">{formatNumber(analysis?.estimated_log_count)}</dd></div>
              <div><dt className="text-slate-500">Diameter</dt><dd className="font-semibold">{formatNumber(analysis?.estimated_diameter_min_cm)}-{formatNumber(analysis?.estimated_diameter_max_cm)} cm</dd></div>
            </dl>
            {analysis?.wood_condition ? <p className="mt-3 rounded-xl bg-slate-50 p-3 text-sm text-slate-600">{analysis.wood_condition}</p> : null}
            {warnings.length > 0 ? (
              <ul className="mt-3 space-y-2 text-sm font-medium text-brand-danger">
                {warnings.map((warning) => <li key={warning}>• {warning}</li>)}
              </ul>
            ) : null}
          </section>

          <section className="rounded-2xl bg-white p-4 shadow-soft">
            <label className="text-sm font-semibold text-slate-700" htmlFor="final-grade">Suggested Grade</label>
            <input
              id="final-grade"
              value={suggestedGrade}
              onChange={(event) => setSuggestedGrade(event.target.value.slice(0, 20))}
              className="mt-2 h-12 w-full rounded-2xl border border-slate-200 px-4 font-semibold outline-none focus:border-brand-primary"
            />
            <label className="mt-4 block text-sm font-semibold text-slate-700" htmlFor="review-note">Reviewer Note</label>
            <textarea
              id="review-note"
              value={reviewerNote}
              onChange={(event) => setReviewerNote(event.target.value.slice(0, 300))}
              rows={4}
              className="mt-2 w-full rounded-2xl border border-slate-200 p-4 outline-none focus:border-brand-primary"
              placeholder="ระบุเหตุผลเมื่อต้องแก้เกรดหรือ Reject"
            />
            <button
              type="button"
              onClick={() => handleReview("rejected")}
              className="mt-3 h-12 w-full rounded-2xl border border-brand-danger font-semibold text-brand-danger"
            >
              Reject
            </button>
            {reviewDecision ? (
              <p className="mt-3 rounded-xl bg-orange-50 px-3 py-2 text-sm font-bold text-[#14213d]">
                {reviewDecision === "approved" ? "Approved" : "Rejected"}: {suggestedGrade.trim() || "-"}
                {reviewerNote.trim() ? ` · ${reviewerNote.trim()}` : ""}
              </p>
            ) : null}
          </section>
        </>
      ) : null}
    </AppShell>
  );
}
