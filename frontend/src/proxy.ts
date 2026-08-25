import { NextRequest, NextResponse } from "next/server";
import { SESSION_COOKIE } from "@/lib/auth";

const AUTH_REQUIRED_PATHS = ["/account"];

export function proxy(request: NextRequest) {
  const isAuthenticated = Boolean(request.cookies.get(SESSION_COOKIE)?.value);
  const pathname = request.nextUrl.pathname;

  // Only redirect to login for pages that truly require authentication
  const needsAuth = AUTH_REQUIRED_PATHS.some((p) => pathname.startsWith(p));

  if (needsAuth && !isAuthenticated) {
    const loginUrl = new URL("/login", request.url);
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!login|register|verify-pending|verify-email|api/auth|_next/static|_next/image|favicon.ico).*)"],
};
