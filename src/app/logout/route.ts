import { cookies, headers } from "next/headers";
import { NextResponse } from "next/server";
import { COOKIE_NAME } from "@/lib/auth";

export async function GET() {
  const cookieStore = await cookies();
  cookieStore.delete(COOKIE_NAME);
  const headersList = await headers();
  const host = headersList.get("host") || "localhost:3000";
  const base = process.env.APP_URL || `http://${host}`;
  return NextResponse.redirect(new URL("/", base));
}
