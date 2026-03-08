import { appointmentsTable, barbersTable, isAirtableConfigured } from "@/lib/airtable";
import { readBarbers } from "@/lib/local-barbers";
import { DollarSign, FileText, Users, MapPinned, TrendingUp } from "lucide-react";

async function getAdminStats() {
  let totalTurnover = 0;
  let pendingInvoiceTotal = 0;
  let paidInvoiceTotal = 0;
  let pendingInvoiceCount = 0;
  let paidInvoiceCount = 0;
  let activeContractsCount = 0;
  let barbersByLocation: Array<{ location: string; count: number }> = [];
  let areaDemand: Array<{
    location: string;
    pending: number;
    approved: number;
    completed30d: number;
    demandScore: number;
  }> = [];

  if (isAirtableConfigured && appointmentsTable && barbersTable) {
    const completedAppointments = await appointmentsTable
      .select({
        filterByFormula: "{Status} = 'Completed'",
      })
      .all();

    completedAppointments.forEach((record) => {
      const rate = (record.get("Day Rate") as number) ?? 0;
      const invoiceStatus = (record.get("Invoice Status") as string) ?? "";
      totalTurnover += rate;

      if (invoiceStatus === "Sent") {
        pendingInvoiceTotal += rate;
        pendingInvoiceCount += 1;
      }
      if (invoiceStatus === "Paid") {
        paidInvoiceTotal += rate;
        paidInvoiceCount += 1;
      }
    });

    const activeContracts = await barbersTable
      .select({
        filterByFormula: "{Contract Status} = 1",
      })
      .all();
    activeContractsCount = activeContracts.length;

    const allAppointments = await appointmentsTable
      .select({
        view: "Grid view",
      })
      .all();

    const now = new Date();
    const past30 = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

    const locationBarberSet = new Map<string, Set<string>>();
    const demandMap = new Map<
      string,
      { pending: number; approved: number; completed30d: number }
    >();

    allAppointments.forEach((record) => {
      const location = ((record.get("Location") as string) ?? "Unknown").trim() || "Unknown";
      const status = (record.get("Status") as string) ?? "";
      const assigned = ((record.get("Barber Assigned") as string[]) ?? []).filter(Boolean);
      const dateRaw = (record.get("Date") as string) ?? "";
      const date = dateRaw ? new Date(dateRaw) : null;

      if (!locationBarberSet.has(location)) {
        locationBarberSet.set(location, new Set<string>());
      }
      assigned.forEach((barberId) => locationBarberSet.get(location)?.add(barberId));

      if (!demandMap.has(location)) {
        demandMap.set(location, { pending: 0, approved: 0, completed30d: 0 });
      }
      const counters = demandMap.get(location)!;
      if (status === "Pending") counters.pending += 1;
      if (status === "Approved") counters.approved += 1;
      if (status === "Completed" && date && date >= past30) counters.completed30d += 1;
    });

    barbersByLocation = Array.from(locationBarberSet.entries())
      .map(([location, ids]) => ({ location, count: ids.size }))
      .sort((a, b) => b.count - a.count || a.location.localeCompare(b.location));

    areaDemand = Array.from(demandMap.entries())
      .map(([location, counters]) => ({
        location,
        ...counters,
        demandScore: counters.pending * 2 + counters.approved + counters.completed30d,
      }))
      .sort((a, b) => b.demandScore - a.demandScore || a.location.localeCompare(b.location));
  } else {
    const localBarbers = await readBarbers();
    activeContractsCount = localBarbers.filter((b) => b["Contract Status"]).length;
  }

  return {
    totalTurnover,
    pendingInvoiceTotal,
    paidInvoiceTotal,
    pendingInvoiceCount,
    paidInvoiceCount,
    activeContractsCount,
    barbersByLocation,
    areaDemand,
  };
}

export default async function AdminDashboardPage() {
  const stats = await getAdminStats();

  return (
    <div className="min-h-screen bg-zinc-950 px-6 py-6 text-zinc-100">
      <header className="mx-auto mb-6 max-w-5xl border-b border-zinc-800 pb-4">
        <p className="text-xs uppercase tracking-[0.2em] text-zinc-500">
          Admin Dashboard
        </p>
        <h1 className="mt-1 text-2xl font-semibold tracking-tight">
          Network Performance Overview
        </h1>
        <a
          href="/admin/manage"
          className="mt-2 inline-flex rounded-xl border border-zinc-700 bg-zinc-900 px-3 py-1.5 text-xs text-zinc-200 hover:bg-zinc-800"
        >
          Open data forms
        </a>
        <a
          href="/admin/search"
          className="mt-2 ml-2 inline-flex rounded-xl border border-yellow-300/50 bg-zinc-900 px-3 py-1.5 text-xs text-yellow-100 hover:bg-zinc-800"
        >
          Open barber search console
        </a>
        <a
          href="/admin/withdrawals"
          className="mt-2 ml-2 inline-flex rounded-xl border border-emerald-300/40 bg-zinc-900 px-3 py-1.5 text-xs text-emerald-100 hover:bg-zinc-800"
        >
          Open withdrawals console
        </a>
        <a
          href="/admin/email-logs"
          className="mt-2 ml-2 inline-flex rounded-xl border border-sky-300/40 bg-zinc-900 px-3 py-1.5 text-xs text-sky-100 hover:bg-zinc-800"
        >
          Open email logs
        </a>
      </header>

      <main className="mx-auto max-w-5xl space-y-6">
        <section className="grid gap-4 md:grid-cols-3">
          <div className="rounded-2xl border border-zinc-800 bg-zinc-900/70 p-4 shadow-lg shadow-black/40">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs uppercase tracking-[0.2em] text-zinc-500">
                  Total Turnover
                </p>
                <p className="mt-2 text-2xl font-semibold">
                  £{stats.totalTurnover.toFixed(2)}
                </p>
              </div>
              <DollarSign className="h-6 w-6 text-zinc-500" />
            </div>
          </div>

          <div className="rounded-2xl border border-zinc-800 bg-zinc-900/70 p-4 shadow-lg shadow-black/40">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs uppercase tracking-[0.2em] text-zinc-500">
                  Pending Invoices
                </p>
                <p className="mt-2 text-xl font-semibold">
                  £{stats.pendingInvoiceTotal.toFixed(2)}
                </p>
                <p className="text-xs text-zinc-500">
                  {stats.pendingInvoiceCount} outstanding
                </p>
              </div>
              <FileText className="h-6 w-6 text-amber-400" />
            </div>
          </div>

          <div className="rounded-2xl border border-zinc-800 bg-zinc-900/70 p-4 shadow-lg shadow-black/40">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs uppercase tracking-[0.2em] text-zinc-500">
                  Paid Invoices
                </p>
                <p className="mt-2 text-xl font-semibold">
                  £{stats.paidInvoiceTotal.toFixed(2)}
                </p>
                <p className="text-xs text-zinc-500">
                  {stats.paidInvoiceCount} settled
                </p>
              </div>
              <FileText className="h-6 w-6 text-emerald-400" />
            </div>
          </div>
        </section>

        <section className="grid gap-4 md:grid-cols-2">
          <div className="rounded-2xl border border-zinc-800 bg-zinc-900/70 p-4 shadow-lg shadow-black/40">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs uppercase tracking-[0.2em] text-zinc-500">
                  Active Contracts
                </p>
                <p className="mt-2 text-2xl font-semibold">
                  {stats.activeContractsCount}
                </p>
                <p className="text-xs text-zinc-500">
                  Barbers with signed agreements on file.
                </p>
              </div>
              <Users className="h-6 w-6 text-zinc-500" />
            </div>
          </div>
        </section>

        <section className="grid gap-4 md:grid-cols-2">
          <div className="rounded-2xl border border-zinc-800 bg-zinc-900/70 p-4 shadow-lg shadow-black/40">
            <div className="mb-3 flex items-center justify-between">
              <div>
                <p className="text-xs uppercase tracking-[0.2em] text-zinc-500">
                  Barbers by Location
                </p>
                <h2 className="text-base font-medium text-zinc-50">
                  Active roster spread
                </h2>
              </div>
              <MapPinned className="h-5 w-5 text-zinc-500" />
            </div>

            {stats.barbersByLocation.length === 0 ? (
              <p className="text-sm text-zinc-500">
                No location assignment data yet. Create appointments with location + barber assignment.
              </p>
            ) : (
              <div className="space-y-2">
                {stats.barbersByLocation.slice(0, 8).map((row) => (
                  <div
                    key={row.location}
                    className="flex items-center justify-between rounded-xl border border-zinc-800 bg-zinc-900 px-3 py-2"
                  >
                    <p className="text-sm text-zinc-200">{row.location}</p>
                    <span className="rounded-full bg-zinc-800 px-2.5 py-1 text-xs text-zinc-300">
                      {row.count} barber{row.count === 1 ? "" : "s"}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="rounded-2xl border border-zinc-800 bg-zinc-900/70 p-4 shadow-lg shadow-black/40">
            <div className="mb-3 flex items-center justify-between">
              <div>
                <p className="text-xs uppercase tracking-[0.2em] text-zinc-500">
                  Area Demand
                </p>
                <h2 className="text-base font-medium text-zinc-50">
                  Pending pressure by area
                </h2>
              </div>
              <TrendingUp className="h-5 w-5 text-zinc-500" />
            </div>

            {stats.areaDemand.length === 0 ? (
              <p className="text-sm text-zinc-500">
                No demand data yet. Add appointments to see where demand is building.
              </p>
            ) : (
              <div className="space-y-2">
                {stats.areaDemand.slice(0, 8).map((row) => (
                  <div
                    key={row.location}
                    className="rounded-xl border border-zinc-800 bg-zinc-900 px-3 py-2"
                  >
                    <div className="mb-1 flex items-center justify-between">
                      <p className="text-sm text-zinc-200">{row.location}</p>
                      <span className="text-xs text-zinc-400">
                        Score {row.demandScore}
                      </span>
                    </div>
                    <p className="text-xs text-zinc-500">
                      Pending: {row.pending} · Approved: {row.approved} · Completed (30d):{" "}
                      {row.completed30d}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </section>
      </main>
    </div>
  );
}

