import Link from "next/link";
import type { ReactNode } from "react";

export function MobileHeader({
  title,
  subtitle,
  backUrl,
  rightAction,
}: {
  title: string;
  subtitle?: string;
  backUrl?: string;
  rightAction?: ReactNode;
}) {
  return (
    <header className="mb-5 flex items-center justify-between gap-3">
      <div className="flex items-center gap-3">
        {backUrl ? (
          <Link href={backUrl} className="flex h-11 w-11 items-center justify-center rounded-2xl bg-white shadow-soft" aria-label="กลับ">
            ←
          </Link>
        ) : null}
        <div>
          <h1 className="text-2xl font-bold text-slate-950">{title}</h1>
          {subtitle ? <p className="text-sm text-slate-500">{subtitle}</p> : null}
        </div>
      </div>
      {rightAction}
    </header>
  );
}
