import { NextRequest, NextResponse } from "next/server";
import Razorpay from "razorpay";
import crypto from "crypto";
import { createServerClient } from "@/app/lib/supabaseServer";
import { cookies } from "next/headers";

export const dynamic = "force-dynamic";

const PLAN_PRICES: Record<string, number> = {
  "1m": 2999,
  "6m": 14999,
  "12m": 24999,
};

export async function POST(req: NextRequest) {
  try {
    const supabase = await createServerClient();

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const { plan } = await req.json();

    if (!PLAN_PRICES[plan]) {
      return NextResponse.json(
        { error: "Invalid plan" },
        { status: 400 }
      );
    }

    const razorpay = new Razorpay({
      key_id: process.env.RAZORPAY_KEY_ID!,
      key_secret: process.env.RAZORPAY_KEY_SECRET!,
    });

    const order = await razorpay.orders.create({
      amount: PLAN_PRICES[plan] * 100, // convert to paise
      currency: "INR",
      receipt: `receipt_${Date.now()}`,
      notes: {
        user_id: user.id,
        plan: plan,
      },
    });

    // store in payments table
    await supabase.from("payments").insert({
      razorpay_order_id: order.id,
      plan,
      amount: PLAN_PRICES[plan],
      currency: "INR",
      status: "pending",
      user_id: user.id,
    });

    return NextResponse.json({
      id: order.id,
      amount: order.amount,
      currency: order.currency,
      plan,
    });
  } catch (err: any) {
    console.error("CREATE ORDER ERROR:", err);
    return NextResponse.json(
      { error: "Error creating Razorpay order" },
      { status: 500 }
    );
  }
}

