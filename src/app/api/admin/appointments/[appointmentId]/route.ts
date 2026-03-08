import { NextResponse } from "next/server";
import { appointmentsTable, barbersTable, isAirtableConfigured } from "@/lib/airtable";
import { createApprovalToken } from "@/lib/approvalToken";
import {
  sendBarberApprovalEmail,
  sendBookingCancelledEmail,
  sendBookingConfirmedEmail,
  sendReferralBonusEmail,
} from "@/lib/email";

type Params = {
  params: Promise<{ appointmentId: string }>;
};

export async function PATCH(request: Request, { params }: Params) {
  const { appointmentId } = await params;

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
    location?: string;
    date?: string;
    dayRate?: number;
    barberAssigned?: string[];
    status?: "Pending" | "Approved" | "Completed" | "Cancelled";
    invoiceStatus?: "Sent" | "Paid" | "";
  };

  const previous = await appointmentsTable.find(appointmentId);
  const previousStatus = ((previous.get("Status") as string) ?? "Pending") as
    | "Pending"
    | "Approved"
    | "Completed"
    | "Cancelled";
  const previousAssigned = ((previous.get("Barber Assigned") as string[]) ?? []).filter(Boolean);
  const finalLocation = (typeof location === "string"
    ? location.trim()
    : ((previous.get("Location") as string) ?? "")
  ).trim();
  const finalDate = (typeof date === "string" ? date : ((previous.get("Date") as string) ?? "")).trim();
  const finalDayRate =
    typeof dayRate === "number" ? dayRate : ((previous.get("Day Rate") as number) ?? 0);
  const finalAssigned = (barberAssigned ?? previousAssigned).filter(Boolean);
  const finalStatus = (typeof status === "string" ? status : previousStatus) as
    | "Pending"
    | "Approved"
    | "Completed"
    | "Cancelled";

  await appointmentsTable.update(appointmentId, {
    ...(typeof location === "string" ? { Location: location.trim() } : {}),
    ...(typeof date === "string" ? { Date: date } : {}),
    ...(typeof dayRate === "number" ? { "Day Rate": dayRate } : {}),
    ...(barberAssigned ? { "Barber Assigned": barberAssigned } : {}),
    ...(typeof status === "string" ? { Status: status } : {}),
    ...(typeof invoiceStatus === "string" ? { "Invoice Status": invoiceStatus } : {}),
  });

  if (!barbersTable) {
    return NextResponse.json({ ok: true });
  }

  const appUrl = process.env.APP_URL || "http://localhost:3000";
  const newlyAssigned = finalAssigned.filter((id) => !previousAssigned.includes(id));

  if (newlyAssigned.length > 0 && finalStatus !== "Cancelled") {
    for (const barberId of newlyAssigned) {
      try {
        const barber = await barbersTable.find(barberId);
        const email = (barber.get("Email") as string) ?? "";
        const name = (barber.get("Name") as string) ?? "Barber";
        if (!email) continue;
        const token = createApprovalToken(appointmentId, barberId);
        await sendBarberApprovalEmail({
          to: email,
          barberName: name,
          location: finalLocation,
          date: finalDate,
          approveUrl: `${appUrl}/api/appointments/email-respond?token=${token}&action=approve`,
          declineUrl: `${appUrl}/api/appointments/email-respond?token=${token}&action=decline`,
        });
      } catch (err) {
        console.error("New assignment email failed:", err);
      }
    }
  }

  if (finalStatus === "Approved" && previousStatus !== "Approved") {
    for (const barberId of finalAssigned) {
      try {
        const barber = await barbersTable.find(barberId);
        const email = (barber.get("Email") as string) ?? "";
        const name = (barber.get("Name") as string) ?? "Barber";
        if (!email) continue;
        await sendBookingConfirmedEmail({
          to: email,
          barberName: name,
          location: finalLocation,
          date: finalDate,
        });
      } catch (err) {
        console.error("Booking confirmation email failed:", err);
      }
    }
  }

  if (finalStatus === "Cancelled" && previousStatus !== "Cancelled") {
    const cancelledTargets = finalAssigned.length ? finalAssigned : previousAssigned;
    for (const barberId of cancelledTargets) {
      try {
        const barber = await barbersTable.find(barberId);
        const email = (barber.get("Email") as string) ?? "";
        const name = (barber.get("Name") as string) ?? "Barber";
        if (!email) continue;
        await sendBookingCancelledEmail({
          to: email,
          barberName: name,
          location: finalLocation,
          date: finalDate,
        });
      } catch (err) {
        console.error("Booking cancellation email failed:", err);
      }
    }
  }

  if (finalStatus === "Completed" && previousStatus !== "Completed" && finalDayRate > 0) {
    const referralBonusAmount = finalDayRate * 0.1;
    for (const assignedId of finalAssigned) {
      try {
        const assignedBarber = await barbersTable.find(assignedId);
        const referredBarberName = (assignedBarber.get("Name") as string) ?? "A referred barber";
        const referrers = ((assignedBarber.get("Referring Barber ID") as string[]) ?? []).filter(
          Boolean
        );
        for (const referrerId of referrers) {
          try {
            const referrer = await barbersTable.find(referrerId);
            const referrerEmail = (referrer.get("Email") as string) ?? "";
            const referrerName = (referrer.get("Name") as string) ?? "Barber";
            if (!referrerEmail) continue;
            await sendReferralBonusEmail({
              to: referrerEmail,
              barberName: referrerName,
              referredBarberName,
              location: finalLocation,
              date: finalDate,
              bonusAmount: referralBonusAmount,
            });
          } catch (err) {
            console.error("Referral bonus email failed:", err);
          }
        }
      } catch (err) {
        console.error("Referral lookup failed:", err);
      }
    }
  }

  return NextResponse.json({ ok: true });
}

