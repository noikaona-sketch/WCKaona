"use client";

import Image from "next/image";
import { useEffect, useMemo, useState } from "react";
import { createBrowserSupabaseClient } from "@/lib/supabase/client";

const BUCKET_NAME = "wood-receipts";
const SIGNED_URL_EXPIRES_IN_SECONDS = 60 * 10;

const imageLabels: Record<string, string> = {
  size: "ไม้บนรถ + PVC",
  moisture: "เครื่องวัดความชื้น",
  license: "ทะเบียนรถ",
};

const imageOrder = ["size", "moisture", "license"];

export type ReceiptPreviewImage = {
  image_type: string;
  file_path: string;
  file_name?: string | null;
};

type SignedPreviewImage = ReceiptPreviewImage & {
  signedUrl: string;
};

type ReceiptImagePreviewCardsProps = {
  images: ReceiptPreviewImage[] | null | undefined;
  className?: string;
  emptyMessage?: string;
};

function sortImages(images: ReceiptPreviewImage[]) {
  return [...images].sort((left, right) => {
    const leftIndex = imageOrder.indexOf(left.image_type);
    const rightIndex = imageOrder.indexOf(right.image_type);
    return (leftIndex === -1 ? 99 : leftIndex) - (rightIndex === -1 ? 99 : rightIndex);
  });
}

export function ReceiptImagePreviewCards({ images, className = "", emptyMessage = "ยังไม่มีรูป" }: ReceiptImagePreviewCardsProps) {
  const sortedImages = useMemo(() => sortImages(images ?? []), [images]);
  const [signedImages, setSignedImages] = useState<SignedPreviewImage[]>([]);
  const [selectedImage, setSelectedImage] = useState<SignedPreviewImage | null>(null);
  const [message, setMessage] = useState("");

  useEffect(() => {
    let isMounted = true;

    async function loadSignedUrls() {
      setMessage("");
      setSignedImages([]);
      setSelectedImage(null);

      if (sortedImages.length === 0) return;

      try {
        const supabase = createBrowserSupabaseClient();
        const signedUrls = await Promise.all(
          sortedImages.map(async (image) => {
            const { data, error } = await supabase.storage
              .from(BUCKET_NAME)
              .createSignedUrl(image.file_path, SIGNED_URL_EXPIRES_IN_SECONDS);

            if (error) throw error;
            return { ...image, signedUrl: data.signedUrl };
          }),
        );

        if (isMounted) setSignedImages(signedUrls);
      } catch (error) {
        if (isMounted) setMessage(error instanceof Error ? error.message : "โหลดรูปไม่สำเร็จ");
      }
    }

    loadSignedUrls();

    return () => {
      isMounted = false;
    };
  }, [sortedImages]);

  if (sortedImages.length === 0) {
    return <p className={`rounded-2xl bg-slate-50 p-3 text-sm font-semibold text-slate-500 ${className}`}>{emptyMessage}</p>;
  }

  return (
    <>
      <div className={`grid grid-cols-3 gap-2 ${className}`}>
        {sortedImages.map((image) => {
          const signedImage = signedImages.find((item) => item.file_path === image.file_path);
          const label = imageLabels[image.image_type] || image.image_type;

          return (
            <button
              key={image.file_path}
              type="button"
              disabled={!signedImage}
              onClick={() => signedImage && setSelectedImage(signedImage)}
              className="overflow-hidden rounded-2xl bg-white text-left shadow-soft outline-none ring-brand-primary transition focus:ring-2 disabled:cursor-not-allowed disabled:opacity-60"
            >
              <span className="relative block aspect-square bg-slate-100">
                {signedImage ? (
                  <Image src={signedImage.signedUrl} alt={label} fill sizes="33vw" unoptimized className="object-cover" />
                ) : (
                  <span className="flex h-full items-center justify-center px-2 text-center text-xs font-bold text-slate-400">Loading</span>
                )}
              </span>
              <span className="block px-2 py-2 text-center text-xs font-bold text-slate-600">{label}</span>
            </button>
          );
        })}
      </div>

      {message ? <p className="mt-2 rounded-xl bg-red-50 px-3 py-2 text-sm font-semibold text-brand-danger">{message}</p> : null}

      {selectedImage ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 p-4" role="dialog" aria-modal="true">
          <div className="w-full max-w-3xl overflow-hidden rounded-2xl bg-white shadow-soft">
            <div className="flex items-center justify-between gap-3 border-b border-slate-100 px-4 py-3">
              <p className="font-bold text-slate-950">{imageLabels[selectedImage.image_type] || selectedImage.image_type}</p>
              <button type="button" onClick={() => setSelectedImage(null)} className="h-10 rounded-full bg-slate-100 px-4 text-sm font-bold text-slate-700">
                Close
              </button>
            </div>
            <div className="relative h-[70vh] bg-slate-950">
              <Image src={selectedImage.signedUrl} alt={imageLabels[selectedImage.image_type] || selectedImage.image_type} fill sizes="100vw" unoptimized className="object-contain" />
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}
