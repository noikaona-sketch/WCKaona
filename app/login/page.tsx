"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { FormEvent, useEffect, useState } from "react";
import { createBrowserSupabaseClient } from "@/lib/supabase/client";

function getRedirectTo() {
  if (typeof window === "undefined") return "/";

  const redirectTo = new URLSearchParams(window.location.search).get("redirectTo") || "/";
  if (!redirectTo.startsWith("/") || redirectTo.startsWith("//")) return "/";
  return redirectTo;
}

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [redirectTo, setRedirectTo] = useState("/");
  const [message, setMessage] = useState("Login with Supabase Auth email/password.");
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    let isMounted = true;
    const nextRedirectTo = getRedirectTo();
    setRedirectTo(nextRedirectTo);

    async function checkExistingSession() {
      const supabase = createBrowserSupabaseClient();
      const { data } = await supabase.auth.getSession();
      if (isMounted && data.session) setMessage("Already logged in. You can continue or logout from a protected page.");
    }

    checkExistingSession();

    return () => {
      isMounted = false;
    };
  }, []);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (isSubmitting) return;

    const trimmedEmail = email.trim();
    if (!trimmedEmail || !password) {
      setMessage("Please enter email and password.");
      return;
    }

    setIsSubmitting(true);
    setMessage("");

    try {
      const supabase = createBrowserSupabaseClient();
      const { error } = await supabase.auth.signInWithPassword({
        email: trimmedEmail,
        password,
      });

      if (error) throw error;

      setMessage("Login successful. Redirecting...");
      router.replace(redirectTo);
      router.refresh();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Login failed.");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <main className="mx-auto flex min-h-screen w-full max-w-md flex-col justify-center px-4 py-8">
      <section className="rounded-2xl border border-orange-100 bg-white p-5 shadow-soft">
        <div className="mb-5">
          <p className="text-xs font-black uppercase text-brand-primary">WCKaona</p>
          <h1 className="text-2xl font-black text-slate-950">Login</h1>
          <p className="mt-1 text-sm text-slate-500">Return to {redirectTo}</p>
        </div>

        <form className="grid gap-4" onSubmit={handleSubmit}>
          <label className="grid gap-2 text-sm font-semibold text-slate-700" htmlFor="email">
            Email
            <input
              id="email"
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              autoComplete="email"
              className="h-12 rounded-2xl border border-slate-200 px-4 font-medium outline-none focus:border-brand-primary"
            />
          </label>

          <label className="grid gap-2 text-sm font-semibold text-slate-700" htmlFor="password">
            Password
            <input
              id="password"
              type="password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              autoComplete="current-password"
              className="h-12 rounded-2xl border border-slate-200 px-4 font-medium outline-none focus:border-brand-primary"
            />
          </label>

          {message ? <p className="rounded-xl bg-slate-50 px-3 py-2 text-sm font-semibold text-slate-600">{message}</p> : null}

          <button type="submit" disabled={isSubmitting} className="h-12 rounded-2xl bg-brand-primary font-bold text-white shadow-soft disabled:bg-slate-300">
            {isSubmitting ? "Logging in" : "Login"}
          </button>
        </form>

        <Link href="/" className="mt-4 block text-center text-sm font-bold text-brand-primary">
          Back Home
        </Link>
      </section>
    </main>
  );
}
