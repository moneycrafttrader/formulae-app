"use client";

import { useEffect, useState } from "react";
import PageContainer from "@/app/components/PageContainer";
import Card from "@/app/components/Card";
import Button from "@/app/components/Button";
import SectionTitle from "@/app/components/SectionTitle";
import Link from "next/link";

// Allow Razorpay to exist on window object
declare global {
  interface Window {
    Razorpay: any;
  }
}

export default function SubscribePage() {
  const [loadingPlan, setLoadingPlan] = useState<string | null>(null);

  // Load Razorpay script
  useEffect(() => {
    const script = document.createElement("script");
    script.src = "https://checkout.razorpay.com/v1/checkout.js";
    script.async = true;
    document.body.appendChild(script);
  }, []);

  // **ONE PRODUCT — THREE DURATIONS**
  const plans = [
    {
      id: "1m",
      title: "1 Month Access",
      priceLabel: "₹2,999",
      amount: 2999,
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
    const res = await fetch("/api/create-order", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ plan: plan.id }),
    });

    const order = await res.json();
    if (!order?.id) {
      alert("Error creating Razorpay order.");
      setLoadingPlan(null);
      return;
    }

    // 2️⃣ Open Razorpay Checkout
    const options = {
      key: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID,
      currency: "INR",
      amount: order.amount,
      name: "Magic Formulae",
      description: plan.title,
      order_id: order.id,

      handler: async function (response: any) {
        // Verify payment on backend
        const verifyRes = await fetch("/api/verify-payment", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
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
          alert("Payment successful!");
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
          description="One premium plan — choose how long you want access to the Magic Formula."
        />

        {/* Pricing Cards */}
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

                {/* Subscribe Button */}
                <Button
                  variant="primary"
                  fullWidth
                  className="py-3"
                  disabled={loadingPlan === plan.id}
                  onClick={() => handleSubscribe(plan.id)}
                >
                  {loadingPlan === plan.id ? "Processing..." : "Subscribe Now"}
                </Button>
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
