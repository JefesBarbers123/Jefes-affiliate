"use client";

import { useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import { UserPlus, Mail, Link2, Banknote, Phone, KeyRound, Hash } from "lucide-react";

export default function SignupPage() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [barberCustomId, setBarberCustomId] = useState("");
  const [password, setPassword] = useState("");
  const [bankDetails, setBankDetails] = useState("");
  const [referralCode, setReferralCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fromLink = new URLSearchParams(window.location.search).get("ref");
    if (fromLink) {
      setReferralCode(fromLink.toUpperCase());
    }
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const res = await fetch("/api/auth/signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          email,
          phone,
          barberCustomId,
          password,
          bankDetails,
          referralCode,
        }),
      });

      if (!res.ok) {
        let msg = "Signup failed";
        try {
          const data = await res.json();
          if (data.error) msg = data.error;
        } catch {
          if (res.status === 500) msg = "Server error. Check that the app is running and try again.";
        }
        setError(msg);
        setLoading(false);
        return;
      }

      router.push("/barber");
    } catch (err) {
      console.error(err);
      setError("Could not reach the server. Try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-zinc-950 px-4 py-8 text-zinc-100 sm:px-6">
      <div className="mx-auto w-full max-w-2xl rounded-2xl border border-zinc-800 bg-zinc-900/70 p-6 shadow-lg shadow-black/40 sm:p-8">
        <div className="mb-6 flex items-start gap-3 border-b border-zinc-800 pb-5">
          <div className="mt-0.5 flex h-10 w-14 shrink-0 items-center justify-center">
            <span className="brand-logo-3d" aria-hidden>
              <span className="brand-logo-3d-face brand-logo-3d-front">
                <img
                  src="/api/brand/logo"
                  alt=""
                  className="h-full w-full object-cover brightness-110 contrast-125"
                />
              </span>
              <span className="brand-logo-3d-face brand-logo-3d-back">
                <img
                  src="/api/brand/logo"
                  alt=""
                  className="h-full w-full object-cover brightness-110 contrast-125"
                />
              </span>
            </span>
          </div>
          <div>
            <h1 className="text-xl font-semibold tracking-tight sm:text-2xl">
              Join Jefes Affiliates
            </h1>
            <p className="mt-1 text-sm text-zinc-400">
              Apply for additional barber work around the UK and pick up filler
              shifts to increase your barber income.
            </p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          <section className="space-y-4">
            <h2 className="text-xs uppercase tracking-[0.2em] text-zinc-500">
              Profile details
            </h2>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <label className="text-sm font-medium text-zinc-200">
                  Full name
                </label>
                <div className="flex items-center gap-2 rounded-xl border border-zinc-700 bg-zinc-900 px-3 py-2 focus-within:border-zinc-400">
                  <UserPlus className="h-4 w-4 text-zinc-500" />
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="flex-1 bg-transparent text-sm outline-none placeholder:text-zinc-600"
                    placeholder="Your name"
                  />
                </div>
              </div>

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
            </div>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <label className="text-sm font-medium text-zinc-200">
                  Phone
                </label>
                <div className="flex items-center gap-2 rounded-xl border border-zinc-700 bg-zinc-900 px-3 py-2 focus-within:border-zinc-400">
                  <Phone className="h-4 w-4 text-zinc-500" />
                  <input
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="flex-1 bg-transparent text-sm outline-none placeholder:text-zinc-600"
                    placeholder="+44..."
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-zinc-200">
                  Barber ID (optional)
                </label>
                <div className="flex items-center gap-2 rounded-xl border border-zinc-700 bg-zinc-900 px-3 py-2 focus-within:border-zinc-400">
                  <Hash className="h-4 w-4 text-zinc-500" />
                  <input
                    type="text"
                    value={barberCustomId}
                    onChange={(e) => setBarberCustomId(e.target.value)}
                    className="flex-1 bg-transparent text-sm outline-none placeholder:text-zinc-600"
                    placeholder="BRB-001"
                  />
                </div>
              </div>
            </div>
          </section>

          <section className="space-y-2">
            <h2 className="text-xs uppercase tracking-[0.2em] text-zinc-500">
              Security
            </h2>
            <label className="text-sm font-medium text-zinc-200">
              Password (optional, min 8 chars)
            </label>
            <div className="flex items-center gap-2 rounded-xl border border-zinc-700 bg-zinc-900 px-3 py-2 focus-within:border-zinc-400">
              <KeyRound className="h-4 w-4 text-zinc-500" />
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="flex-1 bg-transparent text-sm outline-none placeholder:text-zinc-600"
                placeholder="Set a password now or later in settings"
              />
            </div>
          </section>

          <section className="space-y-4">
            <h2 className="text-xs uppercase tracking-[0.2em] text-zinc-500">
              Payment and referral
            </h2>
            <div className="space-y-2">
              <label className="text-sm font-medium text-zinc-200">
                Bank details
              </label>
              <div className="flex items-start gap-2 rounded-xl border border-zinc-700 bg-zinc-900 px-3 py-2 focus-within:border-zinc-400">
                <Banknote className="mt-1 h-4 w-4 text-zinc-500" />
                <textarea
                  value={bankDetails}
                  onChange={(e) => setBankDetails(e.target.value)}
                  className="resize-none flex-1 bg-transparent text-sm outline-none placeholder:text-zinc-600"
                  rows={2}
                  placeholder="Account name, sort code, account number (or preferred payout details)"
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-zinc-200">
                Referral code (optional)
              </label>
              <div className="flex items-center gap-2 rounded-xl border border-zinc-700 bg-zinc-900 px-3 py-2 focus-within:border-zinc-400">
                <Link2 className="h-4 w-4 text-zinc-500" />
                <input
                  type="text"
                  value={referralCode}
                  onChange={(e) => setReferralCode(e.target.value)}
                  className="flex-1 bg-transparent text-sm uppercase tracking-widest outline-none placeholder:text-zinc-600"
                  placeholder="ABC123"
                />
              </div>
              <p className="text-xs text-zinc-500">
                If another barber invited you, enter their referral code.
                They can earn an additional 10% paid by us, and it is not
                taken from your wage.
              </p>
            </div>
          </section>

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
            {loading ? "Creating profile..." : "Create my profile"}
          </button>

          <p className="pt-2 text-xs text-zinc-500">
            Already have an account?{" "}
            <a
              href="/login"
              className="text-zinc-200 underline-offset-2 hover:underline"
            >
              Log in
            </a>
            .
          </p>
        </form>
      </div>
    </div>
  );
}

