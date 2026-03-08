import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { COOKIE_NAME, parseAuthToken } from "@/lib/auth";
import { availabilityTable, isAirtableConfigured } from "@/lib/airtable";

const WEEKDAY_TO_JS_INDEX: Record<string, number> = {
  sunday: 0,
  monday: 1,
  tuesday: 2,
  wednesday: 3,
  thursday: 4,
  friday: 5,
  saturday: 6,
};

function formatDateYMD(date: Date) {
  return date.toISOString().slice(0, 10);
}

function buildDatesFromWeekdays(days: string[], weeks: number) {
  const selected = new Set(
    days
      .map((d) => d.toLowerCase().trim())
      .filter((d) => d in WEEKDAY_TO_JS_INDEX)
      .map((d) => WEEKDAY_TO_JS_INDEX[d])
  );
  if (selected.size === 0) return [];

  const results: string[] = [];
  const start = new Date();
  start.setHours(0, 0, 0, 0);
  const totalDays = Math.max(1, weeks) * 7;

  for (let i = 0; i < totalDays; i += 1) {
    const d = new Date(start);
    d.setDate(start.getDate() + i);
    if (selected.has(d.getDay())) {
      results.push(formatDateYMD(d));
    }
  }
  return results;
}

export async function GET() {
  const cookieStore = await cookies();
  const token = cookieStore.get(COOKIE_NAME)?.value;
  const barberId = parseAuthToken(token);

  if (!barberId) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }
  if (!isAirtableConfigured || !availabilityTable) {
    return NextResponse.json({ items: [] });
  }

  const records = await availabilityTable
    .select({
      filterByFormula: `FIND('${barberId}', ARRAYJOIN({Barber ID}))`,
      maxRecords: 100,
    })
    .all();

  const items = records.map((record) => ({
    id: record.id,
    date: (record.get("Date") as string) ?? "",
    status: (record.get("Status") as string) ?? "Available",
  }));

  return NextResponse.json({ items });
}

export async function POST(request: Request) {
  const cookieStore = await cookies();
  const token = cookieStore.get(COOKIE_NAME)?.value;
  const barberId = parseAuthToken(token);

  if (!barberId) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }
  if (!isAirtableConfigured || !availabilityTable) {
    return NextResponse.json(
      { error: "Airtable availability table not configured." },
      { status: 503 }
    );
  }

  const body = await request.json();
  const {
    date,
    status,
    days,
    weeks,
  } = body as {
    date?: string;
    status: "Available" | "Booked";
    days?: string[];
    weeks?: number;
  };

  if (!status || (!date && (!days || days.length === 0))) {
    return NextResponse.json(
      { error: "Provide a date or selected weekdays, plus status." },
      { status: 400 }
    );
  }

  const datesToUpsert = date
    ? [date]
    : buildDatesFromWeekdays(days || [], Math.max(1, weeks || 8));

  for (const dateValue of datesToUpsert) {
    const existing = await availabilityTable
      .select({
        filterByFormula: `AND(FIND('${barberId}', ARRAYJOIN({Barber ID})), {Date} = '${dateValue}')`,
        maxRecords: 1,
      })
      .firstPage();

    if (existing.length > 0) {
      await availabilityTable.update(existing[0].id, { Status: status });
    } else {
      await availabilityTable.create({
        "Barber ID": [barberId],
        Date: dateValue,
        Status: status,
      });
    }
  }

  return NextResponse.json({ ok: true, upserted: datesToUpsert.length });
}

