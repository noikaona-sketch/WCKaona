export function FormPanel({ title, fields }: { title: string; fields: string[] }) {
  return (
    <section className="rounded-3xl bg-white p-4 shadow-card ring-1 ring-primary-900/5">
      <h2 className="text-lg font-bold text-primary-900">{title}</h2>
      <div className="mt-4 space-y-3">
        {fields.map((field) => (
          <label key={field} className="block">
            <span className="text-sm font-semibold text-slate-500">{field}</span>
            <div className="mt-2 flex min-h-14 items-center rounded-2xl border border-slate-200 bg-slate-50 px-4 text-slate-400">ข้อมูลจำลอง</div>
          </label>
        ))}
      </div>
    </section>
  );
}
