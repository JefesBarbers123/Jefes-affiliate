import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { COOKIE_NAME, parseAuthToken } from "@/lib/auth";
import { getBarberById, updateBarberProfile } from "@/lib/barber-store";
import { hashPassword, verifyPassword } from "@/lib/password";

export async function GET() {
  const cookieStore = await cookies();
  const token = cookieStore.get(COOKIE_NAME)?.value;
  const barberId = parseAuthToken(token);

  if (!barberId) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  const barber = await getBarberById(barberId);
  if (!barber) {
    return NextResponse.json({ error: "Barber not found" }, { status: 404 });
  }

  return NextResponse.json({
    id: barber.id,
    name: (barber.get("Name") as string) ?? "",
    email: (barber.get("Email") as string) ?? "",
    phone: (barber.get("Phone") as string) ?? "",
    barberCustomId: (barber.get("Barber ID") as string) ?? "",
    bankDetails: (barber.get("Bank Details") as string) ?? "",
    workImage1Url: (barber.get("Work Image 1 URL") as string) ?? "",
    workImage2Url: (barber.get("Work Image 2 URL") as string) ?? "",
    workImage3Url: (barber.get("Work Image 3 URL") as string) ?? "",
    contractStatus: (barber.get("Contract Status") as boolean) ?? false,
    referralCode: (barber.get("Referral Code") as string) ?? "",
    hasPassword: Boolean((barber.get("Password Hash") as string) ?? ""),
  });
}

export async function PATCH(request: Request) {
  const cookieStore = await cookies();
  const token = cookieStore.get(COOKIE_NAME)?.value;
  const barberId = parseAuthToken(token);

  if (!barberId) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  const body = await request.json();
  const {
    name,
    email,
    phone,
    barberCustomId,
    bankDetails,
    workImage1Url,
    workImage2Url,
    workImage3Url,
    currentPassword,
    newPassword,
  } = body as {
    name?: string;
    email?: string;
    phone?: string;
    barberCustomId?: string;
    bankDetails?: string;
    workImage1Url?: string;
    workImage2Url?: string;
    workImage3Url?: string;
    currentPassword?: string;
    newPassword?: string;
  };

  const barber = await getBarberById(barberId);
  if (!barber) {
    return NextResponse.json({ error: "Barber not found" }, { status: 404 });
  }

  let passwordUpdate: { "Password Hash"?: string } = {};
  if (newPassword) {
    const existingHash = (barber.get("Password Hash") as string) ?? "";
    if (existingHash && (!currentPassword || !verifyPassword(currentPassword, existingHash))) {
      return NextResponse.json(
        { error: "Current password is incorrect." },
        { status: 400 }
      );
    }
    if (newPassword.length < 8) {
      return NextResponse.json(
        { error: "New password must be at least 8 characters." },
        { status: 400 }
      );
    }
    passwordUpdate = { "Password Hash": hashPassword(newPassword) };
  }

  await updateBarberProfile(barberId, {
    ...(name ? { Name: name.trim() } : {}),
    ...(email ? { Email: email.trim().toLowerCase() } : {}),
    ...(phone ? { Phone: phone.trim() } : {}),
    ...(barberCustomId ? { "Barber ID": barberCustomId.trim() } : {}),
    ...(typeof bankDetails === "string" ? { "Bank Details": bankDetails } : {}),
    ...(typeof workImage1Url === "string"
      ? { "Work Image 1 URL": workImage1Url.trim() }
      : {}),
    ...(typeof workImage2Url === "string"
      ? { "Work Image 2 URL": workImage2Url.trim() }
      : {}),
    ...(typeof workImage3Url === "string"
      ? { "Work Image 3 URL": workImage3Url.trim() }
      : {}),
    ...passwordUpdate,
  });

  return NextResponse.json({ ok: true });
}

