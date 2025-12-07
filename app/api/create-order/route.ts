import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { createServerClient } from "@/app/lib/supabaseServer";

// Use require for razorpay (CommonJS module)
const Razorpay = require("razorpay");

// Validate environment variables
const RAZORPAY_KEY_ID = process.env.RAZORPAY_KEY_ID;
const RAZORPAY_KEY_SECRET = process.env.RAZORPAY_KEY_SECRET;

if (!RAZORPAY_KEY_ID || !RAZORPAY_KEY_SECRET) {
  console.error("❌ Missing Razorpay environment variables:");
  console.error("   - RAZORPAY_KEY_ID:", RAZORPAY_KEY_ID ? "✅ Set" : "❌ Missing");
  console.error("   - RAZORPAY_KEY_SECRET:", RAZORPAY_KEY_SECRET ? "✅ Set" : "❌ Missing");
  throw new Error("Missing Razorpay environment variables: RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET are required");
}

// Initialize Razorpay
const razorpay = new Razorpay({
  key_id: RAZORPAY_KEY_ID,
  key_secret: RAZORPAY_KEY_SECRET,
});

console.log("✅ Razorpay initialized:", {
  key_id: RAZORPAY_KEY_ID.substring(0, 10) + "...",
  isTestKey: RAZORPAY_KEY_ID.startsWith("rzp_test_"),
});

// Plan pricing configuration
const PLAN_PRICES: Record<string, number> = {
  "1m": 1, // ₹1 (test mode)
  "6m": 14999, // ₹14,999
  "12m": 24999, // ₹24,999
};

export async function POST(request: NextRequest) {
  try {
    console.log("📦 [create-order] Request received");

    // Check Supabase environment variables
    const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

    if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
      console.error("❌ [create-order] Missing Supabase environment variables:");
      console.error("   - NEXT_PUBLIC_SUPABASE_URL:", SUPABASE_URL ? "✅ Set" : "❌ Missing");
      console.error("   - NEXT_PUBLIC_SUPABASE_ANON_KEY:", SUPABASE_ANON_KEY ? "✅ Set" : "❌ Missing");
      return NextResponse.json(
        { error: "Server configuration error" },
        { status: 500 }
      );
    }

    // Get Supabase client with proper cookie handling
    // This reads cookies from Next.js cookies() API
    const supabase = await createServerClient();

    // Check for cookies
    const cookieStore = await cookies();
    const hasAccessToken = cookieStore.has("sb-access-token") || cookieStore.has("sb-" + SUPABASE_URL.split("//")[1]?.split(".")[0] + "-auth-token");
    console.log("🍪 [create-order] Cookie check:", {
      hasAccessToken,
      cookieNames: Array.from(cookieStore.getAll().map(c => c.name)),
    });

    // Authenticate user with Supabase session
    // This reads from cookies automatically via createServerClient
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError) {
      console.error("❌ [create-order] Authentication error:", {
        message: userError.message,
        status: userError.status,
        name: userError.name,
      });
      return NextResponse.json(
        { error: "Unauthorized", details: "Session verification failed" },
        { status: 401 }
      );
    }

    if (!user) {
      console.error("❌ [create-order] Missing session: No user found in Supabase session");
      console.error("   - Check if user is logged in");
      console.error("   - Check if cookies are being sent with request");
      return NextResponse.json(
        { error: "Unauthorized", details: "No authenticated user found" },
        { status: 401 }
      );
    }

    if (!user.id) {
      console.error("❌ [create-order] Invalid user ID: User object missing id field");
      return NextResponse.json(
        { error: "Unauthorized", details: "Invalid user ID" },
        { status: 401 }
      );
    }

    console.log("✅ [create-order] User authenticated:", {
      userId: user.id,
      email: user.email,
    });

    // Parse request body
    let body;
    try {
      body = await request.json();
    } catch (parseError) {
      console.error("❌ [create-order] Invalid request body:", parseError);
      return NextResponse.json(
        { error: "Invalid request body" },
        { status: 400 }
      );
    }

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

    console.log("💰 [create-order] Creating Razorpay order:", {
      plan,
      amount,
      amountInPaise,
      userId: user.id,
    });

    // Create Razorpay order with user_id in notes
    let razorpayOrder;
    try {
      razorpayOrder = await razorpay.orders.create({
        amount: amountInPaise,
        currency: "INR",
        receipt: `order_${Date.now()}_${plan}`,
        notes: {
          plan: plan,
          user_id: user.id, // Include user_id in notes for webhook
          duration: plan === "1m" ? "1 month" : plan === "6m" ? "6 months" : "12 months",
        },
      });
      console.log("✅ [create-order] Razorpay order created:", {
        orderId: razorpayOrder.id,
        amount: razorpayOrder.amount,
        status: razorpayOrder.status,
      });
    } catch (razorpayError: any) {
      console.error("❌ [create-order] Razorpay order creation failed:", {
        message: razorpayError.message,
        error: razorpayError.error,
        description: razorpayError.error?.description,
      });
      return NextResponse.json(
        { error: "Failed to create Razorpay order", details: razorpayError.message },
        { status: 500 }
      );
    }

    // Store order in Supabase payments table with user_id
    console.log("💾 [create-order] Storing payment record in database");
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
      console.error("❌ [create-order] Error storing payment in database:", {
        message: dbError.message,
        code: dbError.code,
        details: dbError.details,
        hint: dbError.hint,
      });
      // Note: Order is already created in Razorpay, but we'll still return it
      // In production, you might want to handle this differently
      // For now, we'll log the error but still return the order to the frontend
      console.warn("⚠️ [create-order] Returning Razorpay order despite database error");
    } else {
      console.log("✅ [create-order] Payment record stored:", {
        paymentId: paymentRecord?.id,
        orderId: razorpayOrder.id,
      });
    }

    // Return order details to frontend (only required fields)
    const response = {
      order_id: razorpayOrder.id,
      amount: razorpayOrder.amount,
      currency: razorpayOrder.currency,
    };

    console.log("✅ [create-order] Success:", {
      orderId: response.order_id,
      amount: response.amount,
      currency: response.currency,
    });

    return NextResponse.json(response);
  } catch (error: any) {
    console.error("❌ [create-order] Unexpected error:", {
      message: error.message,
      stack: error.stack,
      name: error.name,
    });
    return NextResponse.json(
      { error: error.message || "Failed to create order" },
      { status: 500 }
    );
  }
}

