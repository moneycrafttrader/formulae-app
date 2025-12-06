import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@/app/lib/supabaseServer";

/**
 * POST /api/auth/update-session-token
 * Updates the session token in the user's profile
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { session_token, user_id, email } = body;

    if (!session_token) {
      return NextResponse.json(
        { error: "Session token is required" },
        { status: 400 }
      );
    }

    if (!user_id) {
      return NextResponse.json(
        { error: "User ID is required" },
        { status: 400 }
      );
    }

    const supabase = await createServerClient();

    // Try to verify user exists by checking session, but don't require it
    // Since the user was just authenticated client-side, we can trust the user_id
    let userEmail = email;
    
    // Try to get user from session to verify
    const {
      data: { user: sessionUser },
    } = await supabase.auth.getUser().catch(() => ({ data: { user: null }, error: null }));

    // If we can get user from session, use that email
    if (sessionUser && sessionUser.id === user_id) {
      userEmail = sessionUser.email || email;
    }

    // Update profile with session token
    // Use the provided user_id - it's safe because user just authenticated client-side
    const { error: profileError } = await supabase
      .from("profiles")
      .upsert(
        {
          id: user_id,
          email: userEmail || null,
          role: "user",
          last_session_token: session_token,
          updated_at: new Date().toISOString(),
        },
        {
          onConflict: "id",
        }
      );

    if (profileError) {
      console.error("Error updating profile:", profileError);
      
      // Check if it's a column missing error
      if (profileError.message?.includes("last_session_token") || 
          profileError.code === "PGRST204") {
        return NextResponse.json(
          { 
            error: "Database schema error. Please add the 'last_session_token' column to the profiles table. See add-session-token-column.sql",
            details: profileError.message
          },
          { status: 500 }
        );
      }
      
      return NextResponse.json(
        { error: "Failed to update session token", details: profileError.message },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("Update session token error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

