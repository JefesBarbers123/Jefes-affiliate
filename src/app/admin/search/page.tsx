"use client";

import { useMemo, useState } from "react";
import { Search, MapPin, CalendarDays, User } from "lucide-react";

type SearchItem = {
  id: string;
  name: string;
  email: string;
  phone: string;
  barberCustomId: string;
  contractStatus: boolean;
  locationsWorked: string[];
  nextAvailableDate: string;
};

type OpenSlot = {
  id: string;
  location: string;
  date: string;
  dayRate: number;
  status: string;
};

const DAYS = [
  "",
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
  "Sunday",
];

export default function AdminSearchPage() {
  const [q, setQ] = useState("");
  const [location, setLocation] = useState("");
  const [date, setDate] = useState("");
  const [day, setDay] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [items, setItems] = useState<SearchItem[]>([]);
  const [openSlots, setOpenSlots] = useState<OpenSlot[]>([]);
  const [hasSearched, setHasSearched] = useState(false);

  const resultCountText = useMemo(
    () => `${items.length} barber${items.length === 1 ? "" : "s"} found`,
    [items.length]
  );

  async function runSearch(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setHasSearched(true);

    try {
      const params = new URLSearchParams();
      if (q.trim()) params.set("q", q.trim());
      if (location.trim()) params.set("location", location.trim());
      if (date) params.set("date", date);
      if (day) params.set("day", day);

      const res = await fetch(`/api/admin/search?${params.toString()}`);
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Could not run search.");
        setItems([]);
        setOpenSlots([]);
        return;
      }
      setItems(data.items || []);
      setOpenSlots(data.openSlots || []);
    } catch {
      setError("Could not run search.");
      setItems([]);
      setOpenSlots([]);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-zinc-950 px-6 py-6 text-zinc-100">
      <div className="mx-auto max-w-6xl space-y-4">
        <header>
          <p className="text-xs uppercase tracking-[0.2em] text-zinc-500">
            Admin Dashboard
          </p>
          <h1 className="mt-1 text-2xl font-semibold tracking-tight">
            Barber Search Console
          </h1>
          <p className="text-sm text-zinc-500">
            Find barbers by name, location history, day, or date and quickly see open work slots.
          </p>
        </header>

        <form
          onSubmit={runSearch}
          className="rounded-2xl border border-zinc-800 bg-zinc-900/70 p-4 shadow-lg shadow-black/40"
        >
          <div className="grid gap-3 md:grid-cols-5">
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Search barber (name, email, phone, ID)"
              className="rounded-xl border border-zinc-700 bg-zinc-900 px-3 py-2 text-sm outline-none focus:border-yellow-300/60 md:col-span-2"
            />
            <input
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              placeholder="Location (e.g. Soho)"
              className="rounded-xl border border-zinc-700 bg-zinc-900 px-3 py-2 text-sm outline-none focus:border-yellow-300/60"
            />
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="rounded-xl border border-zinc-700 bg-zinc-900 px-3 py-2 text-sm outline-none focus:border-yellow-300/60"
            />
            <select
              value={day}
              onChange={(e) => setDay(e.target.value)}
              className="rounded-xl border border-zinc-700 bg-zinc-900 px-3 py-2 text-sm outline-none focus:border-yellow-300/60"
            >
              {DAYS.map((d) => (
                <option key={d || "any"} value={d}>
                  {d || "Any day"}
                </option>
              ))}
            </select>
          </div>
          <button
            disabled={loading}
            className="mt-3 inline-flex items-center gap-2 rounded-xl bg-yellow-300 px-4 py-2 text-sm font-semibold text-zinc-950 hover:bg-yellow-200 disabled:opacity-60"
          >
            <Search className="h-4 w-4" />
            {loading ? "Searching..." : "Search barbers"}
          </button>
        </form>

        {error && (
          <p className="rounded-lg border border-red-500/40 bg-red-500/10 px-3 py-2 text-xs text-red-200">
            {error}
          </p>
        )}

        {hasSearched && !error && (
          <p className="text-sm text-zinc-400">{resultCountText}</p>
        )}

        <section className="grid gap-4 lg:grid-cols-3">
          <div className="space-y-3 lg:col-span-2">
            {items.map((barber) => (
              <div
                key={barber.id}
                className="rounded-2xl border border-zinc-800 bg-zinc-900/70 p-4 shadow-lg shadow-black/40"
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-base font-semibold text-zinc-100">
                      {barber.name || "Unnamed barber"}
                    </p>
                    <p className="text-xs text-zinc-400">{barber.email || "No email"}</p>
                  </div>
                  <span
                    className={`rounded-full px-2.5 py-1 text-xs ${
                      barber.contractStatus
                        ? "border border-emerald-500/40 bg-emerald-500/10 text-emerald-200"
                        : "border border-amber-500/40 bg-amber-500/10 text-amber-200"
                    }`}
                  >
                    {barber.contractStatus ? "Contract active" : "Contract pending"}
                  </span>
                </div>

                <div className="mt-3 grid gap-2 sm:grid-cols-2">
                  <p className="inline-flex items-center gap-1 text-xs text-zinc-300">
                    <User className="h-3.5 w-3.5 text-zinc-500" />
                    ID: {barber.barberCustomId || "Not set"}
                  </p>
                  <p className="inline-flex items-center gap-1 text-xs text-zinc-300">
                    <CalendarDays className="h-3.5 w-3.5 text-zinc-500" />
                    Next available: {barber.nextAvailableDate || "Not listed"}
                  </p>
                  <p className="inline-flex items-center gap-1 text-xs text-zinc-300 sm:col-span-2">
                    <MapPin className="h-3.5 w-3.5 text-zinc-500" />
                    Locations worked:{" "}
                    {barber.locationsWorked.length
                      ? barber.locationsWorked.join(", ")
                      : "No location history"}
                  </p>
                  <p className="text-xs text-zinc-400 sm:col-span-2">
                    Phone: {barber.phone || "Not provided"}
                  </p>
                </div>
              </div>
            ))}

            {hasSearched && !loading && items.length === 0 && !error && (
              <p className="rounded-xl border border-zinc-800 bg-zinc-900/70 p-4 text-sm text-zinc-400">
                No barbers matched this search. Try removing one filter.
              </p>
            )}
          </div>

          <aside className="rounded-2xl border border-zinc-800 bg-zinc-900/70 p-4 shadow-lg shadow-black/40">
            <h2 className="text-sm font-semibold text-zinc-100">Open Work Slots</h2>
            <p className="mt-1 text-xs text-zinc-500">
              Pending appointments with no assigned barber.
            </p>
            <div className="mt-3 space-y-2">
              {openSlots.length === 0 ? (
                <p className="text-xs text-zinc-500">No open slots for current filters.</p>
              ) : (
                openSlots.map((slot) => (
                  <div
                    key={slot.id}
                    className="rounded-xl border border-zinc-800 bg-zinc-900 px-3 py-2"
                  >
                    <p className="text-sm text-zinc-200">{slot.location || "Unknown"}</p>
                    <p className="text-xs text-zinc-400">{slot.date || "No date"}</p>
                    <p className="text-xs text-zinc-500">
                      £{slot.dayRate.toFixed(2)} · {slot.status}
                    </p>
                  </div>
                ))
              )}
            </div>
          </aside>
        </section>
      </div>
    </div>
  );
}

