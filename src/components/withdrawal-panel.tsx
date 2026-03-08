"use client";

import { useEffect, useState } from "react";

type WithdrawalItem = {
  id: string;
  amount: number;
  status: string;
  requestedAt: string;
  processedAt: string;
  note: string;
};

type Props = {
  initialWithdrawable: number;
};

export function WithdrawalPanel({ initialWithdrawable }: Props) {
  const [amount, setAmount] = useState("");
  const [note, setNote] = useState("");
  const [items, setItems] = useState<WithdrawalItem[]>([]);
  const [pendingTotal, setPendingTotal] = useState(0);
  const [availableToRequest, setAvailableToRequest] = useState(initialWithdrawable);
  const [tableReady, setTableReady] = useState(true);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function load() {
    const res = await fetch("/api/barber/withdrawals");
    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.error || "Could not load withdrawals.");
    }
    setItems(data.items || []);
    setPendingTotal(Number(data.pendingTotal || 0));
    setAvailableToRequest(Number(data.availableToRequest || 0));
    setTableReady(Boolean(data.tableReady));
  }

  useEffect(() => {
    load().catch((err) => {
      setError(err instanceof Error ? err.message : "Could not load withdrawals.");
    });
  }, []);

  async function requestWithdrawal(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setMessage(null);
    try {
      const res = await fetch("/api/barber/withdrawals", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          amount: Number(amount),
          note,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Could not create withdrawal request.");
      }
      setMessage("Withdrawal request sent to admin.");
      setAmount("");
      setNote("");
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not create withdrawal request.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <section className="rounded-2xl border border-zinc-800 bg-zinc-900/70 p-4 shadow-lg shadow-black/40">
      <h2 className="text-base font-medium text-zinc-50">Withdrawal requests</h2>
      <p className="mt-1 text-xs text-zinc-500">
        Submit a payout request. Admin can approve and mark it as paid once transfer is done.
      </p>

      {!tableReady ? (
        <p className="mt-3 rounded-lg border border-amber-500/40 bg-amber-500/10 px-3 py-2 text-xs text-amber-200">
          Withdrawals table is not ready yet. Ask admin to create Airtable table `Withdrawals`.
        </p>
      ) : (
        <>
          <div className="mt-3 grid gap-2 md:grid-cols-2">
            <div className="rounded-lg border border-zinc-800 bg-zinc-900 px-3 py-2">
              <p className="text-xs text-zinc-500">Pending requests</p>
              <p className="text-sm font-medium text-zinc-100">£{pendingTotal.toFixed(2)}</p>
            </div>
            <div className="rounded-lg border border-zinc-800 bg-zinc-900 px-3 py-2">
              <p className="text-xs text-zinc-500">Available to request now</p>
              <p className="text-sm font-medium text-emerald-300">
                £{availableToRequest.toFixed(2)}
              </p>
            </div>
          </div>

          <form onSubmit={requestWithdrawal} className="mt-3 space-y-2">
            <input
              type="number"
              min={0}
              step="0.01"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="Amount to withdraw"
              className="w-full rounded-xl border border-zinc-700 bg-zinc-900 px-3 py-2 text-sm"
              required
            />
            <textarea
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="Optional note (e.g. preferred payout date)"
              rows={2}
              className="w-full rounded-xl border border-zinc-700 bg-zinc-900 px-3 py-2 text-sm"
            />
            <button
              disabled={loading || availableToRequest <= 0}
              className="rounded-xl bg-zinc-50 px-4 py-2 text-sm font-medium text-zinc-950 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {loading ? "Sending..." : "Request withdrawal"}
            </button>
          </form>
        </>
      )}

      {message && (
        <p className="mt-2 rounded-lg border border-emerald-500/40 bg-emerald-500/10 px-3 py-2 text-xs text-emerald-200">
          {message}
        </p>
      )}
      {error && (
        <p className="mt-2 rounded-lg border border-red-500/40 bg-red-500/10 px-3 py-2 text-xs text-red-200">
          {error}
        </p>
      )}

      <div className="mt-4 space-y-2">
        {items.length === 0 ? (
          <p className="text-xs text-zinc-500">No withdrawal requests yet.</p>
        ) : (
          items.map((item) => (
            <div
              key={item.id}
              className="rounded-lg border border-zinc-800 bg-zinc-900 px-3 py-2 text-xs"
            >
              <div className="flex items-center justify-between">
                <span className="font-medium text-zinc-100">£{item.amount.toFixed(2)}</span>
                <span className="text-zinc-400">{item.status}</span>
              </div>
              <p className="mt-1 text-zinc-500">
                Requested: {item.requestedAt ? new Date(item.requestedAt).toLocaleString() : "-"}
              </p>
              {item.processedAt && (
                <p className="text-zinc-500">
                  Processed: {new Date(item.processedAt).toLocaleString()}
                </p>
              )}
              {item.note && <p className="mt-1 text-zinc-400">{item.note}</p>}
            </div>
          ))
        )}
      </div>
    </section>
  );
}
