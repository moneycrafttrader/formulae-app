import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@/app/lib/supabaseServer";
import { randomUUID } from "crypto";

/**
 * GET /auth/callback
 * Handles Supabase auth callback after email verification
 * Sets session, generates session token, and redirects to dashboard
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

    // Create Supabase client
    const supabase = await createServerClient();

    // Set session using tokens from query params
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

    // Update profile with session token
    const { error: profileError } = await supabase
      .from("profiles")
      .upsert(
        {
          id: data.user.id,
          email: data.user.email!,
          role: "user",
          last_session_token: sessionToken,
          updated_at: new Date().toISOString(),
        },
        {
          onConflict: "id",
        }
      );

    if (profileError) {
      console.error("Error updating profile with session token:", profileError);
      // Continue anyway - user is authenticated, token update can happen later
    }

    // Redirect to dashboard with session token in query param
    // Client-side code will read it and store in localStorage
    const dashboardUrl = new URL("/dashboard", req.url);
    dashboardUrl.searchParams.set("session_token", sessionToken);

    return NextResponse.redirect(dashboardUrl);
  } catch (error: any) {
    console.error("Auth callback error:", error);
    const loginUrl = new URL("/login", req.url);
    return NextResponse.redirect(loginUrl);
  }
}

