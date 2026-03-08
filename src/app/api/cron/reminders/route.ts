import { NextResponse } from "next/server";
import { appointmentsTable, barbersTable, isAirtableConfigured } from "@/lib/airtable";
import { sendAppointmentReminderEmail } from "@/lib/email";

export async function GET() {
  if (!isAirtableConfigured || !appointmentsTable || !barbersTable) {
    return NextResponse.json(
      { ok: false, error: "Airtable not configured", remindersCount: 0 },
      { status: 503 }
    );
  }

  const now = new Date();
  const in24Hours = new Date(now.getTime() + 24 * 60 * 60 * 1000);

  const targetDate = in24Hours.toISOString().slice(0, 10);

  const appointments = await appointmentsTable
    .select({
      filterByFormula: `AND(
        {Date} = '${targetDate}',
        {Status} = 'Approved'
      )`,
    })
    .all();

  const appUrl = process.env.APP_URL || "http://localhost:3000";

  for (const appt of appointments) {
    const assigned = (appt.get("Barber Assigned") as string[] | null) || [];
    if (assigned.length === 0) continue;

    for (const barberId of assigned) {
      const barber = await barbersTable.find(barberId);
      const email = (barber.get("Email") as string) ?? "";
      const name = (barber.get("Name") as string) ?? "Barber";

      if (!email) continue;

      await sendAppointmentReminderEmail({
        to: email,
        barberName: name,
        location: (appt.get("Location") as string) ?? "",
        date: (appt.get("Date") as string) ?? "",
      });
    }
  }

  return NextResponse.json({
    ok: true,
    runAt: now.toISOString(),
    appUrl,
    remindersCount: appointments.length,
  });
}

