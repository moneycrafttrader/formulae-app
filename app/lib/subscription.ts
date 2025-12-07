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
 * Calculate end date based on plan duration
 * @param plan - Plan type ("1m", "6m", "12m")
 * @param startDate - Optional start date (defaults to now)
 * @returns Date object representing the end date
 */
export function calculateEndDate(
  plan: "1m" | "6m" | "12m",
  startDate: Date = new Date()
): Date {
  const endDate = new Date(startDate);
  if (plan === "1m") {
    endDate.setDate(endDate.getDate() + 30);
  } else if (plan === "6m") {
    endDate.setDate(endDate.getDate() + 180);
  } else if (plan === "12m") {
    endDate.setDate(endDate.getDate() + 365);
  }
  return endDate;
}

/**
 * Get user's active subscription
 * @param supabase - Supabase client
 * @param userId - User ID
 * @returns Subscription object or null
 */
export async function getUserSubscription(
  supabase: SupabaseClient,
  userId: string
): Promise<Subscription | null> {
  try {
    const { data, error } = await supabase
      .from("subscriptions")
      .select("*")
      .eq("user_id", userId)
      .eq("status", "active")
      .maybeSingle();

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

/**
 * Get active subscription for a user
 * Returns subscription if status = 'active' AND end_date > NOW()
 * @param userId - User ID
 * @returns Subscription object or null
 */
export async function getActiveSubscription(
  userId: string
): Promise<Subscription | null> {
  try {
    const supabase = await createServerClient();

    const { data, error } = await supabase
      .from("subscriptions")
      .select("*")
      .eq("user_id", userId)
      .eq("status", "active")
      .maybeSingle();

    if (error || !data) {
      return null;
    }

    // Check if subscription end date is in the future
    const endDate = new Date(data.end_date);
    const now = new Date();

    if (endDate <= now) {
      return null;
    }

    return data as Subscription;
  } catch (error) {
    console.error("Error fetching active subscription:", error);
    return null;
  }
}

/**
 * Check if a user has an active subscription
 * Returns true if status = 'active' AND end_date > NOW()
 * @param userId - User ID to check
 * @returns boolean indicating if subscription is active
 */
export async function isSubscriptionActive(
  userId: string
): Promise<boolean> {
  try {
    const subscription = await getActiveSubscription(userId);
    return subscription !== null;
  } catch (error) {
    console.error("Error checking subscription status:", error);
    return false;
  }
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
      .maybeSingle();

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
