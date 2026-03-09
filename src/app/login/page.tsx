"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { LogIn, Mail, KeyRound } from "lucide-react";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [redirectPath, setRedirectPath] = useState("/barber");

  useEffect(() => {
    const value = new URLSearchParams(window.location.search).get("redirect");
    if (value) {
      setRedirectPath(value);
    }
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const normalizedEmail = email.trim().toLowerCase();
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: normalizedEmail, password }),
      });

      if (!res.ok) {
        const data = await res.json();
        setError(data.error || "Login failed");
        setLoading(false);
        return;
      }

      router.push(redirectPath);
    } catch (err) {
      console.error(err);
      setError("Unexpected error occurred");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-zinc-950 px-4 py-8 text-zinc-100 sm:px-6">
      <div className="mx-auto w-full max-w-md rounded-2xl border border-zinc-800 bg-zinc-900/70 p-8 shadow-lg shadow-black/40">
        <div className="flex items-center gap-3 mb-6">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-linear-to-tr from-zinc-50 to-zinc-400 text-zinc-900">
            <LogIn className="h-5 w-5" />
          </div>
          <div>
            <h1 className="text-xl font-semibold tracking-tight">
              Jefes Affiliates Login
            </h1>
            <p className="text-sm text-zinc-400">
              Access your UK filler-work bookings, earnings, and withdrawal dashboard.
            </p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <label className="text-sm font-medium text-zinc-200">
              Email address
            </label>
            <div className="flex items-center gap-2 rounded-xl border border-zinc-700 bg-zinc-900 px-3 py-2 focus-within:border-zinc-400">
              <Mail className="h-4 w-4 text-zinc-500" />
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="flex-1 bg-transparent text-sm outline-none placeholder:text-zinc-600"
                placeholder="you@example.com"
              />
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-zinc-200">
              Password (if set)
            </label>
            <div className="flex items-center gap-2 rounded-xl border border-zinc-700 bg-zinc-900 px-3 py-2 focus-within:border-zinc-400">
              <KeyRound className="h-4 w-4 text-zinc-500" />
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="flex-1 bg-transparent text-sm outline-none placeholder:text-zinc-600"
                placeholder="Enter password if your account has one"
              />
            </div>
          </div>

          {error && (
            <p className="rounded-md bg-red-500/10 border border-red-500/40 px-3 py-2 text-xs text-red-200">
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="flex w-full items-center justify-center gap-2 rounded-xl bg-zinc-50 px-4 py-2.5 text-sm font-medium text-zinc-950 shadow-md shadow-zinc-950/30 hover:bg-zinc-200 disabled:opacity-60 disabled:cursor-not-allowed transition"
          >
            {loading ? (
              "Signing in..."
            ) : (
              <>
                <LogIn className="h-4 w-4" />
                <span>Sign in</span>
              </>
            )}
          </button>

          <p className="pt-2 text-xs text-zinc-500">
            Don&apos;t have an account yet? Ask your manager for an invite link
            or{" "}
            <a
              href="/signup"
              className="text-zinc-200 underline-offset-2 hover:underline"
            >
              sign up here
            </a>
            .
          </p>
          <p className="text-xs text-zinc-500">
            Referral tip: invite another barber and earn an extra 10% paid by us,
            not deducted from their wage.
          </p>
        </form>
      </div>
    </div>
  );
}

