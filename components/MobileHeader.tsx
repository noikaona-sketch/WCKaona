import Link from "next/link";

export function MobileHeader({ title, subtitle }: { title: string; subtitle?: string }) {
  return (
    <header className="sticky top-0 z-20 border-b border-primary-900/10 bg-primary-800 text-white shadow-lg shadow-primary-900/10">
      <div className="mx-auto flex min-h-16 w-full max-w-5xl items-center gap-3 px-4 py-3">
        <Link href="/" className="flex h-11 w-11 items-center justify-center rounded-2xl bg-white/15 text-xl font-black" aria-label="กลับหน้าหลัก">
          W
        </Link>
        <div className="min-w-0 flex-1">
          <p className="truncate text-lg font-bold leading-6">{title}</p>
          {subtitle ? <p className="truncate text-sm text-white/75">{subtitle}</p> : null}
        </div>
        <div className="rounded-full bg-white/15 px-3 py-2 text-sm font-semibold">วันนี้</div>
      </div>
    </header>
  );
}
