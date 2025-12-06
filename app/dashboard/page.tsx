"use client";

import Link from "next/link";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import PageContainer from "@/app/components/PageContainer";
import Card from "@/app/components/Card";
import Button from "@/app/components/Button";
import SectionTitle from "@/app/components/SectionTitle";
import { supabaseBrowser } from "@/app/lib/supabaseBrowser";
import { clearSessionToken } from "@/app/hooks/useSessionToken";

interface UserProfile {
  id: string;
  email: string;
  role: string;
}

interface SubscriptionData {
  plan: string;
  end_date: string;
  status: string;
}

export default function DashboardPage() {
  const router = useRouter();
  const [user, setUser] = useState<UserProfile | null>(null);
  const [subscription, setSubscription] = useState<SubscriptionData | null>(null);
  const [loading, setLoading] = useState(true);
  const [logoutLoading, setLogoutLoading] = useState(false);

  useEffect(() => {
    loadUserData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const loadUserData = async () => {
    try {
      // Get current user
      const {
        data: { user: authUser },
        error: userError,
      } = await supabaseBrowser.auth.getUser();

      if (userError || !authUser) {
        router.push("/login");
        return;
      }

      // Get profile
      const { data: profile, error: profileError } = await supabaseBrowser
        .from("profiles")
        .select("id, email, role")
        .eq("id", authUser.id)
        .single();

      if (profileError || !profile) {
        router.push("/login");
        return;
      }

      setUser(profile);

      // Get subscription status (client-side check)
      const { data: subscriptionData } = await supabaseBrowser
        .from("subscriptions")
        .select("plan, end_date, status")
        .eq("user_id", authUser.id)
        .eq("status", "active")
        .single();

      if (subscriptionData) {
        const endDate = new Date(subscriptionData.end_date);
        const now = new Date();
        if (endDate > now) {
          setSubscription(subscriptionData as SubscriptionData);
        }
      }

      setLoading(false);
    } catch (error) {
      console.error("Error loading user data:", error);
      router.push("/login");
    }
  };

  const handleLogout = async () => {
    setLogoutLoading(true);
    try {
      // Clear session token
      clearSessionToken();

      // Call logout API
      await fetch("/api/auth/logout", {
        method: "POST",
      });

      // Sign out from Supabase
      await supabaseBrowser.auth.signOut();

      // Redirect to home
      router.push("/");
    } catch (error) {
      console.error("Logout error:", error);
      // Force redirect anyway
      router.push("/");
    }
  };

  if (loading) {
    return (
      <PageContainer>
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="text-white">Loading...</div>
        </div>
      </PageContainer>
    );
  }

  const isSubscribed = subscription !== null;
  const subscriptionEndDate = subscription
    ? new Date(subscription.end_date).toLocaleDateString()
    : null;

  return (
    <PageContainer>
      <SectionTitle
        title={
          <>
            <span className="text-white">
              Welcome, {user?.email?.split("@")[0] || "User"}{" "}
            </span>
            <span className="text-[#00ff88]">👋</span>
          </>
        }
        description="Your Formulae Dashboard"
        className="mb-8"
        size="md"
      />

      {/* Subscription Card */}
      <Card variant="light" className="mb-6">
        {isSubscribed ? (
          <>
            <h2 className="text-xl font-semibold text-white">
              ⭐ Active Subscription
            </h2>
            <p className="text-gray-300 mt-2">
              You have full access to all formulae until{" "}
              <span className="font-bold text-[#00ff88]">
                {subscriptionEndDate}
              </span>
              .
            </p>
          </>
        ) : (
          <>
            <h2 className="text-xl font-semibold text-white">🆓 Free Trial</h2>
            <p className="text-gray-300 mt-2">
              Upgrade to unlock unlimited formula calculations and premium
              features.
            </p>
            <Button variant="primary" href="/subscribe" className="mt-4">
              Upgrade Subscription →
            </Button>
          </>
        )}
      </Card>

      {/* Quick Navigation Buttons */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {/* Calculator */}
        <Button
          variant="primary"
          href="/calculator"
          fullWidth
          className="p-5 text-center"
        >
          Open Formula Calculator
        </Button>

        {/* Profile */}
        <Button
          variant="secondary"
          href="/profile"
          fullWidth
          className="p-5 text-center"
        >
          Profile Settings
        </Button>

        {/* Subscription */}
        <Button
          variant="purple"
          href="/subscribe"
          fullWidth
          className="p-5 text-center"
        >
          Subscription Details
        </Button>

        {/* Logout */}
        <Button
          variant="danger"
          onClick={handleLogout}
          fullWidth
          className="p-5 text-center"
          disabled={logoutLoading}
        >
          {logoutLoading ? "Logging out..." : "Logout"}
        </Button>
      </div>
    </PageContainer>
  );
}