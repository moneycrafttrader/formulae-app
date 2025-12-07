import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@/app/lib/supabaseServer";

export async function GET(req: NextRequest) {
  try {
    const supabase = await createServerClient();

    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    // If no user or error, return null subscription (don't return 401)
    // This allows the page to work even if cookies aren't fully set yet
    if (userError || !user) {
      return NextResponse.json({ subscription: null });
    }

    // Get active subscription
    const { data, error } = await supabase
      .from("subscriptions")
      .select("*")
      .eq("user_id", user.id)
      .eq("status", "active")
      .maybeSingle();

    // If error or no data, return null (not an error response)
    if (error || !data) {
      return NextResponse.json({ subscription: null });
    }

    // Check if subscription hasn't expired
    const endDate = new Date(data.end_date);
    const now = new Date();
    if (endDate <= now) {
      return NextResponse.json({ subscription: null });
    }

    return NextResponse.json({ subscription: data });
  } catch (error: any) {
    // Always return null instead of error to prevent breaking the UI
    console.error("Error fetching subscription details:", error);
    return NextResponse.json({ subscription: null });
  }
}
