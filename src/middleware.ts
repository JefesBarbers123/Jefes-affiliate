import { NextRequest, NextResponse } from "next/server";
import { COOKIE_NAME, parseAuthToken } from "./lib/auth";

const PROTECTED_PREFIXES = ["/barber"];

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  const isProtected = PROTECTED_PREFIXES.some((prefix) =>
    pathname.startsWith(prefix)
  );

  if (!isProtected) {
    return NextResponse.next();
  }

  const token = request.cookies.get(COOKIE_NAME)?.value;
  const barberId = parseAuthToken(token);

  if (!barberId) {
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("redirect", pathname);
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/barber/:path*"],
};

