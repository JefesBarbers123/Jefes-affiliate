"use client";

import { useEffect, useState } from "react";
import { UserRound, Save } from "lucide-react";

export default function BarberProfilePage() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [bankDetails, setBankDetails] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function load() {
      try {
        const res = await fetch("/api/barber/me");
        const data = await res.json();
        if (!res.ok) {
          setError(data.error || "Could not load your profile.");
          setLoading(false);
          return;
        }
        setName(data.name || "");
        setEmail(data.email || "");
        setBankDetails(data.bankDetails || "");
      } catch {
        setError("Could not load your profile.");
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  async function onSave(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setMessage(null);
    setError(null);

    try {
      const res = await fetch("/api/barber/me", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, bankDetails }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Could not save profile.");
        setSaving(false);
        return;
      }
      setMessage("Profile updated successfully.");
    } catch {
      setError("Could not save profile.");
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return <div className="min-h-screen bg-zinc-950 p-6 text-zinc-100">Loading profile...</div>;
  }

  return (
    <div className="min-h-screen bg-zinc-950 px-4 py-6 text-zinc-100">
      <div className="mx-auto max-w-2xl rounded-2xl border border-zinc-800 bg-zinc-900/70 p-6 shadow-lg shadow-black/40">
        <div className="mb-5 flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-linear-to-tr from-zinc-50 to-zinc-400 text-zinc-900">
            <UserRound className="h-5 w-5" />
          </div>
          <div>
            <h1 className="text-xl font-semibold tracking-tight">My Profile</h1>
            <p className="text-xs text-zinc-500">Update your barber details and payout info.</p>
          </div>
        </div>

        <form onSubmit={onSave} className="space-y-4">
          <div>
            <label className="mb-1 block text-sm text-zinc-300">Name</label>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full rounded-xl border border-zinc-700 bg-zinc-900 px-3 py-2 text-sm outline-none focus:border-zinc-400"
              required
            />
          </div>
          <div>
            <label className="mb-1 block text-sm text-zinc-300">Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full rounded-xl border border-zinc-700 bg-zinc-900 px-3 py-2 text-sm outline-none focus:border-zinc-400"
              required
            />
          </div>
          <div>
            <label className="mb-1 block text-sm text-zinc-300">Bank details</label>
            <textarea
              value={bankDetails}
              onChange={(e) => setBankDetails(e.target.value)}
              rows={3}
              className="w-full rounded-xl border border-zinc-700 bg-zinc-900 px-3 py-2 text-sm outline-none focus:border-zinc-400"
            />
          </div>

          {message && (
            <p className="rounded-lg border border-emerald-500/40 bg-emerald-500/10 px-3 py-2 text-xs text-emerald-200">
              {message}
            </p>
          )}
          {error && (
            <p className="rounded-lg border border-red-500/40 bg-red-500/10 px-3 py-2 text-xs text-red-200">
              {error}
            </p>
          )}

          <button
            disabled={saving}
            className="inline-flex items-center gap-2 rounded-xl bg-zinc-50 px-4 py-2 text-sm font-medium text-zinc-950 hover:bg-zinc-200 disabled:opacity-60"
          >
            <Save className="h-4 w-4" />
            {saving ? "Saving..." : "Save profile"}
          </button>
        </form>
      </div>
    </div>
  );
}

