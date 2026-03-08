import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { COOKIE_NAME, createAuthToken } from "@/lib/auth";
import { findBarberByEmail } from "@/lib/barber-store";
import { verifyPassword } from "@/lib/password";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { email, password } = body as { email: string; password?: string };
    const normalizedEmail = email?.trim().toLowerCase();

    if (!normalizedEmail) {
      return NextResponse.json({ error: "Email is required" }, { status: 400 });
    }

    const barber = await findBarberByEmail(normalizedEmail);

    if (!barber) {
      return NextResponse.json(
        { error: "No barber found with that email" },
        { status: 404 }
      );
    }

    const passwordHash = (barber.get("Password Hash") as string) ?? "";
    if (passwordHash) {
      if (!password || !verifyPassword(password, passwordHash)) {
        return NextResponse.json(
          { error: "Incorrect password for this account" },
          { status: 401 }
        );
      }
    }

    const token = createAuthToken(barber.id);
    const cookieStore = await cookies();
    cookieStore.set(COOKIE_NAME, token, {
      httpOnly: true,
      path: "/",
    });

    return NextResponse.json(
      {
        id: barber.id,
        name: barber.get("Name"),
        email: barber.get("Email"),
      },
      { status: 200 }
    );
  } catch (err) {
    console.error("Login error:", err);
    return NextResponse.json(
      { error: "Something went wrong. Try again." },
      { status: 500 }
    );
  }
}
