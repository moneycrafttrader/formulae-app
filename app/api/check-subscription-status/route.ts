import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@/app/lib/supabaseServer";
import { isSubscriptionActive } from "@/app/lib/subscription";

/**
 * API route to check if the current user has an active subscription
 * Used by client components to determine subscription status
 */
export async function GET(request: NextRequest) {
  try {
    const supabase = await createServerClient();
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    // If no user, return inactive without error (don't return 401 for public access)
    // This allows the home page to work even if cookies aren't fully set yet
    if (userError || !user) {
      return NextResponse.json({ active: false });
    }

    const active = await isSubscriptionActive(user.id);

    return NextResponse.json({ active });
  } catch (error: any) {
    console.error("Error checking subscription status:", error);
    // Return inactive instead of error to prevent breaking the UI
    return NextResponse.json({ active: false });
  }
}
