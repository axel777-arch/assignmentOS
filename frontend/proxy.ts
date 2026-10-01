import { NextRequest, NextResponse } from "next/server";

const protectedPaths = ["/dashboard", "/assignments", "/settings"];

export async function proxy(request: NextRequest) {
  const authRequired = process.env.NODE_ENV === "production" || process.env.AUTH_REQUIRED === "true";
  if (!authRequired) return NextResponse.next();
  const { pathname } = request.nextUrl;
  const hasSession = Boolean(request.cookies.get("assignmentos_session")?.value);
  const protectedPath = protectedPaths.some((path) => pathname === path || pathname.startsWith(`${path}/`));
  if (protectedPath) {
    if (!hasSession) return NextResponse.redirect(new URL("/login", request.url));
    try {
      const apiUrl = process.env.API_INTERNAL_URL || "http://127.0.0.1:4000";
      const session = await fetch(`${apiUrl}/api/auth/me`, { headers: { cookie: request.headers.get("cookie") || "" }, cache: "no-store", signal: AbortSignal.timeout(3000) });
      if (!session.ok) return NextResponse.redirect(new URL("/login", request.url));
    } catch { return NextResponse.redirect(new URL("/login", request.url)); }
  }
  if (pathname === "/login" && hasSession) {
    try {
      const apiUrl = process.env.API_INTERNAL_URL || "http://127.0.0.1:4000";
      const session = await fetch(`${apiUrl}/api/auth/me`, { headers: { cookie: request.headers.get("cookie") || "" }, cache: "no-store", signal: AbortSignal.timeout(3000) });
      if (session.ok) return NextResponse.redirect(new URL("/dashboard", request.url));
    } catch { /* Let the login page handle an expired or unavailable session. */ }
  }
  return NextResponse.next();
}

export const config = { matcher: ["/dashboard/:path*", "/assignments/:path*", "/settings/:path*", "/login"] };