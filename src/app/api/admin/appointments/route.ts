import { NextResponse } from "next/server";
import { appointmentsTable, barbersTable, isAirtableConfigured } from "@/lib/airtable";
import { createApprovalToken } from "@/lib/approvalToken";
import { sendBarberApprovalEmail } from "@/lib/email";

async function sendWorkAssignedEmails(params: {
  appointmentId: string;
  location: string;
  date: string;
  barberAssigned: string[];
}) {
  if (!barbersTable) return;
  const appUrl = process.env.APP_URL || "http://localhost:3000";
  const { appointmentId, location, date, barberAssigned } = params;

  for (const barberId of barberAssigned) {
    try {
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
    } catch (err) {
      console.error("Assignment email failed:", err);
    }
  }
}

export async function GET() {
  if (!isAirtableConfigured || !appointmentsTable) {
    return NextResponse.json({ items: [] });
  }

  const records = await appointmentsTable.select({ maxRecords: 500 }).all();
  return NextResponse.json({
    items: records.map((record) => ({
      id: record.id,
      location: (record.get("Location") as string) ?? "",
      date: (record.get("Date") as string) ?? "",
      dayRate: (record.get("Day Rate") as number) ?? 0,
      barberAssigned: (record.get("Barber Assigned") as string[]) ?? [],
      status: (record.get("Status") as string) ?? "Pending",
      invoiceStatus: (record.get("Invoice Status") as string) ?? "",
    })),
  });
}

export async function POST(request: Request) {
  if (!isAirtableConfigured || !appointmentsTable) {
    return NextResponse.json(
      { error: "Airtable appointments table is not configured." },
      { status: 503 }
    );
  }

  const body = await request.json();
  const {
    location,
    date,
    dayRate,
    barberAssigned,
    status,
    invoiceStatus,
  } = body as {
    location: string;
    date: string;
    dayRate: number;
    barberAssigned?: string[];
    status?: "Pending" | "Approved" | "Completed" | "Cancelled";
    invoiceStatus?: "Sent" | "Paid" | "";
  };

  if (!location || !date) {
    return NextResponse.json(
      { error: "Location and date are required." },
      { status: 400 }
    );
  }

  const created = await appointmentsTable.create({
    Location: location.trim(),
    Date: date,
    "Day Rate": Number(dayRate || 0),
    "Barber Assigned": barberAssigned?.length ? barberAssigned : [],
    Status: status ?? "Pending",
    "Invoice Status": invoiceStatus ?? "",
  });

  if (barberAssigned?.length) {
    await sendWorkAssignedEmails({
      appointmentId: created.id,
      location: location.trim(),
      date,
      barberAssigned,
    });
  }

  return NextResponse.json({ id: created.id }, { status: 201 });
}

