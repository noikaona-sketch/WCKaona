"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { getCurrentEmployeeName } from "@/lib/employee-profile";
import { createBrowserSupabaseClient } from "@/lib/supabase/client";

function getLoginRedirect() {
  if (typeof window === "undefined") return "/login";
  const returnTo = `${window.location.pathname}${window.location.search}`;
  return `/login?redirectTo=${encodeURIComponent(returnTo)}`;
}

export function LogoutButton({ className = "" }: { className?: string }) {
  const router = useRouter();
  const [employeeName, setEmployeeName] = useState("");
  const [isSigningOut, setIsSigningOut] = useState(false);

  useEffect(() => {
    let isMounted = true;

    async function loadEmployeeName() {
      try {
        const supabase = createBrowserSupabaseClient();
        const employee = await getCurrentEmployeeName(supabase);
        if (isMounted) setEmployeeName(employee.displayName);
      } catch {
        if (isMounted) setEmployeeName("");
      }
    }

    loadEmployeeName();

    return () => {
      isMounted = false;
    };
  }, []);

  async function handleLogout() {
    if (isSigningOut) return;

    setIsSigningOut(true);
    const supabase = createBrowserSupabaseClient();
    await supabase.auth.signOut();
    router.replace(getLoginRedirect());
    router.refresh();
  }

  return (
    <div className={`flex items-center gap-2 ${className}`}>
      {employeeName ? <span className="max-w-32 truncate text-xs font-bold text-slate-600">{employeeName}</span> : null}
      <button
        type="button"
        onClick={handleLogout}
        disabled={isSigningOut}
        className="h-10 rounded-2xl border border-slate-200 bg-white px-4 text-xs font-bold text-slate-700 shadow-soft disabled:text-slate-400"
      >
        {isSigningOut ? "Logging out" : "Logout"}
      </button>
    </div>
  );
}
