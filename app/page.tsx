import { AppShell, KpiCard, MenuCard, ReceiptCard } from "@/components";
import { kpis, menuItems, receipts } from "@/lib/mock-data";

export default function HomePage() {
  return (
    <AppShell title="WCKaona" subtitle="ระบบรับไม้หน้าลาน (ข้อมูลจำลอง)">
      <section className="rounded-[2rem] bg-primary-800 p-5 text-white shadow-xl shadow-primary-900/20">
        <p className="text-sm font-semibold text-white/70">ภาพรวมวันนี้</p>
        <h1 className="mt-2 text-3xl font-black">รับไม้รวดเร็ว ตรวจง่าย ใช้งานบนมือถือ</h1>
        <p className="mt-3 text-sm leading-6 text-white/80">ต้นแบบ UI เท่านั้น ใช้ข้อมูลจำลอง ไม่มีฐานข้อมูล API Supabase หรือ AI integration</p>
      </section>

      <section className="mt-5 grid grid-cols-1 gap-3 sm:grid-cols-3">
        {kpis.map((item) => <KpiCard key={item.label} {...item} />)}
      </section>

      <section className="mt-6 grid gap-3 sm:grid-cols-2">
        {menuItems.map((item) => <MenuCard key={item.href} {...item} />)}
      </section>

      <section className="mt-6 space-y-3">
        <h2 className="text-xl font-black text-primary-900">ใบรับล่าสุด</h2>
        {receipts.slice(0, 2).map((receipt) => <ReceiptCard key={receipt.id} receipt={receipt} href={`/wood/review/${receipt.id}`} />)}
      </section>
    </AppShell>
  );
}
