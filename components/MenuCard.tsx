import Link from "next/link";

export function MenuCard({ icon, title, description, href, statusCount }: { icon: string; title: string; description: string; href: string; statusCount?: number }) {
  return (
    <Link href={href} className="flex min-h-24 items-center gap-4 rounded-2xl bg-white p-4 shadow-soft transition hover:-translate-y-0.5 hover:shadow-lg">
      <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-orange-50 text-3xl">{icon}</span>
      <span className="flex-1">
        <span className="block text-lg font-semibold text-slate-950">{title}</span>
        <span className="text-sm text-slate-500">{description}</span>
      </span>
      {typeof statusCount === "number" ? <span className="rounded-full bg-brand-primary px-3 py-1 text-sm font-bold text-white">{statusCount}</span> : null}
    </Link>
  );
}
