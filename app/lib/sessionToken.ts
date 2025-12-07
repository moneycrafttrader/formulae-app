import { supabaseServiceRole } from "./supabaseServiceRole";

/**
 * Store session token in both profiles and device_lock tables
 * @param userId - User ID
 * @param sessionToken - Session token to store
 */
export async function storeSessionToken(
  userId: string,
  sessionToken: string
): Promise<{ success: boolean; error?: string }> {
  try {
    // Store in profiles.last_session_token
    const { error: profileError } = await supabaseServiceRole
      .from("profiles")
      .update({
        last_session_token: sessionToken,
        updated_at: new Date().toISOString(),
      })
      .eq("id", userId);

    if (profileError) {
      console.error("Error updating profile session token:", profileError);
      return { success: false, error: profileError.message };
    }

    // Store in device_lock table (upsert - replace existing session for user)
    const { error: deviceLockError } = await supabaseServiceRole
      .from("device_lock")
      .upsert(
        {
          user_id: userId,
          session_token: sessionToken,
          created_at: new Date().toISOString(),
        },
        {
          onConflict: "user_id",
        }
      );

    if (deviceLockError) {
      console.error("Error updating device_lock:", deviceLockError);
      // Don't fail if device_lock update fails, profile update is more critical
    }

    return { success: true };
  } catch (error: any) {
    console.error("Error storing session token:", error);
    return { success: false, error: error.message };
  }
}

/**
 * Clear session token from profiles and device_lock tables
 * @param userId - User ID
 */
export async function clearSessionToken(
  userId: string
): Promise<{ success: boolean; error?: string }> {
  try {
    // Clear from profiles
    const { error: profileError } = await supabaseServiceRole
      .from("profiles")
      .update({
        last_session_token: null,
        updated_at: new Date().toISOString(),
      })
      .eq("id", userId);

    if (profileError) {
      console.error("Error clearing profile session token:", profileError);
    }

    // Remove from device_lock
    const { error: deviceLockError } = await supabaseServiceRole
      .from("device_lock")
      .delete()
      .eq("user_id", userId);

    if (deviceLockError) {
      console.error("Error removing from device_lock:", deviceLockError);
    }

    return { success: true };
  } catch (error: any) {
    console.error("Error clearing session token:", error);
    return { success: false, error: error.message };
  }
}
