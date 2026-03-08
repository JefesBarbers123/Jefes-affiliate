import { getBarberById } from "@/lib/barber-store";

type Props = {
  params: Promise<{ barberId: string }>;
};

export default async function ContractViewPage({ params }: Props) {
  const { barberId } = await params;
  const barber = await getBarberById(barberId);
  if (!barber) {
    return (
      <div className="min-h-screen bg-zinc-950 px-4 py-8 text-zinc-100">
        <p>Barber not found.</p>
      </div>
    );
  }

  const name = (barber.get("Name") as string) ?? "Barber";
  const signedAt = (barber.get("Contract Signed At") as string) ?? "";
  const signatureData = (barber.get("Contract Signature Data") as string) ?? "";

  return (
    <div className="min-h-screen bg-zinc-950 px-4 py-8 text-zinc-100">
      <div className="mx-auto max-w-3xl rounded-2xl border border-zinc-800 bg-zinc-900/80 p-8 shadow-lg shadow-black/40">
        <header className="mb-6">
          <p className="text-xs uppercase tracking-[0.2em] text-zinc-500">
            Signed Agreement
          </p>
          <h1 className="mt-1 text-xl font-semibold tracking-tight">
            Independent Barber Agreement
          </h1>
          <p className="mt-1 text-xs text-zinc-400">
            Barber: <span className="text-zinc-100">{name}</span>
          </p>
          {signedAt && (
            <p className="text-xs text-zinc-400">
              Signed on:{" "}
              <span className="text-zinc-100">
                {new Date(signedAt).toLocaleString()}
              </span>
            </p>
          )}
        </header>

        <section className="space-y-3 text-xs leading-relaxed text-zinc-300">
          <p>
            This agreement confirms that the above barber has accepted the terms
            of engagement for providing barbering services on a freelance basis
            across the company&apos;s locations and partner venues.
          </p>
          <p>
            The barber acknowledges responsibility for maintaining appropriate
            insurance, equipment, and compliance with local regulations and
            hygiene standards. The company provides access to bookings, day
            rates, and payment processing.
          </p>
          <p>
            This page serves as a formatted digital record of the agreement,
            including the timestamp and captured signature below.
          </p>
        </section>

        {signatureData && (
          <section className="mt-6">
            <p className="mb-2 text-xs font-medium text-zinc-200">
              Captured signature
            </p>
            <div className="flex h-32 items-center justify-center rounded-xl border border-zinc-800 bg-zinc-900">
              <img
                src={signatureData}
                alt="Barber signature"
                className="max-h-28"
              />
            </div>
          </section>
        )}
      </div>
    </div>
  );
}

