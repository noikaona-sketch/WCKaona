import Link from "next/link";

export function MenuCard({ href, title, description, icon }: { href: string; title: string; description: string; icon: string }) {
  return (
    <Link href={href} className="flex min-h-28 items-center gap-4 rounded-3xl bg-white p-4 shadow-card ring-1 ring-primary-900/5 transition active:scale-[0.99]">
      <span className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-primary-50 text-3xl">{icon}</span>
      <span className="min-w-0 flex-1">
        <span className="block text-lg font-bold text-primary-900">{title}</span>
        <span className="mt-1 block text-sm text-slate-500">{description}</span>
      </span>
      <span className="text-2xl text-primary-700">›</span>
    </Link>
  );
}
