import { AppShell } from "@/components/AppShell";
import { MenuCard } from "@/components/MenuCard";
import { MobileHeader } from "@/components/MobileHeader";

const mobileMenu = [
  ["🚛", "รับไม้ใหม่", "สร้างบิลและเตรียมภาพบังคับ 3 ภาพ", "/wood/new", undefined],
  ["✔", "งานรอตรวจ", "ตรวจผล AI และตัดสินใจขั้นสุดท้าย", "/wood/review", 3],
  ["📦", "ลงสินค้า", "ยืนยันรายการที่รอลงสินค้า", "/wood/unload", 1],
  ["📋", "ประวัติวันนี้", "ดูรายการ Approved และ Closed", "/wood/history", undefined],
  ["📊", "สรุปเกรดวันนี้", "Trips, Weight, Grade และ Moisture", "/wood/reports", undefined],
] as const;

const desktopMenu = [
  ["⚖", "ห้องชั่งขาเข้า", "ใส่เลขบิลตราชั่งและน้ำหนักเข้า", "/wood/inbound-scale"],
  ["⚖", "ห้องชั่งขาออก", "ใส่น้ำหนักออกและคำนวณสุทธิ", "/wood/outbound-scale"],
  ["⚙", "Admin", "Users, Roles, Grade Rules, Reopen Jobs", "/wood/admin"],
] as const;

export default function HomePage() {
  return (
    <AppShell>
      <MobileHeader title="WC Kaona" subtitle="ระบบรับไม้และจัดเกรดด้วย AI" />
      <section className="mb-5 rounded-3xl bg-gradient-to-br from-brand-primary to-brand-secondary p-5 text-white shadow-soft">
        <p className="text-sm font-semibold opacity-90">Phase 1 · UI Mockup</p>
        <h2 className="mt-2 text-2xl font-bold">1 เที่ยวรถ = 1 บิลรับไม้</h2>
        <p className="mt-2 text-sm opacity-90">โครงสร้างเริ่มต้นสำหรับ Route, Layout, Navigation และ Placeholder Pages เท่านั้น</p>
      </section>
      <div className="space-y-3">
        {mobileMenu.map(([icon, title, description, href, count]) => (
          <MenuCard key={href} icon={icon} title={title} description={description} href={href} statusCount={count} />
        ))}
      </div>
      <h2 className="mb-3 mt-8 text-lg font-bold text-slate-950">Desktop Menu</h2>
      <div className="space-y-3">
        {desktopMenu.map(([icon, title, description, href]) => (
          <MenuCard key={href} icon={icon} title={title} description={description} href={href} />
        ))}
      </div>
    </AppShell>
  );
}
