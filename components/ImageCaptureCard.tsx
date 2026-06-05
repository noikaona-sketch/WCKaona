export function ImageCaptureCard({ title, description, required, status }: { title: string; description: string; required?: boolean; status: "empty" | "ready" }) {
  return (
    <section className="rounded-2xl bg-white p-4 shadow-soft">
      <div className="mb-4 flex items-center justify-between">
        <div>
          <h2 className="font-semibold text-slate-950">{title}</h2>
          <p className="text-sm text-slate-500">{description}</p>
        </div>
        {required ? <span className="rounded-full bg-red-50 px-3 py-1 text-xs font-semibold text-brand-danger">บังคับ</span> : null}
      </div>
      <button className="flex min-h-28 w-full items-center justify-center rounded-2xl border-2 border-dashed border-orange-200 bg-orange-50 text-sm font-semibold text-brand-primary">
        {status === "ready" ? "ดูตัวอย่างภาพ" : "+ ถ่ายภาพ / เลือกรูป"}
      </button>
    </section>
  );
}
