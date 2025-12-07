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
      try {
        await clearSessionToken(user.id);
      } catch (tokenError) {
        console.error("Error clearing session token:", tokenError);
        // Continue with logout even if token clearing fails
      }
    }

    // Sign out from Supabase
    try {
      await supabase.auth.signOut();
    } catch (signOutError) {
      console.error("Error signing out from Supabase:", signOutError);
      // Continue with cookie clearing even if signOut fails
    }

    // Create response and clear all cookies
    const response = NextResponse.json({ success: true });
    
    // Clear session_token cookie
    response.cookies.set("session_token", "", {
      path: "/",
      expires: new Date(0),
      httpOnly: false,
      secure: request.url.startsWith("https://"),
      sameSite: "lax",
    });

    // Clear Supabase auth cookies
    response.cookies.set("sb-access-token", "", {
      path: "/",
      expires: new Date(0),
      httpOnly: false,
      secure: request.url.startsWith("https://"),
      sameSite: "lax",
    });

    response.cookies.set("sb-refresh-token", "", {
      path: "/",
      expires: new Date(0),
      httpOnly: false,
      secure: request.url.startsWith("https://"),
      sameSite: "lax",
    });

    // Clear Supabase project-specific cookies
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
    if (supabaseUrl) {
      const projectRef = supabaseUrl.split("//")[1]?.split(".")[0];
      if (projectRef) {
        response.cookies.set(`sb-${projectRef}-auth-token`, "", {
          path: "/",
          expires: new Date(0),
          httpOnly: false,
          secure: request.url.startsWith("https://"),
          sameSite: "lax",
        });
      }
    }

    return response;
  } catch (error: any) {
    console.error("Logout error:", error);
    // Always return success to allow client-side cleanup
    const response = NextResponse.json({ success: true });
    // Still try to clear cookies even on error
    response.cookies.delete("session_token");
    response.cookies.delete("sb-access-token");
    response.cookies.delete("sb-refresh-token");
    return response;
  }
}
