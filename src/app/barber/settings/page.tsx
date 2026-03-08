"use client";

import { useEffect, useState } from "react";
import { Save, ShieldCheck, UserRound } from "lucide-react";

export default function BarberSettingsPage() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [barberCustomId, setBarberCustomId] = useState("");
  const [bankDetails, setBankDetails] = useState("");
  const [workImage1Url, setWorkImage1Url] = useState("");
  const [workImage2Url, setWorkImage2Url] = useState("");
  const [workImage3Url, setWorkImage3Url] = useState("");
  const [hasPassword, setHasPassword] = useState(false);
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [loading, setLoading] = useState(true);
  const [savingProfile, setSavingProfile] = useState(false);
  const [savingPassword, setSavingPassword] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function load() {
      try {
        const res = await fetch("/api/barber/me");
        const data = await res.json();
        if (!res.ok) {
          setError(data.error || "Could not load settings.");
          setLoading(false);
          return;
        }
        setName(data.name || "");
        setEmail(data.email || "");
        setPhone(data.phone || "");
        setBarberCustomId(data.barberCustomId || "");
        setBankDetails(data.bankDetails || "");
        setWorkImage1Url(data.workImage1Url || "");
        setWorkImage2Url(data.workImage2Url || "");
        setWorkImage3Url(data.workImage3Url || "");
        setHasPassword(Boolean(data.hasPassword));
      } catch {
        setError("Could not load settings.");
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  async function saveProfile(e: React.FormEvent) {
    e.preventDefault();
    setSavingProfile(true);
    setMessage(null);
    setError(null);

    try {
      const res = await fetch("/api/barber/me", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          email,
          phone,
          barberCustomId,
          bankDetails,
          workImage1Url,
          workImage2Url,
          workImage3Url,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Could not save settings.");
        setSavingProfile(false);
        return;
      }
      setMessage("Profile settings updated.");
    } catch {
      setError("Could not save settings.");
    } finally {
      setSavingProfile(false);
    }
  }

  async function savePassword(e: React.FormEvent) {
    e.preventDefault();
    setSavingPassword(true);
    setMessage(null);
    setError(null);

    try {
      const res = await fetch("/api/barber/me", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          currentPassword,
          newPassword,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Could not update password.");
        setSavingPassword(false);
        return;
      }
      setCurrentPassword("");
      setNewPassword("");
      setHasPassword(true);
      setMessage("Password updated.");
    } catch {
      setError("Could not update password.");
    } finally {
      setSavingPassword(false);
    }
  }

  if (loading) {
    return <div className="min-h-screen bg-zinc-950 p-6 text-zinc-100">Loading settings...</div>;
  }

  return (
    <div className="min-h-screen bg-zinc-950 px-4 py-6 text-zinc-100">
      <div className="mx-auto max-w-3xl space-y-4">
        <div className="rounded-2xl border border-zinc-800 bg-zinc-900/70 p-6 shadow-lg shadow-black/40">
          <div className="mb-5 flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-linear-to-tr from-zinc-50 to-zinc-400 text-zinc-900">
              <UserRound className="h-5 w-5" />
            </div>
            <div>
              <h1 className="text-xl font-semibold tracking-tight">Barber Settings</h1>
              <p className="text-xs text-zinc-500">
                Update your profile details, bank details, barber ID, and password.
              </p>
            </div>
          </div>

          <form onSubmit={saveProfile} className="space-y-3">
            <div className="grid gap-3 sm:grid-cols-2">
              <input
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Full name"
                className="rounded-xl border border-zinc-700 bg-zinc-900 px-3 py-2 text-sm outline-none focus:border-zinc-400"
              />
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Email"
                className="rounded-xl border border-zinc-700 bg-zinc-900 px-3 py-2 text-sm outline-none focus:border-zinc-400"
              />
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              <input
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="Phone number"
                className="rounded-xl border border-zinc-700 bg-zinc-900 px-3 py-2 text-sm outline-none focus:border-zinc-400"
              />
              <input
                value={barberCustomId}
                onChange={(e) => setBarberCustomId(e.target.value)}
                placeholder="Barber ID (e.g. BRB-001)"
                className="rounded-xl border border-zinc-700 bg-zinc-900 px-3 py-2 text-sm outline-none focus:border-zinc-400"
              />
            </div>
            <textarea
              value={bankDetails}
              onChange={(e) => setBankDetails(e.target.value)}
              rows={3}
              placeholder="Bank details"
              className="w-full rounded-xl border border-zinc-700 bg-zinc-900 px-3 py-2 text-sm outline-none focus:border-zinc-400"
            />

            <div className="rounded-xl border border-zinc-800 bg-zinc-900 p-3">
              <p className="mb-2 text-xs uppercase tracking-[0.2em] text-zinc-500">
                Work Gallery (3 images)
              </p>
              <p className="mb-3 text-xs text-zinc-400">
                Paste 3 image URLs from Instagram, Google Drive public links, or your website.
              </p>
              <div className="space-y-2">
                <input
                  value={workImage1Url}
                  onChange={(e) => setWorkImage1Url(e.target.value)}
                  placeholder="Image 1 URL"
                  className="w-full rounded-xl border border-zinc-700 bg-zinc-900 px-3 py-2 text-sm outline-none focus:border-zinc-400"
                />
                <input
                  value={workImage2Url}
                  onChange={(e) => setWorkImage2Url(e.target.value)}
                  placeholder="Image 2 URL"
                  className="w-full rounded-xl border border-zinc-700 bg-zinc-900 px-3 py-2 text-sm outline-none focus:border-zinc-400"
                />
                <input
                  value={workImage3Url}
                  onChange={(e) => setWorkImage3Url(e.target.value)}
                  placeholder="Image 3 URL"
                  className="w-full rounded-xl border border-zinc-700 bg-zinc-900 px-3 py-2 text-sm outline-none focus:border-zinc-400"
                />
              </div>

              <div className="mt-3 grid grid-cols-3 gap-2">
                {[workImage1Url, workImage2Url, workImage3Url].map((url, i) => (
                  <div
                    key={`preview-${i}`}
                    className="aspect-square overflow-hidden rounded-lg border border-zinc-800 bg-zinc-950"
                  >
                    {url ? (
                      <img
                        src={url}
                        alt={`Work preview ${i + 1}`}
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      <div className="flex h-full items-center justify-center text-[10px] text-zinc-600">
                        Image {i + 1}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>

            <button
              disabled={savingProfile}
              className="inline-flex items-center gap-2 rounded-xl bg-zinc-50 px-4 py-2 text-sm font-medium text-zinc-950 hover:bg-zinc-200 disabled:opacity-60"
            >
              <Save className="h-4 w-4" />
              {savingProfile ? "Saving..." : "Save profile settings"}
            </button>
          </form>
        </div>

        <div className="rounded-2xl border border-zinc-800 bg-zinc-900/70 p-6 shadow-lg shadow-black/40">
          <div className="mb-3 flex items-center gap-2">
            <ShieldCheck className="h-5 w-5 text-zinc-400" />
            <h2 className="text-lg font-medium">Password</h2>
          </div>
          <p className="mb-3 text-xs text-zinc-500">
            {hasPassword
              ? "You already have a password. Enter current password to change it."
              : "No password set yet. Create one to secure your account login."}
          </p>
          <form onSubmit={savePassword} className="space-y-3">
            {hasPassword && (
              <input
                type="password"
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                placeholder="Current password"
                className="w-full rounded-xl border border-zinc-700 bg-zinc-900 px-3 py-2 text-sm outline-none focus:border-zinc-400"
              />
            )}
            <input
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              placeholder="New password (min 8 characters)"
              className="w-full rounded-xl border border-zinc-700 bg-zinc-900 px-3 py-2 text-sm outline-none focus:border-zinc-400"
            />

            <button
              disabled={savingPassword}
              className="inline-flex items-center gap-2 rounded-xl bg-zinc-50 px-4 py-2 text-sm font-medium text-zinc-950 hover:bg-zinc-200 disabled:opacity-60"
            >
              <Save className="h-4 w-4" />
              {savingPassword ? "Saving..." : "Save password"}
            </button>
          </form>
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
      </div>
    </div>
  );
}

