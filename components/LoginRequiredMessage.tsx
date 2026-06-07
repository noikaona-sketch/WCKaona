"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

function buildLoginHref(returnTo: string) {
  return `/login?redirectTo=${encodeURIComponent(returnTo)}`;
}

export function LoginRequiredMessage({ message = "กรุณาเข้าสู่ระบบก่อนใช้งานหน้านี้" }: { message?: string }) {
  const [loginHref, setLoginHref] = useState("/login");

  useEffect(() => {
    const returnTo = `${window.location.pathname}${window.location.search}`;
    setLoginHref(buildLoginHref(returnTo));
  }, []);

  return (
    <section className="rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm font-semibold text-amber-900 shadow-soft">
      <p>{message}</p>
      <Link href={loginHref} className="mt-3 inline-flex h-11 items-center rounded-2xl bg-brand-primary px-4 text-sm font-bold text-white">
        Login
      </Link>
    </section>
  );
}
