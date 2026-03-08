import { NextResponse } from "next/server";
import { barbersTable, isAirtableConfigured, withdrawalsTable } from "@/lib/airtable";
import { sendPayoutPaidEmail } from "@/lib/email";

const ALLOWED_STATUSES = new Set(["Requested", "Approved", "Paid", "Rejected"]);

export async function PATCH(
  request: Request,
  context: { params: Promise<{ withdrawalId: string }> }
) {
  if (!isAirtableConfigured || !withdrawalsTable) {
    return NextResponse.json(
      { error: "Withdrawals table is not configured." },
      { status: 400 }
    );
  }

  const { withdrawalId } = await context.params;
  const body = await request.json();
  const status = typeof body?.status === "string" ? body.status : "";
  const note = typeof body?.note === "string" ? body.note.trim() : undefined;

  if (!ALLOWED_STATUSES.has(status)) {
    return NextResponse.json({ error: "Invalid withdrawal status." }, { status: 400 });
  }

  const previous = await withdrawalsTable.find(withdrawalId);
  const previousStatus = (previous.get("Status") as string) ?? "Requested";
  const amount = (previous.get("Amount") as number) ?? 0;
  const linkedBarbers = ((previous.get("Barber") as string[]) ?? []).filter(Boolean);

  await withdrawalsTable.update(withdrawalId, {
    Status: status,
    ...(status === "Paid" || status === "Rejected"
      ? { "Processed At": new Date().toISOString() }
      : {}),
    ...(typeof note === "string" ? { Note: note } : {}),
  });

  if (status === "Paid" && previousStatus !== "Paid" && barbersTable && amount > 0) {
    for (const barberId of linkedBarbers) {
      try {
        const barber = await barbersTable.find(barberId);
        const email = (barber.get("Email") as string) ?? "";
        const barberName = ((barber.get("Name") as string) ?? "Barber").trim() || "Barber";
        if (!email) continue;
        await sendPayoutPaidEmail({
          to: email,
          barberName,
          amount,
        });
      } catch (err) {
        console.error("Payout paid email failed:", err);
      }
    }
  }

  return NextResponse.json({ ok: true });
}
