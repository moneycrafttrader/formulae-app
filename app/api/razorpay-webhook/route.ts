import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";
import { createClient } from "@supabase/supabase-js";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// Calculate subscription end date
function addDays(start: Date, plan: string) {
  if (plan === "1m") return new Date(start.getTime() + 30 * 86400 * 1000);
  if (plan === "6m") return new Date(start.getTime() + 180 * 86400 * 1000);
  if (plan === "12m") return new Date(start.getTime() + 365 * 86400 * 1000);
  return start;
}

export async function POST(req: NextRequest) {
  const rawBody = await req.text();
  const signature = req.headers.get("x-razorpay-signature");

  const expected = crypto
    .createHmac("sha256", process.env.RAZORPAY_WEBHOOK_SECRET!)
    .update(rawBody)
    .digest("hex");

  if (expected !== signature) {
    console.error("Invalid webhook signature");
    return NextResponse.json({ status: "invalid-signature" }, { status: 400 });
  }

  const event = JSON.parse(rawBody);

  if (event.event !== "payment.captured") {
    return NextResponse.json({ received: true });
  }

  const payment = event.payload.payment.entity;
  const orderId = payment.order_id;
  const paymentId = payment.id;
  
  // Get user_id and plan from notes, or fallback to pending payment record
  let userId = payment.notes?.user_id;
  let plan = payment.notes?.plan;

  // Fallback: If notes are missing (common in test payments), fetch from pending payment
  if ((!userId || !plan) && orderId) {
    const { data: pendingPayment } = await supabaseAdmin
      .from("payments")
      .select("user_id, plan")
      .eq("razorpay_order_id", orderId)
      .eq("status", "pending")
      .single();

    if (pendingPayment) {
      userId = userId || pendingPayment.user_id;
      plan = plan || pendingPayment.plan;
    }
  }

  if (!userId || !plan || !orderId || !paymentId) {
    console.error("Missing required fields:", { userId, plan, orderId, paymentId });
    return NextResponse.json({ success: true }); // Always return 200
  }

  try {
    // update payment table
    await supabaseAdmin
      .from("payments")
      .update({
        razorpay_payment_id: paymentId,
        status: "completed",
      })
      .eq("razorpay_order_id", orderId);

    // deactivate existing active subscription
    await supabaseAdmin
      .from("subscriptions")
      .update({ status: "expired" })
      .eq("user_id", userId)
      .eq("status", "active");

    // create new subscription
    const startDate = new Date();
    const endDate = addDays(startDate, plan);

    await supabaseAdmin.from("subscriptions").insert({
      user_id: userId,
      plan,
      start_date: startDate.toISOString(),
      end_date: endDate.toISOString(),
      status: "active",
    });
  } catch (error) {
    console.error("Webhook processing error:", error);
    // Always return 200 even on error to prevent Razorpay retries
  }

  return NextResponse.json({ success: true });
}
