import { NextResponse, type NextRequest } from "next/server";
import { verifySessionToken } from "@/lib/auth/session-edge";
import { SESSION_COOKIE } from "@/lib/constants";

/**
 * Optimistic route protection. Real authorization happens in route handlers
 * and server components (requireUser / requireAdmin); this only redirects
 * obviously unauthenticated visitors away from private pages.
 */
export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const token = request.cookies.get(SESSION_COOKIE)?.value;
  const session = token ? await verifySessionToken(token) : null;

  if (pathname.startsWith("/dashboard") && !session) {
    const url = new URL("/login", request.url);
    url.searchParams.set("next", pathname);
    return NextResponse.redirect(url);
  }
  if (pathname.startsWith("/admin")) {
    if (!session) {
      const url = new URL("/login", request.url);
      url.searchParams.set("next", pathname);
      return NextResponse.redirect(url);
    }
    if (session.role !== "ADMIN") return NextResponse.redirect(new URL("/dashboard?denied=admin", request.url));
  }
  if ((pathname === "/login" || pathname === "/register") && session) {
    return NextResponse.redirect(new URL(session.role === "ADMIN" ? "/admin" : "/dashboard", request.url));
  }

  const res = NextResponse.next();
  res.headers.set("X-Frame-Options", "DENY");
  res.headers.set("X-Content-Type-Options", "nosniff");
  res.headers.set("Referrer-Policy", "strict-origin-when-cross-origin");
  return res;
}

export const config = {
  matcher: ["/dashboard/:path*", "/admin/:path*", "/login", "/register"],
};
