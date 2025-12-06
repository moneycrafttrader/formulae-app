"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import PageContainer from "@/app/components/PageContainer";
import Card from "@/app/components/Card";
import Button from "@/app/components/Button";
import SectionTitle from "@/app/components/SectionTitle";
import { supabaseBrowser } from "@/app/lib/supabaseBrowser";

export default function Home() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const {
          data: { session },
        } = await supabaseBrowser.auth.getSession();
        setIsLoggedIn(!!session);
      } catch (error) {
        setIsLoggedIn(false);
      } finally {
        setLoading(false);
      }
    };

    checkAuth();

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabaseBrowser.auth.onAuthStateChange((_event, session) => {
      setIsLoggedIn(!!session);
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);
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
            <Button variant="primary" href="/calculator" fullWidth>
              Start Learning Today →
            </Button>
          </Card>

          <Card variant="light" className="text-left">
            <h2 className="text-xl font-semibold mb-2 text-white">👤 Dashboard</h2>
            <p className="text-gray-300 text-sm mb-4">
              Access your account dashboard, manage subscriptions, and track your usage.
            </p>
            <Button variant="outline" href="/dashboard" fullWidth>
              ► Watch Preview
            </Button>
          </Card>
        </div>

        {/* Navigation Links - Only show if not logged in */}
        {!loading && !isLoggedIn && (
          <div className="flex flex-wrap justify-center gap-4 pt-4">
            <Button variant="primary" href="/login">
              Login
            </Button>
            <Button variant="secondary" href="/signup">
              Sign Up
            </Button>
          </div>
        )}
        
        {/* Show dashboard link if logged in */}
        {!loading && isLoggedIn && (
          <div className="flex flex-wrap justify-center gap-4 pt-4">
            <Button variant="primary" href="/dashboard">
              Go to Dashboard →
            </Button>
          </div>
        )}
      </div>
    </PageContainer>
  );
}
