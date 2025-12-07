"use client";

import Link from "next/link";
import { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import PageContainer from "@/app/components/PageContainer";
import Card from "@/app/components/Card";
import Button from "@/app/components/Button";
import SectionTitle from "@/app/components/SectionTitle";
import { supabaseBrowser } from "@/app/lib/supabaseBrowser";
import { clearSessionToken, setSessionToken } from "@/app/hooks/useSessionToken";

interface UserProfile {
  id: string;
  email: string;
  role: string;
}

interface SubscriptionData {
  plan: string;
  start_date: string;
  end_date: string;
  status: string;
}

function DashboardContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [user, setUser] = useState<UserProfile | null>(null);
  const [subscription, setSubscription] = useState<SubscriptionData | null>(null);
  const [loading, setLoading] = useState(true);
  const [logoutLoading, setLogoutLoading] = useState(false);

  useEffect(() => {
    // Handle session token from auth callback
    const sessionToken = searchParams.get("session_token");
    if (sessionToken) {
      // Store session token in localStorage
      setSessionToken(sessionToken);
      // Also set cookie for middleware access
      document.cookie = `session_token=${sessionToken}; path=/; max-age=86400; SameSite=Lax`;
      // Remove session_token from URL without page reload
      const newUrl = new URL(window.location.href);
      newUrl.searchParams.delete("session_token");
      window.history.replaceState({}, "", newUrl.toString());
    }
  }, [searchParams]);

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
        .select("plan, start_date, end_date, status")
        .eq("user_id", authUser.id)
        .eq("status", "active")
        .maybeSingle();

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
  const now = new Date();
  const subscriptionEndDate = subscription
    ? new Date(subscription.end_date)
    : null;
  const subscriptionStartDate = subscription
    ? new Date(subscription.start_date)
    : null;
  const isExpired = subscription && subscriptionEndDate && subscriptionEndDate <= now;

  // Format plan name
  const getPlanName = (plan: string) => {
    if (plan === "1m") return "1 Month";
    if (plan === "6m") return "6 Months";
    if (plan === "12m") return "1 Year";
    return plan;
  };

  // Format date as DD MMM YYYY
  const formatDate = (date: Date) => {
    return date.toLocaleDateString("en-GB", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  };

  return (
    <PageContainer maxWidth="7xl">
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
        <div className="space-y-4">
          {isSubscribed && !isExpired ? (
            <>
              <div>
                <h2 className="text-xl font-semibold text-white">
                  ⭐ Active Subscription
                </h2>
                <div className="text-gray-300 mt-3 space-y-2">
                  <p>
                    <span className="font-medium text-white">Active Plan:</span>{" "}
                    <span className="text-[#00ff88]">
                      {getPlanName(subscription.plan)}
                    </span>
                  </p>
                  <p>
                    <span className="font-medium text-white">Started on:</span>{" "}
                    {subscriptionStartDate ? formatDate(subscriptionStartDate) : "N/A"}
                  </p>
                  <p>
                    <span className="font-medium text-white">Valid until:</span>{" "}
                    <span className="font-bold text-[#00ff88]">
                      {subscriptionEndDate ? formatDate(subscriptionEndDate) : "N/A"}
                    </span>
                  </p>
                </div>
              </div>
            </>
          ) : isSubscribed && isExpired ? (
            <>
              <div>
                <h2 className="text-xl font-semibold text-red-400">
                  ⚠️ Subscription Expired
                </h2>
                <p className="text-gray-300 mt-2">
                  Your subscription expired on{" "}
                  <span className="font-bold text-red-400">
                    {subscriptionEndDate ? formatDate(subscriptionEndDate) : "N/A"}
                  </span>
                  . Please renew to continue using the calculator.
                </p>
              </div>
              <div>
                <Button variant="primary" href="/subscribe" className="mt-4">
                  Renew Subscription →
                </Button>
              </div>
            </>
          ) : (
            <>
              <div>
                <h2 className="text-xl font-semibold text-white">
                  No Active Subscription
                </h2>
                <p className="text-gray-300 mt-2">
                  No active subscription. Start a plan to unlock calculator.
                </p>
              </div>
              <div>
                <Button variant="primary" href="/subscribe" className="mt-4">
                  Subscribe Now →
                </Button>
              </div>
            </>
          )}
        </div>
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

export default function DashboardPage() {
  return (
    <Suspense fallback={
      <PageContainer>
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="text-white">Loading...</div>
        </div>
      </PageContainer>
    }>
      <DashboardContent />
    </Suspense>
  );
}