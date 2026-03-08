import { NextResponse } from "next/server";
import { barbersTable, isAirtableConfigured } from "@/lib/airtable";
import { updateLocalBarber } from "@/lib/local-barbers";

type Params = {
  params: Promise<{ barberId: string }>;
};

export async function PATCH(request: Request, { params }: Params) {
  const { barberId } = await params;
  const body = await request.json();
  const { name, email, phone, barberCustomId, bankDetails, contractStatus } = body as {
    name?: string;
    email?: string;
    phone?: string;
    barberCustomId?: string;
    bankDetails?: string;
    contractStatus?: boolean;
  };

  const updates = {
    ...(name ? { Name: name.trim() } : {}),
    ...(email ? { Email: email.trim().toLowerCase() } : {}),
    ...(phone ? { Phone: phone.trim() } : {}),
    ...(barberCustomId ? { "Barber ID": barberCustomId.trim() } : {}),
    ...(typeof bankDetails === "string" ? { "Bank Details": bankDetails } : {}),
    ...(typeof contractStatus === "boolean"
      ? { "Contract Status": contractStatus }
      : {}),
  };

  if (isAirtableConfigured && barbersTable && !barberId.startsWith("local_")) {
    await barbersTable.update(barberId, updates);
    return NextResponse.json({ ok: true });
  }

  await updateLocalBarber(barberId, updates);
  return NextResponse.json({ ok: true });
}

