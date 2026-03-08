import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { COOKIE_NAME, parseAuthToken } from "@/lib/auth";
import { getBarberById } from "@/lib/barber-store";
import { appointmentsTable } from "@/lib/airtable";
import { isLocalBarberId } from "@/lib/local-barbers";
import { calculateBarberEarnings } from "@/lib/earnings";
import {
  CalendarClock,
  DollarSign,
  Link2,
  FileSignature,
  ArrowRight,
} from "lucide-react";

async function getCurrentBarber() {
  const cookieStore = await cookies();
  const token = cookieStore.get(COOKIE_NAME)?.value;
  const barberId = parseAuthToken(token);

  if (!barberId) return null;

  try {
    const record = await getBarberById(barberId);
    if (record) return record;
  } catch {
    // fall back to a minimal local shape when Airtable read is blocked
  }

  return {
    id: barberId,
    get: (key: string) => {
      if (key === "Name") return "Barber";
      if (key === "Contract Status") return false;
      return "";
    },
  };
}

async function getUpcomingAppointments(barberId: string) {
  if (isLocalBarberId(barberId) || !appointmentsTable) {
    return [];
  }
  let records: readonly any[] = [];

  try {
    records = await appointmentsTable
      .select({
        view: "Grid view",
        filterByFormula: `AND(
          FIND('${barberId}', ARRAYJOIN({Barber Assigned})),
          OR({Status} = 'Pending', {Status} = 'Approved')
        )`,
        maxRecords: 20,
      })
      .all();
  } catch {
    return [];
  }

  return records.map((r) => ({
    id: r.id,
    location: (r.get("Location") as string) ?? "",
    date: (r.get("Date") as string) ?? "",
    dayRate: (r.get("Day Rate") as number) ?? 0,
    status: (r.get("Status") as string) ?? "Pending",
  }));
}

export default async function BarberDashboardPage() {
  const barber = await getCurrentBarber();

  if (!barber) {
    redirect("/login");
  }

  const barberId = barber.id;
  const name = (barber.get("Name") as string) ?? "Barber";
  const referralCode = (barber.get("Referral Code") as string) ?? "";
  const contractStatus = (barber.get("Contract Status") as boolean) ?? false;
  const contractSignedAt = (barber.get("Contract Signed At") as string) ?? "";
  const workImages = [
    (barber.get("Work Image 1 URL") as string) ?? "",
    (barber.get("Work Image 2 URL") as string) ?? "",
    (barber.get("Work Image 3 URL") as string) ?? "",
  ].filter(Boolean);

  let dataWarning: string | null = null;

  const [appointments, earnings] = await Promise.all([
    getUpcomingAppointments(barberId),
    calculateBarberEarnings(barberId).catch(() => {
      dataWarning =
        "Connected to Airtable, but some required fields are missing or restricted. Check Appointments (Barber Assigned, Status, Day Rate) and Barbers (Referring Barber ID).";
      return { myEarnings: 0, referralEarnings: 0, total: 0 };
    }),
  ]);

  const appUrl = process.env.APP_URL || "http://localhost:3000";
  const referralLink = referralCode
    ? `${appUrl}/signup?ref=${encodeURIComponent(referralCode)}`
    : null;

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100">
      <header className="border-b border-zinc-800 bg-linear-to-b from-black to-zinc-950/70 px-6 py-4">
        <div className="mx-auto flex max-w-5xl items-center justify-between">
          <div className="space-y-1">
            <p className="text-xs uppercase tracking-[0.2em] text-zinc-500">
              Barber Console
            </p>
            <h1 className="text-xl font-semibold tracking-tight">
              Welcome back, {name}
            </h1>
          </div>
          <a
            href="/logout"
            className="text-xs text-zinc-500 hover:text-zinc-300 underline-offset-4 hover:underline"
          >
            Log out
          </a>
        </div>
      </header>

      <main className="mx-auto flex max-w-5xl flex-col gap-6 px-6 py-6">
        {dataWarning && (
          <div className="rounded-xl border border-amber-500/40 bg-amber-500/10 px-4 py-3 text-xs text-amber-200">
            {dataWarning}
          </div>
        )}
        <section className="grid gap-4 md:grid-cols-3">
          <div className="col-span-2 rounded-2xl border border-zinc-800 bg-zinc-900/70 p-4 shadow-lg shadow-black/40">
            <div className="flex items-center justify-between gap-4">
              <div className="space-y-1">
                <p className="text-xs uppercase tracking-[0.2em] text-zinc-500">
                  Upcoming Tasks
                </p>
                <h2 className="text-base font-medium text-zinc-50">
                  Your next appointments
                </h2>
              </div>
              <CalendarClock className="h-5 w-5 text-zinc-500" />
            </div>
            <div className="mt-4 space-y-3">
              {appointments.length === 0 ? (
                <p className="text-sm text-zinc-500">
                  No upcoming tasks assigned yet.
                </p>
              ) : (
                appointments.map((appt) => (
                  <div
                    key={appt.id}
                    className="flex items-center justify-between rounded-xl border border-zinc-800 bg-zinc-900 px-3 py-2.5 text-sm"
                  >
                    <div>
                      <p className="font-medium text-zinc-100">
                        {appt.location}
                      </p>
                      <p className="text-xs text-zinc-500">{appt.date}</p>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="rounded-full bg-zinc-800/70 px-3 py-1 text-xs text-zinc-300">
                        £{appt.dayRate.toFixed(2)}
                      </span>
                      <span
                        className={`rounded-full px-3 py-1 text-xs ${
                          appt.status === "Approved"
                            ? "bg-emerald-500/10 text-emerald-300 border border-emerald-500/40"
                            : "bg-amber-500/10 text-amber-300 border border-amber-500/40"
                        }`}
                      >
                        {appt.status}
                      </span>
                    </div>
                  </div>
                ))
              )}
            </div>
            <p className="mt-3 text-xs text-zinc-500">
              Approve or decline tasks from the email link, or via your booking
              manager.
            </p>
          </div>

          <div className="space-y-4">
            <div className="rounded-2xl border border-zinc-800 bg-zinc-900/70 p-4 shadow-lg shadow-black/40">
              <div className="flex items-center justify-between gap-2">
                <div>
                  <p className="text-xs uppercase tracking-[0.2em] text-zinc-500">
                    Earnings
                  </p>
                  <h2 className="text-base font-medium text-zinc-50">
                    This account
                  </h2>
                </div>
                <DollarSign className="h-5 w-5 text-zinc-500" />
              </div>
              <div className="mt-3 space-y-1">
                <p className="text-2xl font-semibold">
                  £{earnings.total.toFixed(2)}
                </p>
                <p className="text-xs text-zinc-500">
                  £{earnings.myEarnings.toFixed(2)} from your work · £
                  {earnings.referralEarnings.toFixed(2)} from referrals
                </p>
              </div>
              <a
                href="/barber/earnings"
                className="mt-3 inline-flex items-center gap-1 text-xs text-zinc-300 underline-offset-4 hover:underline"
              >
                View detailed earnings
                <ArrowRight className="h-3 w-3" />
              </a>
            </div>

            <div className="rounded-2xl border border-zinc-800 bg-zinc-900/70 p-4 shadow-lg shadow-black/40">
              <p className="text-xs uppercase tracking-[0.2em] text-zinc-500">
                Your Work Gallery
              </p>
              <p className="mt-1 text-xs text-zinc-500">
                Add 3 images in Settings to showcase your work.
              </p>
              <div className="mt-3 grid grid-cols-3 gap-2">
                {[0, 1, 2].map((index) => (
                  <div
                    key={`work-${index}`}
                    className="aspect-square overflow-hidden rounded-lg border border-zinc-800 bg-zinc-950"
                  >
                    {workImages[index] ? (
                      <img
                        src={workImages[index]}
                        alt={`Work image ${index + 1}`}
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      <div className="flex h-full items-center justify-center text-[10px] text-zinc-600">
                        Image {index + 1}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>

            <div className="rounded-2xl border border-zinc-800 bg-zinc-900/70 p-4 shadow-lg shadow-black/40">
              <div className="flex items-center justify-between gap-2">
                <div>
                  <p className="text-xs uppercase tracking-[0.2em] text-zinc-500">
                    Contract
                  </p>
                  <h2 className="text-base font-medium text-zinc-50">
                    {contractStatus ? "Signed" : "Pending signature"}
                  </h2>
                </div>
                <FileSignature
                  className={`h-5 w-5 ${
                    contractStatus ? "text-emerald-400" : "text-zinc-500"
                  }`}
                />
              </div>
              <p className="mt-2 text-xs text-zinc-500">
                {contractStatus
                  ? contractSignedAt
                    ? `Signed on ${new Date(
                        contractSignedAt
                      ).toLocaleDateString()}`
                    : "Signed and on file."
                  : "Please review and sign your contract to start taking bookings."}
              </p>
              {!contractStatus && (
                <a
                  href="/barber/contract"
                  className="mt-3 inline-flex items-center justify-center rounded-xl bg-zinc-50 px-3 py-2 text-xs font-medium text-zinc-950 shadow-md shadow-zinc-950/30 hover:bg-zinc-200"
                >
                  Open contract to sign
                </a>
              )}
            </div>

            {referralLink && (
              <div className="rounded-2xl border border-zinc-800 bg-zinc-900/70 p-4 shadow-lg shadow-black/40">
                <div className="flex items-center justify-between gap-2">
                  <div>
                    <p className="text-xs uppercase tracking-[0.2em] text-zinc-500">
                      Referral Program
                    </p>
                    <h2 className="text-base font-medium text-zinc-50">
                      10% downline earnings
                    </h2>
                  </div>
                  <Link2 className="h-5 w-5 text-zinc-500" />
                </div>
                <p className="mt-2 text-xs text-zinc-500">
                  Share your link. When other barbers earn, you receive 10% of
                  their cut.
                </p>
                <div className="mt-3 rounded-lg border border-zinc-800 bg-zinc-900 px-3 py-2 text-[11px] text-zinc-300 break-all">
                  {referralLink}
                </div>
              </div>
            )}

            <div className="rounded-2xl border border-zinc-800 bg-zinc-900/70 p-4 shadow-lg shadow-black/40">
              <p className="text-xs uppercase tracking-[0.2em] text-zinc-500">
                Data Forms
              </p>
              <div className="mt-2 flex gap-2">
                <a
                  href="/barber/settings"
                  className="rounded-xl border border-zinc-700 bg-zinc-900 px-3 py-1.5 text-xs text-zinc-200 hover:bg-zinc-800"
                >
                  Settings
                </a>
                <a
                  href="/barber/availability"
                  className="rounded-xl border border-zinc-700 bg-zinc-900 px-3 py-1.5 text-xs text-zinc-200 hover:bg-zinc-800"
                >
                  Update availability
                </a>
              </div>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}

