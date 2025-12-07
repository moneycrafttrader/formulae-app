import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@/app/lib/supabaseServer";
import { getActiveSubscription } from "@/app/lib/subscription";

/**
 * GET /api/subscription/details
 * Returns active subscription details including end_date, plan, and remaining days
 * Used by dashboard and subscription pages
 */
export async function GET(request: NextRequest) {
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

    // Get active subscription using utility function
    const subscription = await getActiveSubscription(user.id);

    if (!subscription) {
      return NextResponse.json({
        active: false,
        subscription: null,
        remainingDays: 0,
      });
    }

    // Calculate remaining days
    const endDate = new Date(subscription.end_date);
    const now = new Date();
    const remainingDays = Math.max(0, Math.ceil((endDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)));

    return NextResponse.json({
      active: true,
      subscription: {
        id: subscription.id,
        plan: subscription.plan,
        startDate: subscription.start_date,
        endDate: subscription.end_date,
        status: subscription.status,
      },
      remainingDays,
    });
  } catch (error: any) {
    console.error("Error fetching subscription details:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
