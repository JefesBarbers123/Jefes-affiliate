import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { COOKIE_NAME, parseAuthToken } from "@/lib/auth";
import { getBarberEarningsSummary } from "@/lib/earnings";
import { isAirtableConfigured, withdrawalsTable } from "@/lib/airtable";
import { isLocalBarberId } from "@/lib/local-barbers";

type WithdrawalItem = {
  id: string;
  amount: number;
  status: string;
  requestedAt: string;
  processedAt: string;
  note: string;
};

async function getPendingWithdrawalTotal(barberId: string) {
  if (!withdrawalsTable) return 0;
  const pending = await withdrawalsTable
    .select({
      filterByFormula: `AND(
        FIND('${barberId}', ARRAYJOIN({Barber})),
        OR({Status} = 'Requested', {Status} = 'Approved')
      )`,
    })
    .all();

  return pending.reduce((sum, record) => {
    const amount = (record.get("Amount") as number) ?? 0;
    return sum + amount;
  }, 0);
}

export async function GET() {
  const cookieStore = await cookies();
  const token = cookieStore.get(COOKIE_NAME)?.value;
  const barberId = parseAuthToken(token);
  if (!barberId) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  if (!isAirtableConfigured || !withdrawalsTable || isLocalBarberId(barberId)) {
    return NextResponse.json({
      items: [] as WithdrawalItem[],
      pendingTotal: 0,
      availableToRequest: 0,
      tableReady: false,
    });
  }

  const summary = await getBarberEarningsSummary(barberId);
  const pendingTotal = await getPendingWithdrawalTotal(barberId);
  const availableToRequest = Math.max(0, summary.withdrawableBalance - pendingTotal);

  const records = await withdrawalsTable
    .select({
      filterByFormula: `FIND('${barberId}', ARRAYJOIN({Barber}))`,
      sort: [{ field: "Requested At", direction: "desc" }],
      maxRecords: 50,
    })
    .all();

  const items: WithdrawalItem[] = records.map((record) => ({
    id: record.id,
    amount: ((record.get("Amount") as number) ?? 0),
    status: ((record.get("Status") as string) ?? "Requested"),
    requestedAt: ((record.get("Requested At") as string) ?? ""),
    processedAt: ((record.get("Processed At") as string) ?? ""),
    note: ((record.get("Note") as string) ?? ""),
  }));

  return NextResponse.json({ items, pendingTotal, availableToRequest, tableReady: true });
}

export async function POST(request: Request) {
  const cookieStore = await cookies();
  const token = cookieStore.get(COOKIE_NAME)?.value;
  const barberId = parseAuthToken(token);
  if (!barberId) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  if (!isAirtableConfigured || !withdrawalsTable || isLocalBarberId(barberId)) {
    return NextResponse.json(
      { error: "Withdrawals need Airtable + Withdrawals table configured." },
      { status: 400 }
    );
  }

  const body = await request.json();
  const amount = Number(body?.amount ?? 0);
  const note = typeof body?.note === "string" ? body.note.trim() : "";

  if (!Number.isFinite(amount) || amount <= 0) {
    return NextResponse.json({ error: "Enter a valid amount above 0." }, { status: 400 });
  }

  const summary = await getBarberEarningsSummary(barberId);
  const pendingTotal = await getPendingWithdrawalTotal(barberId);
  const availableToRequest = Math.max(0, summary.withdrawableBalance - pendingTotal);

  if (amount > availableToRequest) {
    return NextResponse.json(
      {
        error: `Request too high. You can request up to £${availableToRequest.toFixed(2)} right now.`,
      },
      { status: 400 }
    );
  }

  await withdrawalsTable.create({
    Barber: [barberId],
    Amount: amount,
    Status: "Requested",
    "Requested At": new Date().toISOString(),
    ...(note ? { Note: note } : {}),
  });

  return NextResponse.json({ ok: true });
}
