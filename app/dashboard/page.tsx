"use client";

import { useSubscription } from "@/app/hooks/useSubscription";
import PageContainer from "@/app/components/PageContainer";
import Card from "@/app/components/Card";
import Button from "@/app/components/Button";
import SectionTitle from "@/app/components/SectionTitle";
import { supabaseBrowser } from "@/app/lib/supabaseBrowser";
import { clearSessionToken } from "@/app/hooks/useSessionToken";

export default function Dashboard() {
  const { subscription } = useSubscription();

  const handleLogout = async () => {
    try {
      // Clear session token from localStorage first
      clearSessionToken();

      // Clear all cookies on client side
      document.cookie = "session_token=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT";
      document.cookie = "sb-access-token=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT";
      document.cookie = "sb-refresh-token=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT";
      
      // Clear Supabase cookies (they use the project ref)
      const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
      if (supabaseUrl) {
        const projectRef = supabaseUrl.split("//")[1]?.split(".")[0] || "supabase";
        document.cookie = `sb-${projectRef}-auth-token=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT`;
      }

      // Try to call logout API (non-blocking)
      try {
        await fetch("/api/auth/logout", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          credentials: "include",
        });
      } catch (apiError) {
        console.error("Logout API error:", apiError);
        // Continue with logout even if API call fails
      }

      // Sign out from Supabase (non-blocking)
      try {
        await supabaseBrowser.auth.signOut();
      } catch (signOutError) {
        console.error("Supabase signOut error:", signOutError);
        // Continue with logout even if signOut fails
      }

      // Force redirect using window.location to ensure clean state
      window.location.href = "/";
    } catch (error) {
      console.error("Logout error:", error);
      // Even on error, try to redirect to home
      window.location.href = "/";
    }
  };

  return (
    <PageContainer centered maxWidth="3xl">
      <div className="w-full space-y-6">
        <SectionTitle
          align="center"
          title="Dashboard"
          description="Manage your account and subscription"
        />

        {/* Subscription Details Card */}
        <Card variant="light" className="space-y-4">
          <h2 className="text-xl font-semibold text-white mb-4">Subscription Details</h2>
          {subscription ? (
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <span className="text-gray-300">Plan:</span>
                <span className="text-[#00ff88] font-semibold">{subscription.plan.toUpperCase()}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-300">Status:</span>
                <span className="text-green-400 font-semibold">Active</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-300">Expires:</span>
                <span className="text-white font-semibold">
                  {new Date(subscription.end_date).toLocaleDateString()}
                </span>
              </div>
            </div>
          ) : (
            <div className="text-center py-4">
              <p className="text-gray-300 mb-4">No active subscription</p>
              <Button variant="primary" href="/subscribe">
                Subscribe Now →
              </Button>
            </div>
          )}
        </Card>

        {/* Account Actions Card */}
        <Card variant="light" className="space-y-4">
          <h2 className="text-xl font-semibold text-white mb-4">Account Actions</h2>
          <div className="flex flex-col sm:flex-row gap-3">
            <Button variant="secondary" href="/profile" fullWidth className="sm:flex-1">
              Profile
            </Button>
            <Button variant="danger" onClick={handleLogout} fullWidth className="sm:flex-1">
              Logout
            </Button>
          </div>
        </Card>
      </div>
    </PageContainer>
  );
}
