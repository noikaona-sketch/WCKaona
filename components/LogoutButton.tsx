"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { createBrowserSupabaseClient } from "@/lib/supabase/client";

function getLoginRedirect() {
  if (typeof window === "undefined") return "/login";
  const returnTo = `${window.location.pathname}${window.location.search}`;
  return `/login?redirectTo=${encodeURIComponent(returnTo)}`;
}

export function LogoutButton({ className = "" }: { className?: string }) {
  const router = useRouter();
  const [isSigningOut, setIsSigningOut] = useState(false);

  async function handleLogout() {
    if (isSigningOut) return;

    setIsSigningOut(true);
    const supabase = createBrowserSupabaseClient();
    await supabase.auth.signOut();
    router.replace(getLoginRedirect());
    router.refresh();
  }

  return (
    <button
      type="button"
      onClick={handleLogout}
      disabled={isSigningOut}
      className={`h-10 rounded-2xl border border-slate-200 bg-white px-4 text-xs font-bold text-slate-700 shadow-soft disabled:text-slate-400 ${className}`}
    >
      {isSigningOut ? "Logging out" : "Logout"}
    </button>
  );
}
