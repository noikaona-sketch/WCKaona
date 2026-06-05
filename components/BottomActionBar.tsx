import Link from "next/link";

export function BottomActionBar({ primaryLabel, secondaryLabel, primaryHref = "/", secondaryHref = "/" }: { primaryLabel: string; secondaryLabel?: string; primaryHref?: string; secondaryHref?: string }) {
  return (
    <div className="fixed inset-x-0 bottom-0 z-30 border-t border-primary-900/10 bg-white/95 px-4 py-3 shadow-[0_-10px_30px_rgba(15,95,58,0.10)] backdrop-blur">
      <div className="mx-auto flex max-w-5xl gap-3">
        {secondaryLabel ? (
          <Link href={secondaryHref} className="flex min-h-14 flex-1 items-center justify-center rounded-2xl border border-primary-700 bg-white px-4 text-center font-bold text-primary-800">
            {secondaryLabel}
          </Link>
        ) : null}
        <Link href={primaryHref} className="flex min-h-14 flex-1 items-center justify-center rounded-2xl bg-primary-700 px-4 text-center font-bold text-white shadow-lg shadow-primary-900/20">
          {primaryLabel}
        </Link>
      </div>
    </div>
  );
}
