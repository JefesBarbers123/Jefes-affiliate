import { NextResponse } from "next/server";
import { appointmentsTable, barbersTable, isAirtableConfigured } from "@/lib/airtable";
import { verifyApprovalToken } from "@/lib/approvalToken";
import { sendBookingConfirmedEmail } from "@/lib/email";

export async function GET(request: Request) {
  if (!isAirtableConfigured || !appointmentsTable || !barbersTable) {
    return new NextResponse("Airtable is not configured for appointment responses.", {
      status: 503,
    });
  }

  const url = new URL(request.url);
  const token = url.searchParams.get("token");
  const action = url.searchParams.get("action");

  if (!token || !action) {
    return new NextResponse("Missing token or action", { status: 400 });
  }

  const parsed = verifyApprovalToken(token);
  if (!parsed) {
    return new NextResponse("Invalid or expired link", { status: 400 });
  }

  const { appointmentId, barberId } = parsed;

  if (action !== "approve" && action !== "decline") {
    return new NextResponse("Unsupported action", { status: 400 });
  }

  if (action === "approve") {
    await appointmentsTable.update(appointmentId, {
      Status: "Approved",
    });
    try {
      const [appointment, barber] = await Promise.all([
        appointmentsTable.find(appointmentId),
        barbersTable.find(barberId),
      ]);
      const email = (barber.get("Email") as string) ?? "";
      if (email) {
        await sendBookingConfirmedEmail({
          to: email,
          barberName: ((barber.get("Name") as string) ?? "Barber").trim() || "Barber",
          location: ((appointment.get("Location") as string) ?? "").trim(),
          date: ((appointment.get("Date") as string) ?? "").trim(),
        });
      }
    } catch (err) {
      console.error("Booking confirmation email after approval failed:", err);
    }
  } else {
    // Declining returns the appointment to the pool
    await appointmentsTable.update(appointmentId, {
      Status: "Pending",
      "Barber Assigned": [],
    });
  }

  return new NextResponse(
    `<html><body style="background:#020617;color:#e5e5e5;font-family:system-ui;padding:24px;">
      <h1 style="font-size:20px;margin-bottom:8px;">Thank you</h1>
      <p style="font-size:14px;margin-bottom:4px;">
        Your response has been recorded as <strong>${action}</strong>.
      </p>
      <p style="font-size:12px;color:#9ca3af;">
        You can now close this window.
      </p>
    </body></html>`,
    {
      status: 200,
      headers: { "Content-Type": "text/html" },
    }
  );
}

