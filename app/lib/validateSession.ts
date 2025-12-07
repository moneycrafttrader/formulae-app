import { NextRequest } from "next/server";
import { cookies } from "next/headers";
import { createServerClient } from "./supabaseServer";

/**
 * Validates session token for API routes
 * Checks both cookies and x-session-token header
 * Returns user and validated status
 */
export async function validateSession(
  request: NextRequest
): Promise<{ user: any; valid: boolean; error?: string }> {
  try {
    // Get Supabase client
    const supabase = await createServerClient();

    // Get user from Supabase session
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) {
      return { user: null, valid: false, error: "No Supabase session" };
    }

    // Get session token from multiple sources
    const cookieStore = await cookies();
    const cookieToken = cookieStore.get("session_token")?.value;
    const headerToken = request.headers.get("x-session-token");

    const sessionToken = cookieToken || headerToken;

    if (!sessionToken) {
      console.error("No session token found in cookies or headers");
      return { user: null, valid: false, error: "Missing session token" };
    }

    // Validate session token against profile
    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select("last_session_token, role")
      .eq("id", user.id)
      .single();

    if (profileError || !profile) {
      console.error("Profile not found:", profileError);
      return { user: null, valid: false, error: "Profile not found" };
    }

    // Check if session token matches
    if (profile.last_session_token !== sessionToken) {
      console.error("Session token mismatch", {
        userId: user.id,
        expected: profile.last_session_token,
        received: sessionToken,
      });
      return { user: null, valid: false, error: "Invalid session token" };
    }

    return { user, valid: true };
  } catch (error: any) {
    console.error("Session validation error:", error);
    return { user: null, valid: false, error: error.message };
  }
}
