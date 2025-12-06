import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@/app/lib/supabaseServer";
import { randomUUID } from "crypto";

/**
 * POST /api/auth/login
 * Handles user login with email/password
 * Generates session token and stores in profiles table
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email, password } = body;

    // Validate input
    if (!email || !password) {
      return NextResponse.json(
        { error: "Email and password are required" },
        { status: 400 }
      );
    }

    const supabase = await createServerClient();

    // Sign in with Supabase Auth
    const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
      email: email.trim().toLowerCase(),
      password,
    });

    if (authError || !authData.user) {
      return NextResponse.json(
        { error: "Invalid email or password" },
        { status: 401 }
      );
    }

    // Generate new session token
    const sessionToken = randomUUID();

    // Update or create profile with session token
    const { error: profileError } = await supabase
      .from("profiles")
      .upsert(
        {
          id: authData.user.id,
          email: authData.user.email!,
          role: "user", // Default role
          last_session_token: sessionToken,
          updated_at: new Date().toISOString(),
        },
        {
          onConflict: "id",
        }
      );

    if (profileError) {
      console.error("Error updating profile:", profileError);
      // Still return success, but log the error
      // User can login but token won't be tracked
    }

    // Return user data and session token
    return NextResponse.json({
      user: {
        id: authData.user.id,
        email: authData.user.email,
      },
      session_token: sessionToken,
    });
  } catch (error: any) {
    console.error("Login error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
