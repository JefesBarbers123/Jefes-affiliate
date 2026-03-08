"use client";

import { useEffect, useMemo, useState } from "react";
import { PlusCircle, Save } from "lucide-react";

type Barber = {
  id: string;
  name: string;
  email: string;
  phone: string;
  barberCustomId: string;
  bankDetails: string;
  referralCode: string;
  contractStatus: boolean;
};

type Appointment = {
  id: string;
  location: string;
  date: string;
  dayRate: number;
  barberAssigned: string[];
  status: "Pending" | "Approved" | "Completed" | "Cancelled";
  invoiceStatus: "Sent" | "Paid" | "";
};

export default function AdminManagePage() {
  const [barbers, setBarbers] = useState<Barber[]>([]);
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const [barberMode, setBarberMode] = useState<"new" | "edit">("new");
  const [selectedBarberId, setSelectedBarberId] = useState("");
  const [barberName, setBarberName] = useState("");
  const [barberEmail, setBarberEmail] = useState("");
  const [barberPhone, setBarberPhone] = useState("");
  const [barberCustomId, setBarberCustomId] = useState("");
  const [barberBank, setBarberBank] = useState("");
  const [barberContract, setBarberContract] = useState(false);

  const [apptMode, setApptMode] = useState<"new" | "edit">("new");
  const [selectedAppointmentId, setSelectedAppointmentId] = useState("");
  const [location, setLocation] = useState("");
  const [date, setDate] = useState("");
  const [dayRate, setDayRate] = useState(0);
  const [assignedBarberId, setAssignedBarberId] = useState("");
  const [status, setStatus] = useState<"Pending" | "Approved" | "Completed" | "Cancelled">(
    "Pending"
  );
  const [invoiceStatus, setInvoiceStatus] = useState<"Sent" | "Paid" | "">("");

  async function load() {
    const [bRes, aRes] = await Promise.all([
      fetch("/api/admin/barbers"),
      fetch("/api/admin/appointments"),
    ]);
    const bData = await bRes.json();
    const aData = await aRes.json();
    setBarbers(bData.items || []);
    setAppointments(aData.items || []);
  }

  useEffect(() => {
    load().catch(() => setError("Could not load admin data."));
  }, []);

  const selectedBarber = useMemo(
    () => barbers.find((b) => b.id === selectedBarberId),
    [barbers, selectedBarberId]
  );

  useEffect(() => {
    if (barberMode === "edit" && selectedBarber) {
      setBarberName(selectedBarber.name);
      setBarberEmail(selectedBarber.email);
      setBarberPhone(selectedBarber.phone || "");
      setBarberCustomId(selectedBarber.barberCustomId || "");
      setBarberBank(selectedBarber.bankDetails || "");
      setBarberContract(!!selectedBarber.contractStatus);
    }
  }, [barberMode, selectedBarber]);

  const selectedAppointment = useMemo(
    () => appointments.find((a) => a.id === selectedAppointmentId),
    [appointments, selectedAppointmentId]
  );

  useEffect(() => {
    if (apptMode === "edit" && selectedAppointment) {
      setLocation(selectedAppointment.location);
      setDate(selectedAppointment.date?.slice(0, 10) || "");
      setDayRate(selectedAppointment.dayRate || 0);
      setAssignedBarberId(selectedAppointment.barberAssigned?.[0] || "");
      setStatus(selectedAppointment.status || "Pending");
      setInvoiceStatus(selectedAppointment.invoiceStatus || "");
    }
  }, [apptMode, selectedAppointment]);

  async function saveBarber(e: React.FormEvent) {
    e.preventDefault();
    setMessage(null);
    setError(null);

    try {
      if (barberMode === "new") {
        const res = await fetch("/api/admin/barbers", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            name: barberName,
            email: barberEmail,
            phone: barberPhone,
            barberCustomId,
            bankDetails: barberBank,
          }),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || "Could not create barber.");
        setMessage("Barber created.");
      } else {
        const res = await fetch(`/api/admin/barbers/${selectedBarberId}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            name: barberName,
            email: barberEmail,
            phone: barberPhone,
            barberCustomId,
            bankDetails: barberBank,
            contractStatus: barberContract,
          }),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || "Could not update barber.");
        setMessage("Barber updated.");
      }
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not save barber.");
    }
  }

  async function saveAppointment(e: React.FormEvent) {
    e.preventDefault();
    setMessage(null);
    setError(null);

    try {
      const payload = {
        location,
        date,
        dayRate: Number(dayRate),
        barberAssigned: assignedBarberId ? [assignedBarberId] : [],
        status,
        invoiceStatus,
      };

      if (apptMode === "new") {
        const res = await fetch("/api/admin/appointments", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || "Could not create appointment.");
        setMessage("Appointment created.");
      } else {
        const res = await fetch(`/api/admin/appointments/${selectedAppointmentId}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || "Could not update appointment.");
        setMessage("Appointment updated.");
      }

      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not save appointment.");
    }
  }

  return (
    <div className="min-h-screen bg-zinc-950 px-6 py-6 text-zinc-100">
      <div className="mx-auto max-w-6xl space-y-4">
        <header>
          <p className="text-xs uppercase tracking-[0.2em] text-zinc-500">Admin Dashboard</p>
          <h1 className="mt-1 text-2xl font-semibold tracking-tight">Data Management Forms</h1>
          <p className="text-sm text-zinc-500">Create and update Airtable records directly from the app.</p>
          <a
            href="/admin/withdrawals"
            className="mt-2 inline-flex rounded-xl border border-emerald-300/40 bg-zinc-900 px-3 py-1.5 text-xs text-emerald-100 hover:bg-zinc-800"
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

        <section className="grid gap-4 md:grid-cols-2">
          <form
            onSubmit={saveBarber}
            className="rounded-2xl border border-zinc-800 bg-zinc-900/70 p-4 shadow-lg shadow-black/40"
          >
            <div className="mb-3 flex items-center justify-between">
              <h2 className="text-lg font-medium">Barber Form</h2>
              <select
                value={barberMode}
                onChange={(e) => setBarberMode(e.target.value as "new" | "edit")}
                className="rounded-lg border border-zinc-700 bg-zinc-900 px-2 py-1 text-xs"
              >
                <option value="new">New barber</option>
                <option value="edit">Edit barber</option>
              </select>
            </div>

            {barberMode === "edit" && (
              <select
                value={selectedBarberId}
                onChange={(e) => setSelectedBarberId(e.target.value)}
                className="mb-3 w-full rounded-xl border border-zinc-700 bg-zinc-900 px-3 py-2 text-sm"
                required
              >
                <option value="">Select barber</option>
                {barbers.map((b) => (
                  <option key={b.id} value={b.id}>
                    {b.name} ({b.email})
                  </option>
                ))}
              </select>
            )}

            <div className="space-y-3">
              <input
                placeholder="Name"
                value={barberName}
                onChange={(e) => setBarberName(e.target.value)}
                className="w-full rounded-xl border border-zinc-700 bg-zinc-900 px-3 py-2 text-sm"
                required
              />
              <input
                placeholder="Email"
                type="email"
                value={barberEmail}
                onChange={(e) => setBarberEmail(e.target.value)}
                className="w-full rounded-xl border border-zinc-700 bg-zinc-900 px-3 py-2 text-sm"
                required
              />
              <input
                placeholder="Phone"
                value={barberPhone}
                onChange={(e) => setBarberPhone(e.target.value)}
                className="w-full rounded-xl border border-zinc-700 bg-zinc-900 px-3 py-2 text-sm"
              />
              <input
                placeholder="Barber ID (e.g. BRB-001)"
                value={barberCustomId}
                onChange={(e) => setBarberCustomId(e.target.value)}
                className="w-full rounded-xl border border-zinc-700 bg-zinc-900 px-3 py-2 text-sm"
              />
              <textarea
                placeholder="Bank details"
                value={barberBank}
                onChange={(e) => setBarberBank(e.target.value)}
                rows={2}
                className="w-full rounded-xl border border-zinc-700 bg-zinc-900 px-3 py-2 text-sm"
              />
              {barberMode === "edit" && (
                <label className="flex items-center gap-2 text-sm text-zinc-300">
                  <input
                    type="checkbox"
                    checked={barberContract}
                    onChange={(e) => setBarberContract(e.target.checked)}
                  />
                  Contract signed
                </label>
              )}
            </div>

            <button className="mt-3 inline-flex items-center gap-2 rounded-xl bg-zinc-50 px-4 py-2 text-sm font-medium text-zinc-950">
              {barberMode === "new" ? <PlusCircle className="h-4 w-4" /> : <Save className="h-4 w-4" />}
              {barberMode === "new" ? "Create barber" : "Save barber"}
            </button>
          </form>

          <form
            onSubmit={saveAppointment}
            className="rounded-2xl border border-zinc-800 bg-zinc-900/70 p-4 shadow-lg shadow-black/40"
          >
            <div className="mb-3 flex items-center justify-between">
              <h2 className="text-lg font-medium">Appointment Form</h2>
              <select
                value={apptMode}
                onChange={(e) => setApptMode(e.target.value as "new" | "edit")}
                className="rounded-lg border border-zinc-700 bg-zinc-900 px-2 py-1 text-xs"
              >
                <option value="new">New appointment</option>
                <option value="edit">Edit appointment</option>
              </select>
            </div>

            {apptMode === "edit" && (
              <select
                value={selectedAppointmentId}
                onChange={(e) => setSelectedAppointmentId(e.target.value)}
                className="mb-3 w-full rounded-xl border border-zinc-700 bg-zinc-900 px-3 py-2 text-sm"
                required
              >
                <option value="">Select appointment</option>
                {appointments.map((a) => (
                  <option key={a.id} value={a.id}>
                    {a.location} · {a.date?.slice(0, 10)}
                  </option>
                ))}
              </select>
            )}

            <div className="space-y-3">
              <input
                placeholder="Location"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                className="w-full rounded-xl border border-zinc-700 bg-zinc-900 px-3 py-2 text-sm"
                required
              />
              <input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full rounded-xl border border-zinc-700 bg-zinc-900 px-3 py-2 text-sm"
                required
              />
              <input
                type="number"
                step="0.01"
                value={dayRate}
                onChange={(e) => setDayRate(Number(e.target.value))}
                className="w-full rounded-xl border border-zinc-700 bg-zinc-900 px-3 py-2 text-sm"
                placeholder="Day rate"
              />
              <select
                value={assignedBarberId}
                onChange={(e) => setAssignedBarberId(e.target.value)}
                className="w-full rounded-xl border border-zinc-700 bg-zinc-900 px-3 py-2 text-sm"
              >
                <option value="">Unassigned</option>
                {barbers.map((b) => (
                  <option key={b.id} value={b.id}>
                    {b.name}
                  </option>
                ))}
              </select>
              <div className="grid grid-cols-2 gap-2">
                <select
                  value={status}
                  onChange={(e) =>
                    setStatus(e.target.value as "Pending" | "Approved" | "Completed" | "Cancelled")
                  }
                  className="rounded-xl border border-zinc-700 bg-zinc-900 px-3 py-2 text-sm"
                >
                  <option value="Pending">Pending</option>
                  <option value="Approved">Approved</option>
                  <option value="Completed">Completed</option>
                  <option value="Cancelled">Cancelled</option>
                </select>
                <select
                  value={invoiceStatus}
                  onChange={(e) => setInvoiceStatus(e.target.value as "Sent" | "Paid" | "")}
                  className="rounded-xl border border-zinc-700 bg-zinc-900 px-3 py-2 text-sm"
                >
                  <option value="">No invoice status</option>
                  <option value="Sent">Sent</option>
                  <option value="Paid">Paid</option>
                </select>
              </div>
            </div>

            <button className="mt-3 inline-flex items-center gap-2 rounded-xl bg-zinc-50 px-4 py-2 text-sm font-medium text-zinc-950">
              {apptMode === "new" ? <PlusCircle className="h-4 w-4" /> : <Save className="h-4 w-4" />}
              {apptMode === "new" ? "Create appointment" : "Save appointment"}
            </button>
          </form>
        </section>
      </div>
    </div>
  );
}

