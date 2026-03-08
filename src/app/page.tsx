export default function Home() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-zinc-950 px-4 py-8 text-zinc-100 sm:px-6">
      <div className="w-full max-w-4xl rounded-3xl border border-yellow-300/30 bg-linear-to-br from-black via-zinc-950 to-zinc-900 px-6 py-8 shadow-xl shadow-black/60 sm:px-8 sm:py-10">
        <div className="space-y-4">
          <p className="text-xs uppercase tracking-[0.3em] text-yellow-300/80">
            UK-wide additional barber work
          </p>
          <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">
            Jefes Affiliates
          </h1>
          <p className="max-w-xl text-sm text-zinc-400">
            Apply for additional barber work across the UK. We provide flexible
            filler shifts that help barbers increase earnings between regular
            bookings, with a simple dashboard for jobs, contracts, and payments.
          </p>
        </div>

        <div className="mt-8 flex flex-col gap-3 sm:flex-row">
          <a
            href="/login"
            className="flex flex-1 items-center justify-center rounded-2xl bg-yellow-300 px-4 py-3 text-sm font-semibold text-zinc-950 shadow-md shadow-zinc-950/40 hover:bg-yellow-200"
          >
            Barber Login
          </a>
          <a
            href="/admin"
            className="flex flex-1 items-center justify-center rounded-2xl border border-yellow-300/40 bg-zinc-900 px-4 py-3 text-sm font-medium text-yellow-100 hover:bg-zinc-800"
          >
            Admin Dashboard
          </a>
        </div>

        <section className="mt-8 rounded-2xl border border-zinc-800 bg-zinc-900/70 p-4">
          <h2 className="text-sm font-semibold tracking-tight text-zinc-100">
            Why Join Jefes Affiliates?
          </h2>
          <div className="mt-3 grid gap-2 text-sm text-zinc-300 sm:grid-cols-3">
            <div className="rounded-xl border border-zinc-800 bg-zinc-900 px-3 py-2">
              UK-wide filler shifts to top up your weekly barber income.
            </div>
            <div className="rounded-xl border border-zinc-800 bg-zinc-900 px-3 py-2">
              Simple dashboard for bookings, contracts, earnings, and withdrawals.
            </div>
            <div className="rounded-xl border border-zinc-800 bg-zinc-900 px-3 py-2">
              Referral bonus: an extra 10% paid by us, not taken from another barber.
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
