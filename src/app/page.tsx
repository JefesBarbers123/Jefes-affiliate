export default function Home() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-zinc-950 text-zinc-100">
      <div className="w-full max-w-3xl rounded-3xl border border-zinc-800 bg-gradient-to-br from-black via-zinc-950 to-zinc-900 px-8 py-10 shadow-xl shadow-black/60">
        <div className="space-y-4">
          <p className="text-xs uppercase tracking-[0.3em] text-zinc-500">
            Multi-location Barber Network
          </p>
          <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">
            Barber Management Platform
          </h1>
          <p className="max-w-xl text-sm text-zinc-400">
            A central hub for managing barbers, assignments, contracts, and
            finances across your locations. Built on Airtable with a modern,
            dark-mode console for barbers and admins.
          </p>
        </div>

        <div className="mt-8 flex flex-col gap-3 sm:flex-row">
          <a
            href="/login"
            className="flex flex-1 items-center justify-center rounded-2xl bg-zinc-50 px-4 py-3 text-sm font-medium text-zinc-950 shadow-md shadow-zinc-950/40 hover:bg-zinc-200"
          >
            Barber Login
          </a>
          <a
            href="/admin"
            className="flex flex-1 items-center justify-center rounded-2xl border border-zinc-700 bg-zinc-900 px-4 py-3 text-sm font-medium text-zinc-100 hover:bg-zinc-800"
          >
            Admin Dashboard
          </a>
        </div>
      </div>
    </div>
  );
}
