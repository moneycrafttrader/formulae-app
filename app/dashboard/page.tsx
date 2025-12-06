"use client";

import Link from "next/link";
import { useState, useEffect } from "react";
import PageContainer from "@/app/components/PageContainer";
import Card from "@/app/components/Card";
import Button from "@/app/components/Button";
import SectionTitle from "@/app/components/SectionTitle";

export default function DashboardPage() {
  // These will later come from your backend
  const [userName, setUserName] = useState("Trader");
  const [trialUsed, setTrialUsed] = useState(1); // example: 1 out of 3 used
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [mounted, setMounted] = useState(false);

  // Example: Simulate fetching user info
  useEffect(() => {
    setMounted(true);
    // TODO: Replace with real backend call
    setUserName("Shubham");
  }, []);

  const remainingTrials = Math.max(0, 3 - trialUsed);

  return (
    <PageContainer>
      <SectionTitle
        title={
          <>
            <span className="text-white">Welcome, {mounted ? userName : "Trader"} </span>
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
            <h2 className="text-xl font-semibold text-white">⭐ Active Subscription</h2>
            <p className="text-gray-300 mt-2">
              You have full access to all formulae.
            </p>
          </>
        ) : (
          <>
            <h2 className="text-xl font-semibold text-white">🆓 Free Trial</h2>
            <p className="text-gray-300 mt-2">
              Remaining Formula Calculations:{" "}
              <span className="font-bold text-yellow-400">
                {remainingTrials}
              </span>{" "}
              / 3
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
          href="/subscription"
          fullWidth
          className="p-5 text-center"
        >
          Subscription Details
        </Button>

        {/* Logout */}
        <Button
          variant="danger"
          href="/logout"
          fullWidth
          className="p-5 text-center"
        >
          Logout
        </Button>
      </div>
    </PageContainer>
  );
}
