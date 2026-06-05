import { BackOfficeLayout } from "@/components/BackOfficeLayout";

const adminCards = [
  ["Users", "จัดการผู้ใช้"],
  ["Roles", "จัดการสิทธิ์"],
  ["Grade Rules", "จัดการ Grade Rules"],
  ["Reopen Jobs", "เปิดงานกลับมาแก้ไข"],
] as const;

export default function AdminPage() {
  return (
    <BackOfficeLayout title="Admin" subtitle="Users, roles, grade rules, and reopen jobs placeholder">
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {adminCards.map(([title, description]) => (
          <section key={title} className="rounded-3xl bg-white p-6 shadow-soft">
            <p className="text-sm font-semibold uppercase tracking-wide text-brand-primary">Admin</p>
            <h2 className="mt-2 text-xl font-bold text-slate-950">{title}</h2>
            <p className="mt-2 text-slate-500">{description}</p>
            <button className="mt-5 h-12 rounded-2xl border border-slate-200 px-5 font-semibold text-slate-700">เปิดหน้าจอ</button>
          </section>
        ))}
      </div>
    </BackOfficeLayout>
  );
}
