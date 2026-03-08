import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { COOKIE_NAME, createAuthToken } from "@/lib/auth";
import { createBarber } from "@/lib/barber-store";
import { sendSignupConfirmationEmail } from "@/lib/email";

function generateReferralCode() {
  return Math.random().toString(36).substring(2, 8).toUpperCase();
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const {
      name,
      email,
      phone,
      barberCustomId,
      password,
      bankDetails,
      referralCode: referringCode,
    } = body as {
      name: string;
      email: string;
      phone?: string;
      barberCustomId?: string;
      password?: string;
      bankDetails?: string;
      referralCode?: string;
    };

    if (!name || !email) {
      return NextResponse.json(
        { error: "Name and email are required" },
        { status: 400 }
      );
    }

    if (password && password.length < 8) {
      return NextResponse.json(
        { error: "Password must be at least 8 characters." },
        { status: 400 }
      );
    }

    const referralCode = generateReferralCode();

    const created = await createBarber({
      name,
      email,
      phone,
      barberCustomId,
      password,
      bankDetails,
      referralCode,
      referringCode: referringCode || undefined,
    });

    const token = createAuthToken(created.id);
    const cookieStore = await cookies();
    cookieStore.set(COOKIE_NAME, token, {
      httpOnly: true,
      path: "/",
    });

    try {
      await sendSignupConfirmationEmail({
        to: created.email,
        barberName: created.name,
      });
    } catch (emailErr) {
      console.error("Signup confirmation email failed:", emailErr);
    }

    return NextResponse.json(
      {
        id: created.id,
        name: created.name,
        email: created.email,
        referralCode: created.referralCode,
      },
      { status: 201 }
    );
  } catch (err) {
    console.error("Signup error:", err);
    const message =
      err instanceof Error ? err.message : "Something went wrong creating your account.";
    return NextResponse.json(
      { error: message },
      { status: 500 }
    );
  }
}
