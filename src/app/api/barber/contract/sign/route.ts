import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { COOKIE_NAME, parseAuthToken } from "@/lib/auth";
import { updateBarberContract } from "@/lib/barber-store";

export async function POST(request: Request) {
  const body = await request.json();
  const { signature } = body as { signature: string };

  if (!signature) {
    return NextResponse.json(
      { error: "Missing signature" },
      { status: 400 }
    );
  }

  const cookieStore = await cookies();
  const token = cookieStore.get(COOKIE_NAME)?.value;
  const barberId = parseAuthToken(token);

  if (!barberId) {
    return NextResponse.json(
      { error: "Not authenticated" },
      { status: 401 }
    );
  }

  const now = new Date().toISOString();
  const appUrl = process.env.APP_URL || "http://localhost:3000";
  const contractUrl = `${appUrl}/contracts/${barberId}`;

  await updateBarberContract(barberId, {
    "Contract Status": true,
    "Contract Signed At": now,
    "Contract Signature Data": signature,
    "PDF Contract URL": contractUrl,
  });

  return NextResponse.json({ ok: true });
}

