"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import PageContainer from "@/app/components/PageContainer";
import Card from "@/app/components/Card";
import Button from "@/app/components/Button";
import SectionTitle from "@/app/components/SectionTitle";
import { supabaseBrowser } from "@/app/lib/supabaseBrowser";
import { getApiUrl } from "@/app/lib/baseUrl";

export default function Home() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [hasActiveSubscription, setHasActiveSubscription] = useState(false);
  const [loading, setLoading] = useState(true);

  // Check auth and subscription status
  const checkAuthAndSubscription = async () => {
    try {
      const {
        data: { session },
      } = await supabaseBrowser.auth.getSession();
      const loggedIn = !!session;
      setIsLoggedIn(loggedIn);

      // If logged in, check subscription status
      if (loggedIn) {
        try {
          const response = await fetch(getApiUrl("/api/check-subscription-status"), {
            credentials: "include", // Ensure cookies are sent
          });
          if (response.ok) {
            const data = await response.json();
            setHasActiveSubscription(data.active || false);
          } else if (response.status === 401) {
            // If unauthorized, user might not be fully authenticated yet
            // Don't show error, just assume no subscription
            setHasActiveSubscription(false);
          }
        } catch (error) {
          console.error("Error checking subscription:", error);
          setHasActiveSubscription(false);
        }
      } else {
        setHasActiveSubscription(false);
      }
    } catch (error) {
      setIsLoggedIn(false);
      setHasActiveSubscription(false);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    checkAuthAndSubscription();

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabaseBrowser.auth.onAuthStateChange((_event, session) => {
      setIsLoggedIn(!!session);
      // Recheck subscription when auth state changes
      if (session) {
        checkAuthAndSubscription();
      } else {
        setHasActiveSubscription(false);
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  // Determine which CTA to show
  const renderCTA = () => {
    if (loading) {
      return null; // Don't show buttons while loading
    }

    // Not logged in → Show Login + Signup buttons
    if (!isLoggedIn) {
      return (
        <div className="flex flex-wrap justify-center gap-4 pt-4">
          <Button variant="primary" href="/login">
            Login
          </Button>
          <Button variant="secondary" href="/signup">
            Sign Up
          </Button>
        </div>
      );
    }

    // Logged in but not subscribed → Show Subscribe button
    if (!hasActiveSubscription) {
      return (
        <div className="flex flex-wrap justify-center gap-4 pt-4">
          <Button variant="primary" href="/subscribe">
            Subscribe Now →
          </Button>
        </div>
      );
    }

    // Subscribed → Show Calculator button
    return (
      <div className="flex flex-wrap justify-center gap-4 pt-4">
        <Button variant="primary" href="/calculator">
          Open Calculator →
        </Button>
      </div>
    );
  };

  return (
    <PageContainer centered maxWidth="3xl">
      <div className="w-full space-y-8 text-center">
        <SectionTitle
          align="center"
          eyebrow="Magic Formulae"
          title={
            <span className="text-5xl font-bold">
              <span className="text-white">Master the Art of </span>
              <span className="text-[#00ff88]">Stock Market Trading</span>
            </span>
          }
          description="Join thousands of successful traders who have transformed their financial future with our expert-led courses and proven strategies."
          className="space-y-3"
          size="lg"
        />

        {/* Feature Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-8">
          <Card variant="light" className="text-left">
            <h2 className="text-xl font-semibold mb-2 text-white">📊 Calculator</h2>
            <p className="text-gray-300 text-sm mb-4">
              Calculate pivot points, support, resistance, and more with our powerful formula calculator.
            </p>
            <Button 
              variant="primary" 
              href={
                !isLoggedIn 
                  ? "/login" 
                  : hasActiveSubscription 
                    ? "/calculator" 
                    : "/subscribe"
              } 
              fullWidth
            >
              {!isLoggedIn 
                ? "Get Started →" 
                : hasActiveSubscription 
                  ? "Calculate Magic Formulae →" 
                  : "Subscribe Now →"}
            </Button>
          </Card>

          <Card variant="light" className="text-left">
            <h2 className="text-xl font-semibold mb-2 text-white">👤 Dashboard</h2>
            <p className="text-gray-300 text-sm mb-4">
              Access your account dashboard, manage subscriptions, and track your usage.
            </p>
            <Button variant="outline" href="/dashboard" fullWidth>
              {isLoggedIn ? "Go to Dashboard →" : "► Watch Preview"}
            </Button>
          </Card>
        </div>

        {/* Dynamic CTA based on auth and subscription status */}
        {renderCTA()}
      </div>
    </PageContainer>
  );
}
