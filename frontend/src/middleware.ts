import { NextRequest, NextResponse } from "next/server";
import { SESSION_COOKIE } from "@/lib/auth";

export function middleware(request: NextRequest) {
  const isAuthenticated = Boolean(request.cookies.get(SESSION_COOKIE)?.value);

  if (!isAuthenticated) {
    const loginUrl = new URL("/login", request.url);
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/((?!login|register|verify-pending|verify-email|api|_next/static|_next/image|favicon.ico).*)",
  ],
};
