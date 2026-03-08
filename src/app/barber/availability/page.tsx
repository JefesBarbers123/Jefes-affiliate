"use client";

import { useEffect, useState } from "react";
import { CalendarDays, Save } from "lucide-react";

type Item = { id: string; date: string; status: "Available" | "Booked" };

export default function BarberAvailabilityPage() {
  const [date, setDate] = useState("");
  const [singleStatus, setSingleStatus] = useState<"Available" | "Booked">(
    "Available"
  );
  const [weeklyStatus, setWeeklyStatus] = useState<"Available" | "Booked">(
    "Available"
  );
  const [weeks, setWeeks] = useState(9);
  const [selectedDays, setSelectedDays] = useState<string[]>([]);
  const [items, setItems] = useState<Item[]>([]);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function load() {
    const res = await fetch("/api/barber/availability");
    const data = await res.json();
    if (!res.ok) {
      setError(data.error || "Could not load availability.");
      return;
    }
    setItems((data.items || []) as Item[]);
  }

  useEffect(() => {
    load().catch(() => setError("Could not load availability."));
  }, []);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setMessage(null);
    setError(null);

    try {
      const res = await fetch("/api/barber/availability", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ date, status: singleStatus }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Could not save availability.");
        setSaving(false);
        return;
      }
      setMessage("Single date saved.");
      await load();
    } catch {
      setError("Could not save availability.");
    } finally {
      setSaving(false);
    }
  }

  async function onSaveWeeklyPattern(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setMessage(null);
    setError(null);

    if (selectedDays.length === 0) {
      setError("Select at least one day (Mon-Sun).");
      setSaving(false);
      return;
    }

    try {
      const res = await fetch("/api/barber/availability", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          days: selectedDays,
          weeks,
          status: weeklyStatus,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Could not save weekly availability.");
        setSaving(false);
        return;
      }
      setMessage(`Saved ${data.upserted ?? 0} day(s) from weekly pattern.`);
      await load();
    } catch {
      setError("Could not save weekly availability.");
    } finally {
      setSaving(false);
    }
  }

  function toggleDay(day: string) {
    setSelectedDays((prev) =>
      prev.includes(day) ? prev.filter((d) => d !== day) : [...prev, day]
    );
  }

  return (
    <div className="min-h-screen bg-zinc-950 px-4 py-6 text-zinc-100">
      <div className="mx-auto max-w-2xl rounded-2xl border border-zinc-800 bg-zinc-900/70 p-6 shadow-lg shadow-black/40">
        <div className="mb-5 flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-linear-to-tr from-zinc-50 to-zinc-400 text-zinc-900">
            <CalendarDays className="h-5 w-5" />
          </div>
          <div>
            <h1 className="text-xl font-semibold tracking-tight">My Availability</h1>
            <p className="text-xs text-zinc-500">
              Choose one option below. Option A is for one date. Option B is for regular weekly days.
            </p>
          </div>
        </div>

        <form
          onSubmit={onSubmit}
          className="mb-5 rounded-xl border border-zinc-800 bg-zinc-900 p-3"
        >
          <p className="mb-1 text-xs uppercase tracking-[0.2em] text-zinc-500">
            Option A: Save one specific date
          </p>
          <p className="mb-3 text-xs text-zinc-400">
            Use this when you only want to update one day.
          </p>

          <div className="grid gap-3 sm:grid-cols-3">
            <input
              type="date"
              required
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="rounded-xl border border-zinc-700 bg-zinc-900 px-3 py-2 text-sm outline-none focus:border-zinc-400"
            />
            <select
              value={singleStatus}
              onChange={(e) =>
                setSingleStatus(e.target.value as "Available" | "Booked")
              }
              className="rounded-xl border border-zinc-700 bg-zinc-900 px-3 py-2 text-sm outline-none focus:border-zinc-400"
            >
              <option value="Available">Available</option>
              <option value="Booked">Booked</option>
            </select>
            <button
              disabled={saving}
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-zinc-50 px-4 py-2 text-sm font-medium text-zinc-950 hover:bg-zinc-200 disabled:opacity-60"
            >
              <Save className="h-4 w-4" />
              {saving ? "Saving..." : "Save single date"}
            </button>
          </div>
        </form>

        <form
          onSubmit={onSaveWeeklyPattern}
          className="mb-5 rounded-xl border border-zinc-800 bg-zinc-900 p-3"
        >
          <p className="mb-1 text-xs uppercase tracking-[0.2em] text-zinc-500">
            Option B: Save weekly pattern (best for full-day contracts)
          </p>
          <p className="mb-3 text-xs text-zinc-400">
            Tick the days you usually work, choose how many weeks ahead, then save once.
          </p>
          <div className="mb-3 grid grid-cols-2 gap-2 sm:grid-cols-4">
            {[
              "Monday",
              "Tuesday",
              "Wednesday",
              "Thursday",
              "Friday",
              "Saturday",
              "Sunday",
            ].map((day) => (
              <label
                key={day}
                className="flex items-center gap-2 rounded-lg border border-zinc-700 px-2 py-1.5 text-xs text-zinc-300"
              >
                <input
                  type="checkbox"
                  checked={selectedDays.includes(day)}
                  onChange={() => toggleDay(day)}
                />
                {day}
              </label>
            ))}
          </div>

          <div className="grid gap-3 sm:grid-cols-3">
            <select
              value={weeklyStatus}
              onChange={(e) =>
                setWeeklyStatus(e.target.value as "Available" | "Booked")
              }
              className="rounded-xl border border-zinc-700 bg-zinc-900 px-3 py-2 text-sm outline-none focus:border-zinc-400"
            >
              <option value="Available">Available</option>
              <option value="Booked">Booked</option>
            </select>
            <input
              type="number"
              min={1}
              max={26}
              value={weeks}
              onChange={(e) => setWeeks(Number(e.target.value || 9))}
              className="rounded-xl border border-zinc-700 bg-zinc-900 px-3 py-2 text-sm outline-none focus:border-zinc-400"
              placeholder="Weeks ahead"
            />
            <button
              disabled={saving}
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-zinc-50 px-4 py-2 text-sm font-medium text-zinc-950 hover:bg-zinc-200 disabled:opacity-60"
            >
              <Save className="h-4 w-4" />
              {saving ? "Saving..." : "Save weekly pattern"}
            </button>
          </div>
        </form>

        {message && (
          <p className="mb-3 rounded-lg border border-emerald-500/40 bg-emerald-500/10 px-3 py-2 text-xs text-emerald-200">
            {message}
          </p>
        )}
        {error && (
          <p className="mb-3 rounded-lg border border-red-500/40 bg-red-500/10 px-3 py-2 text-xs text-red-200">
            {error}
          </p>
        )}

        <p className="mb-2 text-xs uppercase tracking-[0.2em] text-zinc-500">
          Saved availability
        </p>
        <div className="space-y-2">
          {items.length === 0 ? (
            <p className="text-sm text-zinc-500">No availability records yet.</p>
          ) : (
            items.map((item) => (
              <div
                key={item.id}
                className="flex items-center justify-between rounded-xl border border-zinc-800 bg-zinc-900 px-3 py-2"
              >
                <p className="text-sm text-zinc-200">{item.date}</p>
                <span className="rounded-full bg-zinc-800 px-2.5 py-1 text-xs text-zinc-300">
                  {item.status}
                </span>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}

