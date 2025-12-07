import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@/app/lib/supabaseServer";
import { clearSessionToken } from "@/app/lib/sessionToken";

/**
 * POST /api/auth/logout
 * Handles user logout
 * Clears Supabase session and invalidates session token from profiles and device_lock
 */
export async function POST(request: NextRequest) {
  try {
    const supabase = await createServerClient();

    // Try to get user from Supabase session
    const {
      data: { user },
    } = await supabase.auth.getUser();

    // Clear session token from profiles and device_lock
    if (user) {
      await clearSessionToken(user.id);
    }

    // Sign out from Supabase
    await supabase.auth.signOut();

    // Create response and clear cookies
    const response = NextResponse.json({ success: true });
    response.cookies.delete("session_token");
    response.cookies.delete("sb-access-token");
    response.cookies.delete("sb-refresh-token");

    return response;
  } catch (error: any) {
    console.error("Logout error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
