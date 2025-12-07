import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

export async function middleware(req: NextRequest) {
  const path = req.nextUrl.pathname;

  // Public paths that don't require authentication
  const publicPaths = ["/", "/login", "/signup", "/forgot-password", "/auth/callback"];
  if (publicPaths.includes(path) || path.startsWith("/auth/")) {
    return NextResponse.next();
  }

  // Create Supabase client with request cookies
  const supabase = createClient(supabaseUrl, supabaseAnonKey, {
    cookies: {
      get(name: string) {
        return req.cookies.get(name)?.value;
      },
      set() {
        // Can't set cookies in middleware
      },
      remove() {
        // Can't remove cookies in middleware
      },
    },
  });

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

  // Check subscription requirement for calculator
  if (path.startsWith("/calculator")) {
    try {
      const res = await fetch(`${req.nextUrl.origin}/api/subscription/details`, {
        headers: { 
          Cookie: req.headers.get("cookie") || "",
          "x-session-token": req.cookies.get("session_token")?.value || "",
        },
      });

      const data = await res.json();

      if (!data.subscription) {
        return NextResponse.redirect(new URL("/subscribe", req.url));
      }
    } catch (error) {
      // If subscription check fails, allow through to let the page handle it
      console.error("Error checking subscription in middleware:", error);
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/dashboard/:path*", "/calculator/:path*", "/subscribe/:path*", "/profile/:path*"],
};
