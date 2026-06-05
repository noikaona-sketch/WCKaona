export function KpiCard({ label, value, helper }: { label: string; value: string; helper: string }) {
  return (
    <div className="rounded-3xl bg-white p-4 shadow-card ring-1 ring-primary-900/5">
      <p className="text-sm font-semibold text-slate-500">{label}</p>
      <p className="mt-2 text-3xl font-black text-primary-900">{value}</p>
      <p className="mt-1 text-sm text-primary-700">{helper}</p>
    </div>
  );
}
