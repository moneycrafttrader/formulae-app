import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@/app/lib/supabaseServer";
import { randomUUID } from "crypto";
import { storeSessionToken } from "@/app/lib/sessionToken";
import { cookies } from "next/headers";

/**
 * GET /auth/callback
 * Handles Supabase auth callback after email verification
 * Sets session, generates session token, and redirects to dashboard
 * 
 * Works in both regular browsers and webviews by properly setting cookies
 */
export async function GET(req: NextRequest) {
  try {
    const url = new URL(req.url);
    const access_token = url.searchParams.get("access_token");
    const refresh_token = url.searchParams.get("refresh_token");

    // Validate access_token is present
    if (!access_token) {
      console.error("Auth callback: Missing access_token");
      const loginUrl = new URL("/login", req.url);
      return NextResponse.redirect(loginUrl);
    }

    // Create Supabase client (uses Next.js cookies() API for proper cookie handling)
    // This ensures Supabase auth cookies are set correctly
    const supabase = await createServerClient();

    // Set session using tokens from query params
    // This will automatically set Supabase auth cookies via the cookie handler in createServerClient
    const { data, error } = await supabase.auth.setSession({
      access_token,
      refresh_token: refresh_token || "",
    });

    if (error || !data.user) {
      console.error("Auth callback error:", error);
      const loginUrl = new URL("/login", req.url);
      return NextResponse.redirect(loginUrl);
    }

    // Generate session token for single-device login
    const sessionToken = randomUUID();

    // Store session token in both profiles and device_lock
    const storeResult = await storeSessionToken(data.user.id, sessionToken);

    if (!storeResult.success) {
      console.error("Error storing session token:", storeResult.error);
      // Continue anyway - user is authenticated, token update can happen later
    }

    // Get cookie store to set session_token cookie
    const cookieStore = await cookies();
    
    // Determine if we're in a secure context (HTTPS or production)
    const isSecure = req.url.startsWith("https://") || process.env.NODE_ENV === "production";
    const isLocalhost = req.url.includes("localhost") || req.url.includes("127.0.0.1");
    
    // Set session_token cookie (webview-compatible)
    // Use SameSite=Lax for same-site requests (works in most webviews)
    // For cross-site webviews on HTTPS, use SameSite=None with Secure
    cookieStore.set("session_token", sessionToken, {
      path: "/",
      maxAge: 60 * 60 * 24, // 24 hours
      httpOnly: false, // Allow client-side access for localStorage sync
      sameSite: (isSecure && !isLocalhost) ? "none" : "lax", // None for cross-site HTTPS, Lax for same-site/localhost
      secure: isSecure && !isLocalhost, // Secure only in production HTTPS
    });

    // Create redirect response
    const dashboardUrl = new URL("/dashboard", req.url);
    
    // Also set session token in query param as fallback for client-side
    // This helps in webviews where cookies might not work immediately
    dashboardUrl.searchParams.set("session_token", sessionToken);

    // Redirect to dashboard
    // The cookies() API has already set the cookies, and NextResponse.redirect will include them
    return NextResponse.redirect(dashboardUrl);
  } catch (error: any) {
    console.error("Auth callback error:", error);
    const loginUrl = new URL("/login", req.url);
    return NextResponse.redirect(loginUrl);
  }
}

// Required for route handlers in App Router
export const runtime = "nodejs";
export const dynamic = "force-dynamic";
