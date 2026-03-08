"use client";

import { useEffect, useMemo, useState } from "react";

type AdminWithdrawal = {
  id: string;
  barberId: string;
  barberName: string;
  amount: number;
  status: string;
  requestedAt: string;
  processedAt: string;
  note: string;
};

type StatusOption = "Requested" | "Approved" | "Paid" | "Rejected";

const STATUS_OPTIONS: StatusOption[] = ["Requested", "Approved", "Paid", "Rejected"];

export default function AdminWithdrawalsPage() {
  const [items, setItems] = useState<AdminWithdrawal[]>([]);
  const [tableReady, setTableReady] = useState(true);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [savingId, setSavingId] = useState<string | null>(null);

  async function load() {
    const res = await fetch("/api/admin/withdrawals");
    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.error || "Could not load withdrawals.");
    }
    setItems(data.items || []);
    setTableReady(Boolean(data.tableReady));
  }

  useEffect(() => {
    load().catch((err) => {
      setError(err instanceof Error ? err.message : "Could not load withdrawals.");
    });
  }, []);

  const totals = useMemo(() => {
    return items.reduce(
      (acc, item) => {
        if (item.status === "Requested") acc.requested += item.amount;
        if (item.status === "Approved") acc.approved += item.amount;
        if (item.status === "Paid") acc.paid += item.amount;
        return acc;
      },
      { requested: 0, approved: 0, paid: 0 }
    );
  }, [items]);

  async function updateStatus(id: string, status: StatusOption) {
    setSavingId(id);
    setError(null);
    setMessage(null);
    try {
      const res = await fetch(`/api/admin/withdrawals/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Could not update request.");
      setMessage("Withdrawal status updated.");
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not update request.");
    } finally {
      setSavingId(null);
    }
  }

  return (
    <div className="min-h-screen bg-zinc-950 px-6 py-6 text-zinc-100">
      <div className="mx-auto max-w-5xl space-y-4">
        <header>
          <p className="text-xs uppercase tracking-[0.2em] text-zinc-500">Admin Dashboard</p>
          <h1 className="mt-1 text-2xl font-semibold tracking-tight">Withdrawal Console</h1>
          <p className="text-sm text-zinc-500">
            Review requests and mark payouts as approved or paid after transfer.
          </p>
        </header>

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

        {!tableReady ? (
          <p className="rounded-lg border border-amber-500/40 bg-amber-500/10 px-3 py-2 text-sm text-amber-200">
            Airtable `Withdrawals` table is not configured yet.
          </p>
        ) : (
          <>
            <section className="grid gap-3 md:grid-cols-3">
              <div className="rounded-xl border border-zinc-800 bg-zinc-900 px-3 py-2">
                <p className="text-xs text-zinc-500">Requested</p>
                <p className="text-lg font-semibold">£{totals.requested.toFixed(2)}</p>
              </div>
              <div className="rounded-xl border border-zinc-800 bg-zinc-900 px-3 py-2">
                <p className="text-xs text-zinc-500">Approved</p>
                <p className="text-lg font-semibold">£{totals.approved.toFixed(2)}</p>
              </div>
              <div className="rounded-xl border border-zinc-800 bg-zinc-900 px-3 py-2">
                <p className="text-xs text-zinc-500">Paid</p>
                <p className="text-lg font-semibold">£{totals.paid.toFixed(2)}</p>
              </div>
            </section>

            <section className="space-y-2">
              {items.length === 0 ? (
                <p className="text-sm text-zinc-500">No withdrawal requests yet.</p>
              ) : (
                items.map((item) => (
                  <div
                    key={item.id}
                    className="rounded-xl border border-zinc-800 bg-zinc-900/70 p-3 text-sm"
                  >
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <p className="font-medium text-zinc-100">
                        {item.barberName} - £{item.amount.toFixed(2)}
                      </p>
                      <select
                        value={item.status}
                        onChange={(e) => updateStatus(item.id, e.target.value as StatusOption)}
                        disabled={savingId === item.id}
                        className="rounded-lg border border-zinc-700 bg-zinc-900 px-2 py-1 text-xs"
                      >
                        {STATUS_OPTIONS.map((option) => (
                          <option key={option} value={option}>
                            {option}
                          </option>
                        ))}
                      </select>
                    </div>
                    <p className="mt-1 text-xs text-zinc-500">
                      Requested:{" "}
                      {item.requestedAt ? new Date(item.requestedAt).toLocaleString() : "-"}
                    </p>
                    {item.processedAt && (
                      <p className="text-xs text-zinc-500">
                        Processed: {new Date(item.processedAt).toLocaleString()}
                      </p>
                    )}
                    {item.note && <p className="mt-1 text-xs text-zinc-400">Note: {item.note}</p>}
                  </div>
                ))
              )}
            </section>
          </>
        )}
      </div>
    </div>
  );
}
