export function ImageCaptureCard({ title = "ถ่ายรูปหลักฐาน", helper = "รูปหน้าไม้ ท้ายรถ และป้ายทะเบียน" }: { title?: string; helper?: string }) {
  return (
    <section className="rounded-3xl bg-white p-4 shadow-card ring-1 ring-primary-900/5">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h2 className="text-lg font-bold text-primary-900">{title}</h2>
          <p className="mt-1 text-sm text-slate-500">{helper}</p>
        </div>
        <button className="min-h-12 rounded-2xl bg-primary-700 px-4 font-bold text-white shadow-lg shadow-primary-900/20">เพิ่มรูป</button>
      </div>
      <div className="mt-4 grid grid-cols-3 gap-3">
        {["หน้าไม้", "ท้ายรถ", "ทะเบียน"].map((item) => (
          <div key={item} className="flex aspect-square items-center justify-center rounded-2xl border-2 border-dashed border-primary-200 bg-primary-50 text-center text-sm font-semibold text-primary-700">
            {item}
          </div>
        ))}
      </div>
    </section>
  );
}
