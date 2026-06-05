import Link from "next/link";
import type { ReactNode } from "react";

const desktopLinks = [
  ["⚖", "ห้องชั่งขาเข้า", "/wood/inbound-scale"],
  ["⚖", "ห้องชั่งขาออก", "/wood/outbound-scale"],
  ["📑", "รายงาน", "/wood/reports"],
  ["⚙", "Admin", "/wood/admin"],
];

export function BackOfficeLayout({ title, subtitle, children }: { title: string; subtitle?: string; children: ReactNode }) {
  return (
    <main className="min-h-screen bg-brand-background p-4 lg:p-8">
      <div className="mx-auto grid max-w-7xl gap-6 lg:grid-cols-[280px_1fr]">
        <aside className="rounded-3xl bg-slate-950 p-5 text-white shadow-soft">
          <Link href="/" className="mb-8 block text-2xl font-bold text-brand-secondary">WC Kaona</Link>
          <nav className="space-y-2">
            {desktopLinks.map(([icon, label, href]) => (
              <Link key={href} href={href} className="flex min-h-12 items-center gap-3 rounded-2xl px-4 py-3 text-slate-200 hover:bg-white/10">
                <span>{icon}</span><span>{label}</span>
              </Link>
            ))}
          </nav>
        </aside>
        <section>
          <header className="mb-6 rounded-3xl bg-white p-6 shadow-soft">
            <p className="text-sm font-semibold uppercase tracking-wide text-brand-primary">Back Office</p>
            <h1 className="mt-1 text-3xl font-bold text-slate-950">{title}</h1>
            {subtitle ? <p className="mt-2 text-slate-500">{subtitle}</p> : null}
          </header>
          {children}
        </section>
      </div>
    </main>
  );
}
