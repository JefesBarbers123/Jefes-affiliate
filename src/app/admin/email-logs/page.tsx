"use client";

import { useEffect, useMemo, useState } from "react";

type EmailLog = {
  id: string;
  type: string;
  to: string;
  subject: string;
  status: string;
  sentAt: string;
  resendMessageId: string;
  errorMessage: string;
  context: string;
};

export default function AdminEmailLogsPage() {
  const [items, setItems] = useState<EmailLog[]>([]);
  const [tableReady, setTableReady] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    (async () => {
      try {
        const res = await fetch("/api/admin/email-logs");
        const data = await res.json();
        if (!res.ok) {
          throw new Error(data.error || "Could not load email logs.");
        }
        if (!active) return;
        setItems(data.items || []);
        setTableReady(Boolean(data.tableReady));
      } catch (err) {
        if (!active) return;
        setError(err instanceof Error ? err.message : "Could not load email logs.");
      }
    })();
    return () => {
      active = false;
    };
  }, []);

  const summary = useMemo(() => {
    return items.reduce(
      (acc, item) => {
        if (item.status === "Sent") acc.sent += 1;
        if (item.status === "Failed") acc.failed += 1;
        return acc;
      },
      { sent: 0, failed: 0 }
    );
  }, [items]);

  return (
    <div className="min-h-screen bg-zinc-950 px-6 py-6 text-zinc-100">
      <div className="mx-auto max-w-6xl space-y-4">
        <header>
          <p className="text-xs uppercase tracking-[0.2em] text-zinc-500">Admin Dashboard</p>
          <h1 className="mt-1 text-2xl font-semibold tracking-tight">Email Logs</h1>
          <p className="text-sm text-zinc-500">
            Track each notification sent by the platform with status and context.
          </p>
        </header>

        {error && (
          <p className="rounded-lg border border-red-500/40 bg-red-500/10 px-3 py-2 text-xs text-red-200">
            {error}
          </p>
        )}

        {!tableReady ? (
          <div className="rounded-lg border border-amber-500/40 bg-amber-500/10 px-3 py-2 text-sm text-amber-200">
            Email log table is not ready. Create Airtable table <code>Email Logs</code>.
          </div>
        ) : (
          <>
            <section className="grid gap-3 md:grid-cols-3">
              <div className="rounded-xl border border-zinc-800 bg-zinc-900 px-3 py-2">
                <p className="text-xs text-zinc-500">Total logs</p>
                <p className="text-lg font-semibold">{items.length}</p>
              </div>
              <div className="rounded-xl border border-zinc-800 bg-zinc-900 px-3 py-2">
                <p className="text-xs text-zinc-500">Sent</p>
                <p className="text-lg font-semibold text-emerald-300">{summary.sent}</p>
              </div>
              <div className="rounded-xl border border-zinc-800 bg-zinc-900 px-3 py-2">
                <p className="text-xs text-zinc-500">Failed</p>
                <p className="text-lg font-semibold text-red-300">{summary.failed}</p>
              </div>
            </section>

            <section className="space-y-2">
              {items.length === 0 ? (
                <p className="text-sm text-zinc-500">No email logs yet.</p>
              ) : (
                items.map((item) => (
                  <div key={item.id} className="rounded-xl border border-zinc-800 bg-zinc-900/70 p-3">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <p className="text-sm font-medium text-zinc-100">{item.subject}</p>
                      <span
                        className={`rounded-full px-2 py-1 text-[10px] font-medium ${
                          item.status === "Sent"
                            ? "bg-emerald-500/15 text-emerald-300"
                            : "bg-red-500/15 text-red-300"
                        }`}
                      >
                        {item.status || "Unknown"}
                      </span>
                    </div>
                    <p className="mt-1 text-xs text-zinc-400">
                      Type: {item.type || "-"} · To: {item.to || "-"}
                    </p>
                    <p className="text-xs text-zinc-500">
                      Sent at: {item.sentAt ? new Date(item.sentAt).toLocaleString() : "-"}
                    </p>
                    {item.resendMessageId && (
                      <p className="text-xs text-zinc-500">Resend ID: {item.resendMessageId}</p>
                    )}
                    {item.errorMessage && (
                      <p className="mt-1 text-xs text-red-300">Error: {item.errorMessage}</p>
                    )}
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
