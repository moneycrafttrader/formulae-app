import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@/app/lib/supabaseServer";

/**
 * POST /api/auth/logout
 * Handles user logout
 * Clears Supabase session and invalidates session token
 */
export async function POST(request: NextRequest) {
  try {
    const supabase = await createServerClient();

    // Get current user
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (!userError && user) {
      // Invalidate session token in profile
      await supabase
        .from("profiles")
        .update({
          last_session_token: null,
          updated_at: new Date().toISOString(),
        })
        .eq("id", user.id);
    }

    // Sign out from Supabase
    await supabase.auth.signOut();

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("Logout error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
