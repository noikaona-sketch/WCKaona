import { AppShell } from "@/components/AppShell";
import { MobileHeader } from "@/components/MobileHeader";
import { ReceiptCard } from "@/components/ReceiptCard";
import { receipts } from "@/lib/mock-data";

export default function UnloadPage() {
  return (
    <AppShell>
      <MobileHeader title="ลงสินค้า" subtitle="Confirm unloading" backUrl="/" />
      <div className="space-y-4">
        {receipts.filter((receipt) => receipt.status === "Pending Unload").map((receipt) => (
          <div key={receipt.id} className="space-y-3">
            <ReceiptCard receipt={receipt} />
            <button className="h-12 w-full rounded-2xl bg-brand-success font-bold text-white shadow-soft">Confirm Unload</button>
          </div>
        ))}
      </div>
    </AppShell>
  );
}
