import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { COOKIE_NAME, parseAuthToken } from "@/lib/auth";
import { getBarberById } from "@/lib/barber-store";
import { getBarberEarningsSummary } from "@/lib/earnings";
import { Wallet, PiggyBank, CalendarClock, TrendingUp } from "lucide-react";
import { WithdrawalPanel } from "@/components/withdrawal-panel";

export default async function BarberEarningsPage() {
  const cookieStore = await cookies();
  const token = cookieStore.get(COOKIE_NAME)?.value;
  const barberId = parseAuthToken(token);

  if (!barberId) {
    redirect("/login");
  }

  const barber = await getBarberById(barberId);
  if (!barber) {
    redirect("/login");
  }

  const name = (barber.get("Name") as string) ?? "Barber";
  const summary = await getBarberEarningsSummary(barberId);

  return (
    <div className="min-h-screen bg-zinc-950 px-6 py-6 text-zinc-100">
      <div className="mx-auto max-w-5xl space-y-4">
        <header>
          <p className="text-xs uppercase tracking-[0.2em] text-zinc-500">
            Barber Console
          </p>
          <h1 className="mt-1 text-2xl font-semibold tracking-tight">
            Earnings Overview - {name}
          </h1>
          <p className="text-sm text-zinc-500">
            Whole-period earnings, current bookings value, and withdrawable balance.
          </p>
        </header>

        <section className="grid gap-4 md:grid-cols-4">
          <div className="rounded-2xl border border-zinc-800 bg-zinc-900/70 p-4 shadow-lg shadow-black/40">
            <div className="flex items-center justify-between">
              <p className="text-xs uppercase tracking-[0.2em] text-zinc-500">
                Total earned
              </p>
              <TrendingUp className="h-5 w-5 text-zinc-500" />
            </div>
            <p className="mt-2 text-2xl font-semibold">£{summary.total.toFixed(2)}</p>
            <p className="text-xs text-zinc-500">Since joining</p>
          </div>

          <div className="rounded-2xl border border-zinc-800 bg-zinc-900/70 p-4 shadow-lg shadow-black/40">
            <div className="flex items-center justify-between">
              <p className="text-xs uppercase tracking-[0.2em] text-zinc-500">
                Withdrawable
              </p>
              <Wallet className="h-5 w-5 text-zinc-500" />
            </div>
            <p className="mt-2 text-2xl font-semibold">£{summary.withdrawableBalance.toFixed(2)}</p>
            <p className="text-xs text-zinc-500">Available now</p>
          </div>

          <div className="rounded-2xl border border-zinc-800 bg-zinc-900/70 p-4 shadow-lg shadow-black/40">
            <div className="flex items-center justify-between">
              <p className="text-xs uppercase tracking-[0.2em] text-zinc-500">
                Booked value
              </p>
              <CalendarClock className="h-5 w-5 text-zinc-500" />
            </div>
            <p className="mt-2 text-2xl font-semibold">£{summary.bookedEarnings.toFixed(2)}</p>
            <p className="text-xs text-zinc-500">{summary.bookedJobs} active bookings</p>
          </div>

          <div className="rounded-2xl border border-zinc-800 bg-zinc-900/70 p-4 shadow-lg shadow-black/40">
            <div className="flex items-center justify-between">
              <p className="text-xs uppercase tracking-[0.2em] text-zinc-500">
                Already withdrawn
              </p>
              <PiggyBank className="h-5 w-5 text-zinc-500" />
            </div>
            <p className="mt-2 text-2xl font-semibold">£{summary.withdrawnTotal.toFixed(2)}</p>
            <p className="text-xs text-zinc-500">{summary.completedJobs} completed jobs</p>
          </div>
        </section>

        <section className="rounded-2xl border border-zinc-800 bg-zinc-900/70 p-4 shadow-lg shadow-black/40">
          <h2 className="text-base font-medium text-zinc-50">Earnings breakdown</h2>
          <div className="mt-3 grid gap-2 text-sm">
            <div className="flex items-center justify-between rounded-lg border border-zinc-800 bg-zinc-900 px-3 py-2">
              <span className="text-zinc-300">Direct earnings (your cuts)</span>
              <span className="font-medium text-zinc-100">£{summary.myEarnings.toFixed(2)}</span>
            </div>
            <div className="flex items-center justify-between rounded-lg border border-zinc-800 bg-zinc-900 px-3 py-2">
              <span className="text-zinc-300">Referral earnings (10% downline)</span>
              <span className="font-medium text-zinc-100">£{summary.referralEarnings.toFixed(2)}</span>
            </div>
            <div className="flex items-center justify-between rounded-lg border border-zinc-800 bg-zinc-900 px-3 py-2">
              <span className="text-zinc-300">Total earned to date</span>
              <span className="font-medium text-zinc-100">£{summary.total.toFixed(2)}</span>
            </div>
            <div className="flex items-center justify-between rounded-lg border border-zinc-800 bg-zinc-900 px-3 py-2">
              <span className="text-zinc-300">Withdrawable now</span>
              <span className="font-medium text-emerald-300">£{summary.withdrawableBalance.toFixed(2)}</span>
            </div>
          </div>
          <p className="mt-3 text-xs text-zinc-500">
            Withdrawable = Total earned - Already withdrawn. If your payout process is manual,
            ask admin to process the balance shown above.
          </p>
        </section>

        <WithdrawalPanel initialWithdrawable={summary.withdrawableBalance} />
      </div>
    </div>
  );
}

