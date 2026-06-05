import { MobileHeader } from "./MobileHeader";

export function AppShell({ title, subtitle, children }: { title: string; subtitle?: string; children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-[#f4f7f2] pb-28">
      <MobileHeader title={title} subtitle={subtitle} />
      <main className="mx-auto w-full max-w-5xl px-4 py-5 sm:px-6">{children}</main>
    </div>
  );
}
