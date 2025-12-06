import { createServerClient } from "./supabaseServer";
import type { SupabaseClient } from "@supabase/supabase-js";

export interface Subscription {
  id: string;
  user_id: string;
  plan: "1m" | "6m" | "12m";
  start_date: string;
  end_date: string;
  status: "active" | "expired" | "cancelled";
  created_at: string;
  updated_at: string;
}

/**
 * Check if a user has an active subscription
 * Returns true if subscription exists and end_date > NOW()
 * @param userId - User ID to check
 * @param supabaseClient - Optional Supabase client (for middleware use)
 */
export async function isUserSubscribed(
  userId: string,
  supabaseClient?: SupabaseClient
): Promise<boolean> {
  try {
    const supabase =
      supabaseClient || (await createServerClient());

    const { data, error } = await supabase
      .from("subscriptions")
      .select("end_date, status")
      .eq("user_id", userId)
      .eq("status", "active")
      .single();

    if (error || !data) {
      return false;
    }

    // Check if subscription end date is in the future
    const endDate = new Date(data.end_date);
    const now = new Date();

    return endDate > now;
  } catch (error) {
    console.error("Error checking subscription:", error);
    return false;
  }
}

/**
 * Get user's active subscription details
 */
export async function getUserSubscription(
  userId: string
): Promise<Subscription | null> {
  try {
    const supabase = await createServerClient();

    const { data, error } = await supabase
      .from("subscriptions")
      .select("*")
      .eq("user_id", userId)
      .eq("status", "active")
      .single();

    if (error || !data) {
      return null;
    }

    // Check if subscription is still valid
    const endDate = new Date(data.end_date);
    const now = new Date();

    if (endDate <= now) {
      return null;
    }

    return data as Subscription;
  } catch (error) {
    console.error("Error fetching subscription:", error);
    return null;
  }
}
