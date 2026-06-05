import { notFound } from "next/navigation";
import { AppShell, BottomActionBar, ImageCaptureCard, ReceiptCard } from "@/components";
import { receipts } from "@/lib/mock-data";

export default async function ReviewDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const receipt = receipts.find((item) => item.id === id);

  if (!receipt) {
    notFound();
  }

  return (
    <AppShell title={receipt.code} subtitle="รายละเอียดใบรับไม้">
      <div className="space-y-4">
        <ReceiptCard receipt={receipt} />
        <section className="rounded-3xl bg-white p-4 shadow-card ring-1 ring-primary-900/5">
          <h2 className="text-lg font-bold text-primary-900">ผลตรวจคุณภาพ</h2>
          <div className="mt-4 grid grid-cols-2 gap-3 text-sm">
            <div className="rounded-2xl bg-slate-50 p-3"><p className="text-slate-500">ผู้ตรวจ</p><p className="mt-1 font-bold">{receipt.reviewer}</p></div>
            <div className="rounded-2xl bg-slate-50 p-3"><p className="text-slate-500">น้ำหนักรวม</p><p className="mt-1 font-bold">{receipt.grossWeight.toLocaleString("th-TH")} กก.</p></div>
          </div>
        </section>
        <ImageCaptureCard title="รูปประกอบใบรับ" helper="แสดงช่องรูปจำลองสำหรับตรวจสอบ" />
      </div>
      <BottomActionBar primaryLabel="อนุมัติ" secondaryLabel="ปฏิเสธ" primaryHref="/wood/review" secondaryHref="/wood/review" />
    </AppShell>
  );
}
