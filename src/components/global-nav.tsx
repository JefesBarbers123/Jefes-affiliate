"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { ChevronLeft, LayoutDashboard, CalendarDays } from "lucide-react";

export function GlobalNav() {
  const router = useRouter();
  const pathname = usePathname();

  const isAuthPage = pathname?.startsWith("/login") || pathname?.startsWith("/signup");

  if (isAuthPage) {
    return null;
  }

  return (
    <div className="sticky top-0 z-50 border-b border-yellow-300/20 bg-zinc-950/95 backdrop-blur">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-2">
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => router.back()}
            className="inline-flex items-center gap-1 rounded-lg border border-zinc-700 bg-zinc-900 px-2.5 py-1.5 text-xs text-zinc-200 hover:border-yellow-300/50 hover:bg-zinc-800"
          >
            <ChevronLeft className="h-3.5 w-3.5" />
            Back
          </button>
          <Link
            href="/"
            className="inline-flex items-center gap-2 rounded-lg border border-yellow-300/60 bg-zinc-900 px-2.5 py-1.5 text-xs font-medium text-yellow-200 hover:bg-zinc-800"
          >
            <span className="brand-logo-3d" aria-hidden>
              <span className="brand-logo-3d-face brand-logo-3d-front">
                <img
                  src="/api/brand/logo"
                  alt=""
                  className="h-full w-full object-cover brightness-110 contrast-125"
                />
              </span>
              <span className="brand-logo-3d-face brand-logo-3d-back">
                <img
                  src="/api/brand/logo"
                  alt=""
                  className="h-full w-full object-cover brightness-110 contrast-125"
                />
              </span>
            </span>
            Home
          </Link>
        </div>

        <div className="flex items-center gap-2">
          <Link
            href="/barber"
            className="inline-flex items-center gap-1 rounded-lg border border-zinc-700 bg-zinc-900 px-2.5 py-1.5 text-xs text-zinc-200 hover:border-yellow-300/50 hover:bg-zinc-800"
          >
            <LayoutDashboard className="h-3.5 w-3.5" />
            Barber
          </Link>
          <Link
            href="/barber/availability"
            className="inline-flex items-center gap-1 rounded-lg border border-zinc-700 bg-zinc-900 px-2.5 py-1.5 text-xs text-zinc-200 hover:border-yellow-300/50 hover:bg-zinc-800"
          >
            <CalendarDays className="h-3.5 w-3.5" />
            Availability
          </Link>
          <Link
            href="/admin"
            className="inline-flex items-center gap-1 rounded-lg border border-zinc-700 bg-zinc-900 px-2.5 py-1.5 text-xs text-zinc-200 hover:border-yellow-300/50 hover:bg-zinc-800"
          >
            <LayoutDashboard className="h-3.5 w-3.5" />
            Admin
          </Link>
        </div>
      </div>
    </div>
  );
}

