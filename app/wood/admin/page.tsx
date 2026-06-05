import { AppShell, FormPanel, KpiCard } from "@/components";

const settings = [
  { label: "ผู้ใช้งาน", value: "6", helper: "ข้อมูลจำลอง" },
  { label: "ชนิดไม้", value: "4", helper: "รายการตั้งต้น" },
  { label: "ลานลงไม้", value: "3", helper: "จุดใช้งาน" }
];

export default function AdminPage() {
  return (
    <AppShell title="ผู้ดูแล" subtitle="ตั้งค่าตัวอย่างสำหรับ UI">
      <section className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        {settings.map((item) => <KpiCard key={item.label} {...item} />)}
      </section>
      <div className="mt-4">
        <FormPanel title="ค่าตั้งต้น" fields={["ชื่อโรงงาน", "สีหลัก", "รายการชนิดไม้", "สิทธิ์ผู้ใช้งาน"]} />
      </div>
    </AppShell>
  );
}
