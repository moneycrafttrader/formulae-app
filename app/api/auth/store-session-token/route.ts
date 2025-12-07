import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@/app/lib/supabaseServer";
import { storeSessionToken } from "@/app/lib/sessionToken";

/**
 * POST /api/auth/store-session-token
 * Stores session token in profiles and device_lock tables
 */
export async function POST(request: NextRequest) {
  try {
    // Get authenticated user
    const supabase = await createServerClient();
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { session_token } = body;

    if (!session_token) {
      return NextResponse.json(
        { error: "Session token is required" },
        { status: 400 }
      );
    }

    // Store session token in both profiles and device_lock
    const result = await storeSessionToken(user.id, session_token);

    if (!result.success) {
      return NextResponse.json(
        { error: result.error || "Failed to store session token" },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("Error storing session token:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
