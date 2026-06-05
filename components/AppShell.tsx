import type { ReactNode } from "react";

export function AppShell({ children, bottomAction }: { children: ReactNode; bottomAction?: ReactNode }) {
  return (
    <main className="mx-auto min-h-screen w-full max-w-md px-4 pb-28 pt-4 sm:pt-6">
      {children}
      {bottomAction}
    </main>
  );
}
