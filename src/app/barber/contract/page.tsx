"use client";

import dynamic from "next/dynamic";
import { useRef, useState } from "react";
import { FileSignature } from "lucide-react";

const SignaturePad = dynamic(() => import("react-signature-pad"), {
  ssr: false,
}) as any;

export default function ContractPage() {
  const padRef = useRef<any>(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  async function handleSubmit() {
    if (!padRef.current || padRef.current.isEmpty()) {
      setError("Please add your signature before submitting.");
      return;
    }

    setSubmitting(true);
    setError(null);

    try {
      const dataUrl = padRef.current.toDataURL();

      const res = await fetch("/api/barber/contract/sign", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ signature: dataUrl }),
      });

      if (!res.ok) {
        const data = await res.json();
        setError(data.error || "Failed to save contract.");
        setSubmitting(false);
        return;
      }

      setSuccess(true);
    } catch (err) {
      console.error(err);
      setError("Unexpected error while saving contract.");
    } finally {
      setSubmitting(false);
    }
  }

  function handleClear() {
    padRef.current?.clear();
    setError(null);
    setSuccess(false);
  }

  return (
    <div className="min-h-screen bg-zinc-950 px-4 py-6 text-zinc-100">
      <div className="mx-auto max-w-3xl rounded-2xl border border-zinc-800 bg-zinc-900/70 p-6 shadow-lg shadow-black/40">
        <div className="flex items-center gap-3 mb-4">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-tr from-zinc-50 to-zinc-400 text-zinc-900">
            <FileSignature className="h-5 w-5" />
          </div>
          <div>
            <h1 className="text-xl font-semibold tracking-tight">
              Independent Barber Agreement
            </h1>
            <p className="text-xs text-zinc-500">
              Please review the terms below and sign to confirm.
            </p>
          </div>
        </div>

        <div className="mb-4 space-y-2 rounded-xl border border-zinc-800 bg-zinc-900/80 p-4 text-xs leading-relaxed text-zinc-300">
          <p>
            This agreement sets out the terms under which you provide barbering
            services on a freelance basis across the company&apos;s partner
            locations. You remain responsible for your own tax, insurance, and
            equipment.
          </p>
          <p>
            Day rates and compensation will be confirmed per appointment. You
            agree to arrive on time, meet the grooming standards of each
            location, and represent the brand professionally at all times.
          </p>
          <p>
            Cancellations should be communicated as early as possible via the
            booking team. Repeated late cancellations or no-shows may result in
            removal from the active roster.
          </p>
          <p>
            By signing below, you agree to these terms and consent to your data
            being stored for scheduling and payment purposes.
          </p>
        </div>

        <div className="space-y-2">
          <p className="text-xs font-medium text-zinc-200">
            Sign within the box below
          </p>
          <div className="overflow-hidden rounded-xl border border-zinc-800 bg-zinc-900">
            <SignaturePad
              ref={padRef}
              options={{
                penColor: "#e5e5e5",
                backgroundColor: "rgba(24,24,27,1)",
              }}
            />
          </div>
        </div>

        {error && (
          <p className="mt-3 rounded-md bg-red-500/10 border border-red-500/40 px-3 py-2 text-xs text-red-200">
            {error}
          </p>
        )}

        {success && (
          <p className="mt-3 rounded-md bg-emerald-500/10 border border-emerald-500/40 px-3 py-2 text-xs text-emerald-200">
            Contract signed and saved. You can now return to your dashboard.
          </p>
        )}

        <div className="mt-4 flex items-center justify-between gap-3">
          <button
            type="button"
            onClick={handleClear}
            className="rounded-xl border border-zinc-700 px-3 py-2 text-xs text-zinc-200 hover:bg-zinc-800/70"
          >
            Clear signature
          </button>
          <button
            type="button"
            disabled={submitting}
            onClick={handleSubmit}
            className="rounded-xl bg-zinc-50 px-4 py-2 text-xs font-medium text-zinc-950 shadow-md shadow-zinc-950/30 hover:bg-zinc-200 disabled:opacity-60 disabled:cursor-not-allowed"
          >
            {submitting ? "Saving..." : "Sign & accept terms"}
          </button>
        </div>
      </div>
    </div>
  );
}

