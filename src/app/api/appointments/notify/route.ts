import { NextResponse } from "next/server";
import { appointmentsTable, barbersTable } from "@/lib/airtable";
import { createApprovalToken } from "@/lib/approvalToken";
import { sendBarberApprovalEmail } from "@/lib/email";

export async function POST(request: Request) {
  const body = await request.json();
  const { appointmentId } = body as { appointmentId: string };

  if (!appointmentId) {
    return NextResponse.json(
      { error: "Missing appointmentId" },
      { status: 400 }
    );
  }

  const appointment = await appointmentsTable.find(appointmentId);

  const location = (appointment.get("Location") as string) ?? "";
  const date = (appointment.get("Date") as string) ?? "";
  const assigned = (appointment.get("Barber Assigned") as string[] | null) || [];

  if (assigned.length === 0) {
    return NextResponse.json(
      { error: "No barber assigned to this appointment" },
      { status: 400 }
    );
  }

  const appUrl = process.env.APP_URL || "http://localhost:3000";

  // Send an email to each assigned barber
  for (const barberId of assigned) {
    const barber = await barbersTable.find(barberId);
    const email = (barber.get("Email") as string) ?? "";
    const name = (barber.get("Name") as string) ?? "Barber";

    if (!email) continue;

    const token = createApprovalToken(appointmentId, barberId);
    const approveUrl = `${appUrl}/api/appointments/email-respond?token=${token}&action=approve`;
    const declineUrl = `${appUrl}/api/appointments/email-respond?token=${token}&action=decline`;

    await sendBarberApprovalEmail({
      to: email,
      barberName: name,
      location,
      date,
      approveUrl,
      declineUrl,
    });
  }

  return NextResponse.json({ ok: true });
}

