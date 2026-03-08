import { NextResponse } from "next/server";
import { barbersTable, isAirtableConfigured } from "@/lib/airtable";
import { createLocalBarber, readBarbers } from "@/lib/local-barbers";

function makeReferralCode() {
  return Math.random().toString(36).slice(2, 8).toUpperCase();
}

export async function GET() {
  if (isAirtableConfigured && barbersTable) {
    const records = await barbersTable.select({ maxRecords: 500 }).all();
    return NextResponse.json({
      items: records.map((record) => ({
        id: record.id,
        name: (record.get("Name") as string) ?? "",
        email: (record.get("Email") as string) ?? "",
        phone: (record.get("Phone") as string) ?? "",
        barberCustomId: (record.get("Barber ID") as string) ?? "",
        bankDetails: (record.get("Bank Details") as string) ?? "",
        referralCode: (record.get("Referral Code") as string) ?? "",
        contractStatus: (record.get("Contract Status") as boolean) ?? false,
      })),
    });
  }

  const local = await readBarbers();
  return NextResponse.json({
    items: local.map((b) => ({
      id: b.id,
      name: b.Name,
      email: b.Email,
      phone: b.Phone ?? "",
      barberCustomId: b["Barber ID"] ?? "",
      bankDetails: b["Bank Details"],
      referralCode: b["Referral Code"],
      contractStatus: b["Contract Status"],
    })),
  });
}

export async function POST(request: Request) {
  const body = await request.json();
  const { name, email, phone, barberCustomId, bankDetails, referralCode } = body as {
    name: string;
    email: string;
    phone?: string;
    barberCustomId?: string;
    bankDetails?: string;
    referralCode?: string;
  };

  if (!name || !email) {
    return NextResponse.json(
      { error: "Name and email are required." },
      { status: 400 }
    );
  }

  const safeEmail = email.trim().toLowerCase();
  const safeReferralCode = (referralCode || makeReferralCode()).trim().toUpperCase();

  if (isAirtableConfigured && barbersTable) {
    const created = await barbersTable.create({
      Name: name.trim(),
      Email: safeEmail,
      ...(phone ? { Phone: phone.trim() } : {}),
      ...(barberCustomId ? { "Barber ID": barberCustomId.trim() } : {}),
      "Bank Details": bankDetails ?? "",
      "Referral Code": safeReferralCode,
      "Contract Status": false,
    });
    return NextResponse.json({ id: created.id }, { status: 201 });
  }

  const created = await createLocalBarber({
    name: name.trim(),
    email: safeEmail,
    phone,
    barberCustomId,
    bankDetails: bankDetails ?? "",
    referralCode: safeReferralCode,
  });

  return NextResponse.json({ id: created.id }, { status: 201 });
}

