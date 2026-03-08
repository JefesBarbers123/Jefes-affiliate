import { NextResponse } from "next/server";
import { barbersTable, isAirtableConfigured, withdrawalsTable } from "@/lib/airtable";

type AdminWithdrawalItem = {
  id: string;
  barberId: string;
  barberName: string;
  amount: number;
  status: string;
  requestedAt: string;
  processedAt: string;
  note: string;
};

export async function GET() {
  if (!isAirtableConfigured || !withdrawalsTable) {
    return NextResponse.json({ items: [] as AdminWithdrawalItem[], tableReady: false });
  }

  const records = await withdrawalsTable
    .select({
      sort: [{ field: "Requested At", direction: "desc" }],
      maxRecords: 200,
    })
    .all();

  const barberIds = Array.from(
    new Set(
      records
        .flatMap((r) => ((r.get("Barber") as string[]) ?? []))
        .filter((id): id is string => Boolean(id))
    )
  );

  const barberNameById = new Map<string, string>();
  const table = barbersTable;
  if (table && barberIds.length > 0) {
    await Promise.all(
      barberIds.map(async (id) => {
        try {
          const barber = await table.find(id);
          barberNameById.set(id, ((barber.get("Name") as string) ?? "").trim() || "Unknown");
        } catch {
          barberNameById.set(id, "Unknown");
        }
      })
    );
  }

  const items: AdminWithdrawalItem[] = records.map((record) => {
    const linkedBarbers = ((record.get("Barber") as string[]) ?? []).filter(Boolean);
    const barberId = linkedBarbers[0] ?? "";
    return {
      id: record.id,
      barberId,
      barberName: barberNameById.get(barberId) ?? "Unknown",
      amount: ((record.get("Amount") as number) ?? 0),
      status: ((record.get("Status") as string) ?? "Requested"),
      requestedAt: ((record.get("Requested At") as string) ?? ""),
      processedAt: ((record.get("Processed At") as string) ?? ""),
      note: ((record.get("Note") as string) ?? ""),
    };
  });

  return NextResponse.json({ items, tableReady: true });
}
