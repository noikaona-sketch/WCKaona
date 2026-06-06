type BottomActionBarProps = {
  primaryLabel: string;
  secondaryLabel?: string;
  primaryDisabled?: boolean;
  primaryLoading?: boolean;
  onPrimaryClick?: () => void;
};

export function BottomActionBar({ primaryLabel, secondaryLabel, primaryDisabled, primaryLoading, onPrimaryClick }: BottomActionBarProps) {
  return (
    <div className="fixed inset-x-0 bottom-0 z-10 border-t border-slate-200 bg-white/95 p-4 backdrop-blur">
      <div className="mx-auto flex max-w-md gap-3">
        {secondaryLabel ? <button className="h-12 flex-1 rounded-2xl border border-slate-200 font-semibold text-slate-700">{secondaryLabel}</button> : null}
        <button
          type="button"
          disabled={primaryDisabled || primaryLoading}
          onClick={onPrimaryClick}
          className="h-12 flex-1 rounded-2xl bg-brand-primary font-bold text-white shadow-soft disabled:bg-slate-300"
        >
          {primaryLoading ? "กำลังบันทึก" : primaryLabel}
        </button>
      </div>
    </div>
  );
}
