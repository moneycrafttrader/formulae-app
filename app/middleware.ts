import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { createMiddlewareClient } from "@/app/lib/supabaseServer";
import { isUserSubscribed } from "@/app/lib/subscription";

// Routes that don't require authentication
const publicRoutes = ["/", "/login", "/signup", "/forgot-password", "/auth/callback"];

// Routes that require authentication
const protectedRoutes = ["/dashboard", "/calculator", "/profile", "/subscribe"];

// Routes that require subscription
const subscriptionRequiredRoutes = ["/calculator"];

/**
 * Middleware to protect routes and validate session tokens
 */
export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Allow auth callback route without any checks (handles its own authentication)
  if (pathname.startsWith("/auth/callback")) {
    return NextResponse.next();
  }

  // Check if route is public
  const isPublicRoute = publicRoutes.some((route) => pathname === route);

  // Allow public routes
  if (isPublicRoute) {
    return NextResponse.next();
  }

  // Check if route is protected
  const isProtectedRoute = protectedRoutes.some((route) =>
    pathname.startsWith(route)
  );

  if (!isProtectedRoute) {
    return NextResponse.next();
  }

  try {
    // Get Supabase session (using middleware client)
    const supabase = createMiddlewareClient(request);
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    // No user session - redirect to login
    if (userError || !user) {
      const redirectUrl = new URL("/login", request.url);
      redirectUrl.searchParams.set("redirect", pathname);
      return NextResponse.redirect(redirectUrl);
    }

    // Get session token from cookie (preferred) or header (fallback)
    const cookieToken = request.cookies.get("session_token")?.value;
    const headerToken = request.headers.get("x-session-token");
    const clientToken = cookieToken || headerToken;

    // Fetch profile to check session token
    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select("last_session_token, role")
      .eq("id", user.id)
      .single();

    if (profileError || !profile) {
      // Profile doesn't exist - invalidate session
      await supabase.auth.signOut();
      const redirectUrl = new URL("/login", request.url);
      redirectUrl.searchParams.set("session", "expired");
      
      // Clear cookies
      const response = NextResponse.redirect(redirectUrl);
      response.cookies.delete("session_token");
      return response;
    }

    // Check session token match (single device login)
    // If last_session_token is null and clientToken exists, this is a new session - allow it
    // If last_session_token exists and doesn't match clientToken, invalidate session
    const hasStoredToken = profile.last_session_token !== null && profile.last_session_token !== undefined;
    const tokenMismatch = hasStoredToken && profile.last_session_token !== clientToken;
    
    if (!clientToken || tokenMismatch) {
      // Token mismatch or no client token - invalidate session, clear cookies, and redirect
      await supabase.auth.signOut();
      const redirectUrl = new URL("/login", request.url);
      redirectUrl.searchParams.set("session", "expired");
      
      // Clear all cookies
      const response = NextResponse.redirect(redirectUrl);
      response.cookies.delete("session_token");
      // Clear Supabase auth cookies
      response.cookies.delete("sb-access-token");
      response.cookies.delete("sb-refresh-token");
      
      return response;
    }

    // Check subscription requirement
    const requiresSubscription = subscriptionRequiredRoutes.some((route) =>
      pathname.startsWith(route)
    );

    if (requiresSubscription) {
      const hasSubscription = await isUserSubscribed(user.id, supabase);
      if (!hasSubscription) {
        const redirectUrl = new URL("/subscribe", request.url);
        redirectUrl.searchParams.set("error", "subscription_required");
        return NextResponse.redirect(redirectUrl);
      }
    }

    // All checks passed - allow request
    return NextResponse.next();
  } catch (error) {
    console.error("Middleware error:", error);
    // On error, redirect to login
    const redirectUrl = new URL("/login", request.url);
    redirectUrl.searchParams.set("error", "server_error");
    return NextResponse.redirect(redirectUrl);
  }
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    "/((?!api|_next/static|_next/image|favicon.ico).*)",
  ],
};
