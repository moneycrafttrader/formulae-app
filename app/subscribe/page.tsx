"use client";

import Script from "next/script";
import { useSubscription } from "@/app/hooks/useSubscription";
import { useState } from "react";
import PageContainer from "@/app/components/PageContainer";
import Card from "@/app/components/Card";
import Button from "@/app/components/Button";
import SectionTitle from "@/app/components/SectionTitle";

// Allow Razorpay to exist on window object
declare global {
  interface Window {
    Razorpay: any;
  }
}

export default function SubscribePage() {
  const { subscription, loading, refresh } = useSubscription();
  const [processing, setProcessing] = useState<string | null>(null);

  async function startPayment(plan: string) {
    setProcessing(plan);

    const res = await fetch("/api/create-order", {
      method: "POST",
      body: JSON.stringify({ plan }),
    });

    if (res.status !== 200) {
      alert("Error creating Razorpay order.");
      setProcessing(null);
      return;
    }

    const order = await res.json();

    const options = {
      key: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID!,
      amount: order.amount,
      currency: "INR",
      name: "Magic Formulae",
      description: "Subscription Plan",
      order_id: order.id,
      handler: function () {
        setProcessing(null);
        setTimeout(refresh, 2000);
      },
      prefill: {},
      theme: { color: "#00ff88" },
    };

    const rzp = new (window as any).Razorpay(options);
    rzp.on("payment.failed", function () {
      setProcessing(null);
      alert("Payment failed. Please try again.");
    });
    rzp.open();
  }

  // Format date
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-GB", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  };

  // Plan configuration
  const plans = [
    {
      id: "1m",
      name: "1 Month",
      price: 2999,
      duration: "30 days",
      description: "Perfect for trying out our platform",
    },
    {
      id: "6m",
      name: "6 Months",
      price: 14999,
      duration: "180 days",
      description: "Best value for regular users",
      popular: true,
    },
    {
      id: "12m",
      name: "12 Months",
      price: 24999,
      duration: "365 days",
      description: "Maximum savings for long-term users",
    },
  ];

  return (
    <>
      <Script src="https://checkout.razorpay.com/v1/checkout.js" />

      <PageContainer maxWidth="6xl">
        <SectionTitle
          align="center"
          title="Choose Your Subscription Plan"
          description="Select the plan that works best for you"
          className="mb-8"
        />

        {/* Active Subscription Card */}
        {loading ? (
          <div className="text-center py-8">
            <p className="text-gray-400">Loading subscription…</p>
          </div>
        ) : subscription ? (
          <Card variant="light" className="mb-8 max-w-2xl mx-auto">
            <div className="text-center">
              <h2 className="text-2xl font-bold text-[#00ff88] mb-2">
                ⭐ Active Subscription
              </h2>
              <div className="space-y-2 mt-4">
                <p className="text-lg">
                  <span className="text-gray-400">Plan:</span>{" "}
                  <span className="text-white font-semibold">
                    {subscription.plan === "1m"
                      ? "1 Month"
                      : subscription.plan === "6m"
                      ? "6 Months"
                      : "12 Months"}
                  </span>
                </p>
                <p className="text-lg">
                  <span className="text-gray-400">Expires on:</span>{" "}
                  <span className="text-white font-semibold">
                    {formatDate(subscription.end_date)}
                  </span>
                </p>
              </div>
            </div>
          </Card>
        ) : (
          <Card variant="light" className="mb-8 max-w-2xl mx-auto">
            <div className="text-center">
              <p className="text-gray-400">No active subscription.</p>
            </div>
          </Card>
        )}

        {/* Pricing Cards */}
        {!subscription && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-8">
            {plans.map((plan) => (
              <Card
                key={plan.id}
                variant={plan.popular ? "light" : "dark"}
                className={`relative ${plan.popular ? "ring-2 ring-[#00ff88]" : ""}`}
                interactive
              >
                {plan.popular && (
                  <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                    <span className="bg-[#00ff88] text-black px-4 py-1 rounded-full text-sm font-bold">
                      Most Popular
                    </span>
                  </div>
                )}
                <div className="text-center space-y-4">
                  <h3 className="text-xl font-bold text-white">{plan.name}</h3>
                  <div>
                    <span className="text-3xl font-bold text-[#00ff88]">₹{plan.price.toLocaleString()}</span>
                  </div>
                  <p className="text-gray-400 text-sm">{plan.duration}</p>
                  <p className="text-gray-300 text-sm min-h-[40px]">{plan.description}</p>
                  <Button
                    variant={plan.popular ? "primary" : "secondary"}
                    onClick={() => startPayment(plan.id)}
                    fullWidth
                    disabled={processing !== null}
                  >
                    {processing === plan.id ? "Processing…" : `Subscribe Now`}
                  </Button>
                </div>
              </Card>
            ))}
          </div>
        )}
      </PageContainer>
    </>
  );
}
