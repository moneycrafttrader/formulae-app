import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { createMiddlewareClient } from "@/app/lib/supabaseServer";
import { isUserSubscribed } from "@/app/lib/subscription";

export async function middleware(req: NextRequest) {
  const path = req.nextUrl.pathname;

  // Public paths that don't require authentication
  const publicPaths = ["/", "/login", "/signup", "/forgot-password", "/auth/callback"];
  if (publicPaths.includes(path) || path.startsWith("/auth/")) {
    return NextResponse.next();
  }

  // Create Supabase client with request cookies using the helper function
  const supabase = createMiddlewareClient(req);

  // Check if user is authenticated
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  // If no user or error, redirect to login
  if (error || !user) {
    // Don't redirect if we're already on login page to avoid loops
    if (path !== "/login") {
      const loginUrl = new URL("/login", req.url);
      loginUrl.searchParams.set("redirect", path);
      return NextResponse.redirect(loginUrl);
    }
    // If already on login, allow through
    return NextResponse.next();
  }

  // ========== CALCULATOR ACCESS RULES ==========
  // Rules:
  // 1. If user has active subscription → allow
  // 2. If user has trials left → allow
  // 3. Otherwise → redirect to /subscribe
  if (path.startsWith("/calculator")) {
    try {
      const hasSubscription = await isUserSubscribed(user.id, supabase);

      // Read trial count from cookies if available
      const trialCookie = req.cookies.get("trial_count");
      const trialsLeft = trialCookie ? Number(trialCookie.value) : 20; // default trial = 20 for testing

      if (hasSubscription || trialsLeft > 0) {
        return NextResponse.next();
      }

      return NextResponse.redirect(new URL("/subscribe", req.url));
    } catch (error) {
      // If subscription check fails, allow through to let the page handle it
      console.error("Error checking subscription in middleware:", error);
      return NextResponse.next();
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/dashboard/:path*", "/calculator/:path*", "/subscribe/:path*", "/profile/:path*"],
};
