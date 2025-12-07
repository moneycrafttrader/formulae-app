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

    if (userError || !user) {
      return NextResponse.json(
        { active: false, error: "Not authenticated" },
        { status: 401 }
      );
    }

    const active = await isSubscriptionActive(user.id);

    return NextResponse.json({ active });
  } catch (error: any) {
    console.error("Error checking subscription status:", error);
    return NextResponse.json(
      { active: false, error: error.message },
      { status: 500 }
    );
  }
}
