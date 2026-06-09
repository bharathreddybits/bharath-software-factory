import { type NextRequest, NextResponse } from "next/server";
import { createMiddlewareClient } from "@/src/lib/supabase/middleware";

// Routes that require an authenticated session
const PROTECTED_PREFIXES = ["/dashboard", "/onboarding"];

// Routes that should redirect authenticated users away (to prevent login loops)
const AUTH_ONLY_PATHS = ["/login", "/signup"];

export async function middleware(request: NextRequest) {
  const { response, user } = await createMiddlewareClient(request);
  const { pathname } = request.nextUrl;

  const isProtected = PROTECTED_PREFIXES.some((p) => pathname.startsWith(p));
  const isAuthOnly = AUTH_ONLY_PATHS.some((p) => pathname === p);

  // Unauthenticated user hitting a protected route → send to /login
  if (!user && isProtected) {
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("next", pathname);
    return NextResponse.redirect(loginUrl);
  }

  // Authenticated user hitting /login or /signup → send to /dashboard
  if (user && isAuthOnly) {
    return NextResponse.redirect(new URL("/dashboard", request.url));
  }

  // Pass through with refreshed session cookies in the response
  return response;
}

export const config = {
  matcher: [
    // Run on all paths except Next.js internals and static assets
    "/((?!_next/static|_next/image|favicon\\.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
