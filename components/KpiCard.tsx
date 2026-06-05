export function KpiCard({ label, value, unit, tone = "default" }: { label: string; value: string; unit?: string; tone?: "default" | "success" | "warning" }) {
  const toneClass = tone === "success" ? "bg-green-50 text-brand-success" : tone === "warning" ? "bg-yellow-50 text-amber-700" : "bg-white text-slate-950";
  return (
    <div className={`rounded-2xl p-4 shadow-soft ${toneClass}`}>
      <p className="text-sm opacity-70">{label}</p>
      <p className="mt-2 text-2xl font-bold">{value} {unit ? <span className="text-sm font-medium">{unit}</span> : null}</p>
    </div>
  );
}
