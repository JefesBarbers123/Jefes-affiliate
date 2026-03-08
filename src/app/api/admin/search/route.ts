import { NextResponse } from "next/server";
import {
  appointmentsTable,
  availabilityTable,
  barbersTable,
  isAirtableConfigured,
} from "@/lib/airtable";
import { readBarbers } from "@/lib/local-barbers";

const WEEKDAY_NAMES = [
  "Sunday",
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
];

function normalize(s: string) {
  return s.trim().toLowerCase();
}

function dayNameFromDate(dateStr: string) {
  const d = new Date(dateStr);
  if (Number.isNaN(d.getTime())) return "";
  return WEEKDAY_NAMES[d.getDay()];
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const q = normalize(searchParams.get("q") || "");
  const locationFilter = normalize(searchParams.get("location") || "");
  const dateFilter = searchParams.get("date") || "";
  const dayFilter = normalize(searchParams.get("day") || "");

  // Local fallback
  if (!isAirtableConfigured || !barbersTable) {
    const local = await readBarbers();
    const items = local
      .map((b) => ({
        id: b.id,
        name: b.Name,
        email: b.Email,
        phone: b.Phone ?? "",
        barberCustomId: b["Barber ID"] ?? "",
        bankDetails: b["Bank Details"] ?? "",
        contractStatus: b["Contract Status"] ?? false,
        locationsWorked: [] as string[],
        nextAvailableDate: "",
      }))
      .filter((b) => {
        if (!q) return true;
        return (
          normalize(b.name).includes(q) ||
          normalize(b.email).includes(q) ||
          normalize(b.phone).includes(q) ||
          normalize(b.barberCustomId).includes(q)
        );
      });

    return NextResponse.json({
      items,
      openSlots: [],
      info: "Using local fallback data. Connect Airtable tables for full search.",
    });
  }

  try {
    const [barberRecords, appointmentRecords, availabilityRecords] =
      await Promise.all([
        barbersTable.select({ maxRecords: 500 }).all(),
        appointmentsTable
          ? appointmentsTable.select({ maxRecords: 1000 }).all()
          : Promise.resolve([]),
        availabilityTable
          ? availabilityTable.select({ maxRecords: 2000 }).all()
          : Promise.resolve([]),
      ]);

    const assignedOnDate = new Set<string>();
    const openSlots: Array<{
      id: string;
      location: string;
      date: string;
      dayRate: number;
      status: string;
    }> = [];

    appointmentRecords.forEach((r) => {
      const date = (r.get("Date") as string) ?? "";
      const location = ((r.get("Location") as string) ?? "").trim();
      const assigned = ((r.get("Barber Assigned") as string[]) ?? []).filter(Boolean);
      const status = (r.get("Status") as string) ?? "Pending";
      const invoiceStatus = (r.get("Invoice Status") as string) ?? "";
      const dayRate = (r.get("Day Rate") as number) ?? 0;

      if (dateFilter && date === dateFilter) {
        assigned.forEach((id) => assignedOnDate.add(id));
      }

      const matchesLocation = !locationFilter || normalize(location) === locationFilter;
      const matchesDate = !dateFilter || date === dateFilter;
      const matchesDay = !dayFilter || normalize(dayNameFromDate(date)) === dayFilter;

      if (
        assigned.length === 0 &&
        status === "Pending" &&
        matchesLocation &&
        matchesDate &&
        matchesDay
      ) {
        openSlots.push({
          id: r.id,
          location,
          date,
          dayRate,
          status: `${status}${invoiceStatus ? ` / ${invoiceStatus}` : ""}`,
        });
      }
    });

    const availableByBarber = new Map<string, string[]>();
    availabilityRecords.forEach((r) => {
      const ids = ((r.get("Barber ID") as string[]) ?? []).filter(Boolean);
      const date = (r.get("Date") as string) ?? "";
      const status = (r.get("Status") as string) ?? "";
      if (status !== "Available") return;

      ids.forEach((id) => {
        if (!availableByBarber.has(id)) availableByBarber.set(id, []);
        availableByBarber.get(id)?.push(date);
      });
    });

    const locationsWorkedByBarber = new Map<string, Set<string>>();
    appointmentRecords.forEach((r) => {
      const location = ((r.get("Location") as string) ?? "").trim();
      if (!location) return;
      const assigned = ((r.get("Barber Assigned") as string[]) ?? []).filter(Boolean);
      assigned.forEach((id) => {
        if (!locationsWorkedByBarber.has(id)) locationsWorkedByBarber.set(id, new Set());
        locationsWorkedByBarber.get(id)?.add(location);
      });
    });

    const items = barberRecords
      .map((b) => {
        const id = b.id;
        const availableDates = (availableByBarber.get(id) || []).sort();
        const locationsWorked = Array.from(locationsWorkedByBarber.get(id) || []);
        const isAvailableOnDate = dateFilter
          ? availableDates.includes(dateFilter) && !assignedOnDate.has(id)
          : true;

        return {
          id,
          name: (b.get("Name") as string) ?? "",
          email: (b.get("Email") as string) ?? "",
          phone: (b.get("Phone") as string) ?? "",
          barberCustomId: (b.get("Barber ID") as string) ?? "",
          bankDetails: (b.get("Bank Details") as string) ?? "",
          contractStatus: (b.get("Contract Status") as boolean) ?? false,
          locationsWorked,
          nextAvailableDate: availableDates[0] || "",
          isAvailableOnDate,
          availableDates,
        };
      })
      .filter((b) => {
        const matchesQ =
          !q ||
          normalize(b.name).includes(q) ||
          normalize(b.email).includes(q) ||
          normalize(b.phone).includes(q) ||
          normalize(b.barberCustomId).includes(q);

        const matchesLocation =
          !locationFilter ||
          b.locationsWorked.some((loc) => normalize(loc) === locationFilter);

        const matchesDay =
          !dayFilter ||
          b.availableDates.some((d) => normalize(dayNameFromDate(d)) === dayFilter);

        const matchesDate = !dateFilter || b.isAvailableOnDate;

        return matchesQ && matchesLocation && matchesDay && matchesDate;
      })
      .sort((a, b) => a.name.localeCompare(b.name));

    return NextResponse.json({ items, openSlots });
  } catch (err) {
    console.error("Admin search error:", err);
    return NextResponse.json(
      {
        error:
          "Could not load search data. Check Airtable table access and required fields.",
      },
      { status: 500 }
    );
  }
}

