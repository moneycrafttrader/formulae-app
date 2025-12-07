import { NextRequest, NextResponse } from "next/server";
import { supabaseServiceRole } from "@/app/lib/supabaseServiceRole";
import { calculateEndDate } from "@/app/lib/subscription";
import crypto from "crypto";

/**
 * Razorpay Webhook Handler
 * 
 * Webhook URL: https://formulae-app.vercel.app/api/razorpay-webhook
 * 
 * This endpoint handles Razorpay webhook events, specifically "payment.captured".
 * When a payment is captured, it:
 * 1. Validates the webhook signature using RAZORPAY_WEBHOOK_SECRET
 * 2. Updates the payment record in the payments table
 * 3. Activates or extends the user's subscription in the subscriptions table
 * 
 * Always returns 200 status to prevent Razorpay retries, even on errors.
 * Uses service role key to bypass RLS for webhook operations.
 */

// Required for raw body access in Next.js App Router
export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  try {
    // 1️⃣ Read raw request body (required for Razorpay signature validation)
    const rawBody = await request.text();

    if (!rawBody) {
      console.error("Empty webhook request body");
      // Always return 200 to avoid Razorpay retries
      return NextResponse.json({ success: true });
    }

    // 2️⃣ Extract x-razorpay-signature header
    const signature = request.headers.get("x-razorpay-signature");

    if (!signature) {
      console.error("Missing x-razorpay-signature header");
      // Always return 200 to avoid Razorpay retries
      return NextResponse.json({ success: true });
    }

    // 3️⃣ Validate signature using HMAC SHA256
    const webhookSecret = process.env.RAZORPAY_WEBHOOK_SECRET;

    if (!webhookSecret) {
      console.error("RAZORPAY_WEBHOOK_SECRET is not configured");
      // Always return 200 to avoid Razorpay retries
      return NextResponse.json({ success: true });
    }

    // Generate expected signature
    const expectedSignature = crypto
      .createHmac("sha256", webhookSecret)
      .update(rawBody)
      .digest("hex");

    // Compare signatures using constant-time comparison
    const signatureBuffer = Buffer.from(signature, "hex");
    const expectedBuffer = Buffer.from(expectedSignature, "hex");

    if (signatureBuffer.length !== expectedBuffer.length) {
      console.error("Invalid Razorpay webhook signature (length mismatch)");
      // Always return 200 to avoid Razorpay retries
      return NextResponse.json({ success: true });
    }

    const isValidSignature = crypto.timingSafeEqual(
      signatureBuffer,
      expectedBuffer
    );

    if (!isValidSignature) {
      console.error("Invalid Razorpay webhook signature");
      // Always return 200 to avoid Razorpay retries
      return NextResponse.json({ success: true });
    }

    // 4️⃣ Decode the event
    let event: any;
    try {
      event = JSON.parse(rawBody);
    } catch (parseError) {
      console.error("Failed to parse webhook payload:", parseError);
      // Always return 200 to avoid Razorpay retries
      return NextResponse.json({ success: true });
    }

    // 5️⃣ Handle "payment.captured" event
    if (event.event === "payment.captured") {
      const payment = event.payload.payment.entity;

      // Extract payment details
      const paymentId = payment.id;
      const orderId = payment.order_id;
      const amount = payment.amount; // Amount in paise
      const userId = payment.notes?.user_id;
      const plan = payment.notes?.plan; // Should be "1m", "6m", or "12m"
      
      // Extract payment signature if available (for payment verification signature)
      // Note: This is different from webhook signature
      const razorpaySignature = payment.signature || null;

      // Validate required fields
      if (!paymentId || !amount || !plan || !userId) {
        console.error("❌ Missing required payment fields:", {
          paymentId,
          amount,
          plan,
          userId,
          orderId,
        });
        // Always return 200 to avoid Razorpay retries
        return NextResponse.json({ success: true });
      }

      // Validate plan
      if (!["1m", "6m", "12m"].includes(plan)) {
        console.error("❌ Invalid plan:", plan);
        // Always return 200 to avoid Razorpay retries
        return NextResponse.json({ success: true });
      }

      // 6️⃣ Update payments table (using service role to bypass RLS)
      // Idempotent: If order_id not found or already updated, continue processing
      if (orderId) {
        // Check if payment already exists and is completed (idempotency check)
        const { data: existingPayment } = await supabaseServiceRole
          .from("payments")
          .select("id, status, razorpay_payment_id")
          .eq("razorpay_order_id", orderId)
          .maybeSingle();

        // Only update if not already completed (handle retries)
        if (existingPayment && existingPayment.status !== "completed") {
          const { error: paymentUpdateError } = await supabaseServiceRole
            .from("payments")
            .update({
              status: "completed",
              razorpay_payment_id: paymentId,
              razorpay_signature: razorpaySignature,
              updated_at: new Date().toISOString(),
            })
            .eq("razorpay_order_id", orderId);

          if (paymentUpdateError) {
            console.error("❌ Error updating payments table:", paymentUpdateError);
            // Continue processing even if payment update fails
          } else {
            console.log("✅ Payment updated:", { orderId, paymentId, status: "completed" });
          }
        } else if (!existingPayment) {
          console.warn("⚠️ Payment record not found for order_id:", orderId);
          // Continue processing - subscription will still be created
        } else {
          console.log("ℹ️ Payment already completed (webhook retry):", orderId);
        }
      }

      // 7️⃣ Handle subscription activation/extension
      // Idempotent: Uses upsert with unique constraint on user_id for active subscriptions
      try {
        const now = new Date();
        const startDate = now; // Always use NOW() as start_date for new subscriptions

        // Check if user already has an active subscription
        const { data: existingSubscription } = await supabaseServiceRole
          .from("subscriptions")
          .select("*")
          .eq("user_id", userId)
          .eq("status", "active")
          .maybeSingle();

        // Calculate end_date based on plan duration
        const planDays = plan === "1m" ? 30 : plan === "6m" ? 180 : 365;
        const endDate = calculateEndDate(plan as "1m" | "6m" | "12m", now);

        // If user has an active subscription that hasn't expired, extend it from current end_date
        if (existingSubscription && new Date(existingSubscription.end_date) > now) {
          // Extend existing subscription from current end_date
          const currentEndDate = new Date(existingSubscription.end_date);
          currentEndDate.setDate(currentEndDate.getDate() + planDays);

          const { error: subscriptionError } = await supabaseServiceRole
            .from("subscriptions")
            .update({
              plan: plan,
              end_date: currentEndDate.toISOString(),
              status: "active",
              updated_at: now.toISOString(),
            })
            .eq("id", existingSubscription.id);

          if (subscriptionError) {
            console.error("❌ Error extending subscription:", subscriptionError);
          } else {
            console.log("✅ Subscription extended via webhook:", {
              userId,
              plan,
              oldEndDate: existingSubscription.end_date,
              newEndDate: currentEndDate.toISOString(),
              daysAdded: planDays,
            });
          }
        } else {
          // Create new subscription or replace expired one
          // Upsert ensures only one active subscription per user (idempotent)
          const { error: subscriptionError } = await supabaseServiceRole
            .from("subscriptions")
            .upsert(
              {
                user_id: userId,
                plan: plan,
                start_date: startDate.toISOString(),
                end_date: endDate.toISOString(),
                status: "active",
                updated_at: now.toISOString(),
              },
              {
                onConflict: "user_id",
              }
            );

          if (subscriptionError) {
            console.error("❌ Error upserting subscription:", subscriptionError);
          } else {
            console.log("✅ Subscription created/updated via webhook:", {
              userId,
              plan,
              startDate: startDate.toISOString(),
              endDate: endDate.toISOString(),
              durationDays: planDays,
            });
          }
        }
      } catch (subscriptionError: any) {
        console.error("❌ Error processing subscription:", subscriptionError);
        // Continue - don't fail the webhook (idempotency)
      }

      console.log("✅ Webhook processed successfully:", {
        paymentId,
        orderId,
        plan,
        userId,
        amount,
        timestamp: new Date().toISOString(),
      });

      // Always return 200 to avoid Razorpay retries
      return NextResponse.json({ success: true });
    }

    // Handle other event types (optional - log for debugging)
    console.log("Received webhook event (not payment.captured):", event.event);

    // Return success for other events (Razorpay expects 200 response)
    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("Error processing Razorpay webhook:", error);
    // Always return 200 to avoid Razorpay retries
    return NextResponse.json({ success: true });
  }
}
