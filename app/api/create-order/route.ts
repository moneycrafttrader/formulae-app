import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@/app/lib/supabaseServer";

// Use require for razorpay (CommonJS module)
const Razorpay = require("razorpay");

// Validate Razorpay environment variables
if (!process.env.RAZORPAY_KEY_ID || !process.env.RAZORPAY_KEY_SECRET) {
  throw new Error("Missing Razorpay environment variables: RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET are required");
}

// Initialize Razorpay
const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_KEY_SECRET,
});

// Plan pricing configuration
const PLAN_PRICES: Record<string, number> = {
  "1m": 1, // ₹1 (test mode)
  "6m": 14999, // ₹14,999
  "12m": 24999, // ₹24,999
};

export async function POST(request: NextRequest) {
  try {
    // Get Supabase client
    const supabase = await createServerClient();

    // Authenticate user with Supabase session
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) {
      console.error("Authentication failed:", userError?.message || "No user found");
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    // Parse request body
    const body = await request.json();
    const { plan } = body;

    // Validate plan
    if (!plan || !["1m", "6m", "12m"].includes(plan)) {
      return NextResponse.json(
        { error: "Invalid plan. Must be '1m', '6m', or '12m'" },
        { status: 400 }
      );
    }

    // Calculate amount based on plan
    const amount = PLAN_PRICES[plan];
    if (!amount) {
      return NextResponse.json(
        { error: "Invalid plan pricing" },
        { status: 400 }
      );
    }

    // Convert to paise (Razorpay expects amount in smallest currency unit)
    const amountInPaise = amount * 100;

    // Create Razorpay order with user_id in notes
    const razorpayOrder = await razorpay.orders.create({
      amount: amountInPaise,
      currency: "INR",
      receipt: `order_${Date.now()}_${plan}`,
      notes: {
        plan: plan,
        user_id: user.id, // Include user_id in notes for webhook
        duration: plan === "1m" ? "1 month" : plan === "6m" ? "6 months" : "12 months",
      },
    });

    // Store order in Supabase payments table with user_id
    const { data: paymentRecord, error: dbError } = await supabase
      .from("payments")
      .insert({
        user_id: user.id,
        razorpay_order_id: razorpayOrder.id,
        plan: plan,
        amount: amount,
        currency: "INR",
        status: "pending",
        created_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (dbError) {
      console.error("Error storing payment in database:", dbError);
      // Note: Order is already created in Razorpay, but we'll still return it
      // In production, you might want to handle this differently
      return NextResponse.json(
        { error: "Failed to store payment record", details: dbError.message },
        { status: 500 }
      );
    }

    // Return order details to frontend (only required fields)
    return NextResponse.json({
      order_id: razorpayOrder.id,
      amount: razorpayOrder.amount,
      currency: razorpayOrder.currency,
    });
  } catch (error: any) {
    console.error("Error creating Razorpay order:", error);
    return NextResponse.json(
      { error: error.message || "Failed to create order" },
      { status: 500 }
    );
  }
}

