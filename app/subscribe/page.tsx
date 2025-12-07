"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import PageContainer from "@/app/components/PageContainer";
import Card from "@/app/components/Card";
import Button from "@/app/components/Button";
import SectionTitle from "@/app/components/SectionTitle";
import Link from "next/link";
import { supabaseBrowser } from "@/app/lib/supabaseBrowser";

// Allow Razorpay to exist on window object
declare global {
  interface Window {
    Razorpay: any;
  }
}

interface SubscriptionData {
  plan: string;
  start_date: string;
  end_date: string;
  status: string;
}

export default function SubscribePage() {
  const router = useRouter();
  const [loadingPlan, setLoadingPlan] = useState<string | null>(null);
  const [subscription, setSubscription] = useState<SubscriptionData | null>(null);
  const [loading, setLoading] = useState(true);

  // Load Razorpay script
  useEffect(() => {
    const script = document.createElement("script");
    script.src = "https://checkout.razorpay.com/v1/checkout.js";
    script.async = true;
    document.body.appendChild(script);
  }, []);

  // Load subscription status
  useEffect(() => {
    loadSubscription();
  }, []);

  const loadSubscription = async () => {
    try {
      const {
        data: { user },
      } = await supabaseBrowser.auth.getUser();

      if (!user) {
        router.push("/login");
        return;
      }

      // Get active subscription (status = 'active' and end_date > now)
      const { data: subscriptionData } = await supabaseBrowser
        .from("subscriptions")
        .select("plan, start_date, end_date, status")
        .eq("user_id", user.id)
        .eq("status", "active")
        .maybeSingle();

      if (subscriptionData) {
        const endDate = new Date(subscriptionData.end_date);
        const now = new Date();
        // Only set subscription if it hasn't expired
        if (endDate > now) {
          setSubscription(subscriptionData as SubscriptionData);
        }
      }

      setLoading(false);
    } catch (error) {
      console.error("Error loading subscription:", error);
      setLoading(false);
    }
  };

  // Format plan name
  const getPlanName = (plan: string) => {
    if (plan === "1m") return "1 Month";
    if (plan === "6m") return "6 Months";
    if (plan === "12m") return "1 Year";
    return plan;
  };

  // Format date as DD MMM YYYY
  const formatDate = (date: Date | string) => {
    const dateObj = typeof date === "string" ? new Date(date) : date;
    return dateObj.toLocaleDateString("en-GB", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  };

  // **ONE PRODUCT — THREE DURATIONS**
  const plans = [
    {
      id: "1m",
      title: "1 Month Access",
      priceLabel: "₹1",
      amount: 1,
      description: "Perfect to try out the Magic Formula for a short duration.",
      badges: [],
    },
    {
      id: "6m",
      title: "6 Months Access",
      priceLabel: "₹14,999",
      amount: 14999,
      description: "Popular choice — long-term access at a discounted price.",
      badges: ["Most Popular"],
    },
    {
      id: "12m",
      title: "1 Year Access",
      priceLabel: "₹24,999",
      amount: 24999,
      description: "Best value plan for serious traders.",
      badges: ["Best Value"],
    },
  ];

  // Handle Subscribe Button
  const handleSubscribe = async (planId: string) => {
    const plan = plans.find((p) => p.id === planId);
    if (!plan) return;

    setLoadingPlan(planId);

    // 1️⃣ Create order on backend
    const token = localStorage.getItem("session_token");
    const res = await fetch("/api/create-order", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-session-token": token ?? "",
      },
      body: JSON.stringify({ plan: plan.id }),
    });

    const order = await res.json();
    // Handle both order_id and id for compatibility
    const orderId = order?.order_id || order?.id;
    if (!orderId || !order?.amount) {
      alert("Error creating Razorpay order.");
      setLoadingPlan(null);
      return;
    }

    // 2️⃣ Open Razorpay Checkout
    const options = {
      key: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID,
      currency: order.currency || "INR",
      amount: order.amount,
      name: "Magic Formulae",
      description: plan.title,
      order_id: orderId,

      handler: async function (response: any) {
        // Verify payment on backend
        const token = localStorage.getItem("session_token");
        const verifyRes = await fetch("/api/verify-payment", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "x-session-token": token ?? "",
          },
          body: JSON.stringify({
            razorpay_order_id: response.razorpay_order_id,
            razorpay_payment_id: response.razorpay_payment_id,
            razorpay_signature: response.razorpay_signature,
          }),
        });

        const verification = await verifyRes.json();

        if (verification.verified) {
          localStorage.setItem("mct_subscription", "active");
          alert("Payment successful! Your subscription is now active.");
          // Reload page to show updated subscription
          window.location.href = "/dashboard";
        } else {
          alert("Payment verification failed. Please contact support.");
        }
      },

      theme: { color: "#00ff88" },
    };

    const razor = new window.Razorpay(options);
    razor.open();
    setLoadingPlan(null);
  };

  return (
    <PageContainer>
      <div className="max-w-6xl mx-auto space-y-12">
        {/* Header */}
        <SectionTitle
          align="center"
          size="lg"
          title={
            <>
              <span className="text-white">Choose Your </span>
              <span className="text-[#00ff88]">Subscription</span>
            </>
          }
          description={
            subscription
              ? "Manage your current subscription or extend your plan"
              : "One premium plan — choose how long you want access to the Magic Formula."
          }
        />

        {/* Subscription Info Card - Replace trial text */}
        {!loading && subscription && (
          <Card variant="light" className="mb-8">
            <div className="space-y-4">
              <h3 className="text-xl font-semibold text-white">
                ⭐ Active Subscription
              </h3>
              <div className="text-gray-300 space-y-2">
                <p>
                  <span className="font-medium text-white">Plan:</span>{" "}
                  <span className="text-[#00ff88] font-semibold">
                    {getPlanName(subscription.plan)}
                  </span>
                </p>
                <p>
                  <span className="font-medium text-white">Start Date:</span>{" "}
                  <span className="text-white">
                    {formatDate(subscription.start_date)}
                  </span>
                </p>
                <p>
                  <span className="font-medium text-white">End Date:</span>{" "}
                  <span className="text-[#00ff88] font-semibold">
                    {formatDate(subscription.end_date)}
                  </span>
                </p>
                <p>
                  <span className="font-medium text-white">Days Remaining:</span>{" "}
                  <span className="text-[#00ff88]">
                    {Math.ceil(
                      (new Date(subscription.end_date).getTime() -
                        new Date().getTime()) /
                        (1000 * 60 * 60 * 24)
                    )}{" "}
                    days
                  </span>
                </p>
              </div>
              <div className="pt-3">
                <Button variant="secondary" href="/dashboard" fullWidth>
                  Manage Subscription
                </Button>
              </div>
              <p className="text-sm text-gray-400 mt-4">
                Purchasing a new plan will extend your subscription from the current end date.
              </p>
            </div>
          </Card>
        )}

        {!loading && !subscription && (
          <Card variant="light" className="mb-8">
            <div className="space-y-3">
              <h3 className="text-lg font-semibold text-white">
                No Active Subscription
              </h3>
              <p className="text-gray-300">
                Buy a plan to continue and unlock access to the calculator.
              </p>
            </div>
          </Card>
        )}

        {/* Pricing Cards - Only show Subscribe buttons if no active subscription */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mt-8">
          {plans.map((plan) => (
            <Card
              key={plan.id}
              variant="light"
              className={`relative ${
                plan.badges.includes("Most Popular")
                  ? "ring-2 ring-[#00ff88] scale-105 shadow-lg shadow-[#00ff88]/20"
                  : ""
              }`}
            >
              {/* Badges */}
              {plan.badges.length > 0 && (
                <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                  <span className="bg-[#00ff88] text-black px-4 py-1 rounded-full text-sm font-semibold shadow-md">
                    {plan.badges[0]}
                  </span>
                </div>
              )}

              {/* Card Content */}
              <div className="space-y-6">
                <div>
                  <h2 className="text-2xl font-bold text-white">{plan.title}</h2>
                  <p className="text-gray-400 mt-1">{plan.description}</p>
                </div>

                <div>
                  <span className="text-4xl font-bold text-white">
                    {plan.priceLabel}
                  </span>
                </div>

                {/* Button - Show "Manage Subscription" if active subscription, otherwise "Subscribe Now" */}
                {subscription ? (
                  <Button
                    variant="secondary"
                    href="/dashboard"
                    fullWidth
                    className="py-3"
                  >
                    Manage Subscription
                  </Button>
                ) : (
                  <Button
                    variant="primary"
                    fullWidth
                    className="py-3"
                    disabled={loadingPlan === plan.id || loading}
                    onClick={() => handleSubscribe(plan.id)}
                  >
                    {loadingPlan === plan.id ? "Processing..." : "Subscribe Now"}
                  </Button>
                )}
              </div>
            </Card>
          ))}
        </div>

        {/* Back Link */}
        <div className="text-center pt-8">
          <Link
            href="/dashboard"
            className="text-[#00ff88] hover:text-[#00cc77] hover:underline font-medium"
          >
            ← Back to Dashboard
          </Link>
        </div>
      </div>
    </PageContainer>
  );
}
