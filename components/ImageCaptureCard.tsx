"use client";

import Image from "next/image";
import { ChangeEvent, useEffect, useRef, useState } from "react";

type ImageCaptureCardProps = {
  id: string;
  title: string;
  description: string;
  required?: boolean;
  onReadyChange?: (id: string, ready: boolean) => void;
  onFileChange?: (id: string, file: File | null) => void;
};

export function ImageCaptureCard({ id, title, description, required, onReadyChange, onFileChange }: ImageCaptureCardProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const previewUrlRef = useRef<string | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [fileName, setFileName] = useState<string>("");

  useEffect(() => {
    return () => {
      if (previewUrlRef.current) URL.revokeObjectURL(previewUrlRef.current);
    };
  }, []);

  function handleFileChange(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0] ?? null;
    const ready = Boolean(file);

    if (previewUrlRef.current) URL.revokeObjectURL(previewUrlRef.current);

    const nextPreviewUrl = file ? URL.createObjectURL(file) : null;
    previewUrlRef.current = nextPreviewUrl;
    setPreviewUrl(nextPreviewUrl);
    setFileName(file?.name || "");
    onReadyChange?.(id, ready);
    onFileChange?.(id, file);
  }

  return (
    <section className={`rounded-2xl border bg-white p-4 shadow-soft ${previewUrl ? "border-orange-200" : "border-slate-100"}`}>
      <div className="mb-4 flex items-start justify-between gap-3">
        <div>
          <h2 className="font-semibold text-[#14213d]">{title}</h2>
          <p className="text-sm text-slate-500">{description}</p>
        </div>
        <span className={`rounded-full px-3 py-1 text-xs font-semibold ${previewUrl ? "bg-orange-50 text-[#14213d]" : "bg-red-50 text-brand-danger"}`}>
          {previewUrl ? "ครบ" : required ? "บังคับ" : "รอรูป"}
        </span>
      </div>

      <button
        type="button"
        onClick={() => inputRef.current?.click()}
        className="relative flex min-h-36 w-full overflow-hidden rounded-2xl border-2 border-dashed border-orange-200 bg-orange-50 text-sm font-semibold text-brand-primary"
      >
        {previewUrl ? (
          <Image src={previewUrl} alt="" fill sizes="100vw" unoptimized className="object-cover" />
        ) : (
          <span className="m-auto">แตะเพื่อเปิดกล้อง</span>
        )}
        <span className="absolute inset-x-3 bottom-3 rounded-xl bg-[#ff5a1f] px-4 py-3 text-center font-bold text-[#14213d] shadow-soft">
          {previewUrl ? "ถ่ายใหม่" : "ถ่ายภาพ"}
        </span>
      </button>

      <input
        ref={inputRef}
        className="sr-only"
        type="file"
        accept="image/*"
        capture="environment"
        onChange={handleFileChange}
      />
      {fileName ? <p className="mt-2 truncate text-xs font-medium text-slate-500">{fileName}</p> : null}
    </section>
  );
}
