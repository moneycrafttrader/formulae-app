import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/app/lib/supabase";
import crypto from "crypto";

// Required for raw body access in Next.js App Router
export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  try {
    // 1️⃣ Read raw request body (required for Razorpay signature validation)
    const rawBody = await request.text();

    if (!rawBody) {
      return NextResponse.json(
        { success: false, message: "Empty request body" },
        { status: 400 }
      );
    }

    // 2️⃣ Extract x-razorpay-signature header
    const signature = request.headers.get("x-razorpay-signature");

    if (!signature) {
      return NextResponse.json(
        { success: false, message: "Missing x-razorpay-signature header" },
        { status: 400 }
      );
    }

    // 3️⃣ Validate signature using HMAC SHA256
    const webhookSecret = process.env.RAZORPAY_WEBHOOK_SECRET;

    if (!webhookSecret) {
      console.error("RAZORPAY_WEBHOOK_SECRET is not configured");
      return NextResponse.json(
        { success: false, message: "Webhook secret not configured" },
        { status: 500 }
      );
    }

    // Generate expected signature
    const expectedSignature = crypto
      .createHmac("sha256", webhookSecret)
      .update(rawBody)
      .digest("hex");

    // Compare signatures using constant-time comparison
    // timingSafeEqual requires buffers of the same length
    const signatureBuffer = Buffer.from(signature, "hex");
    const expectedBuffer = Buffer.from(expectedSignature, "hex");

    if (signatureBuffer.length !== expectedBuffer.length) {
      console.error("Invalid Razorpay webhook signature (length mismatch)");
      return NextResponse.json(
        { success: false, message: "Invalid signature" },
        { status: 400 }
      );
    }

    const isValidSignature = crypto.timingSafeEqual(
      signatureBuffer,
      expectedBuffer
    );

    if (!isValidSignature) {
      console.error("Invalid Razorpay webhook signature");
      return NextResponse.json(
        { success: false, message: "Invalid signature" },
        { status: 400 }
      );
    }

    // 4️⃣ Decode the event
    let event: any;
    try {
      event = JSON.parse(rawBody);
    } catch (parseError) {
      console.error("Failed to parse webhook payload:", parseError);
      return NextResponse.json(
        { success: false, message: "Invalid JSON payload" },
        { status: 400 }
      );
    }

    // 5️⃣ Handle "payment.captured" event
    if (event.event === "payment.captured") {
      const payment = event.payload.payment.entity;

      // Extract payment details
      const paymentId = payment.id;
      const amount = payment.amount; // Amount in paise
      const userId = payment.notes?.user_id;
      const plan = payment.notes?.plan; // Should be "1m", "6m", or "12m"

      if (!paymentId || !amount || !plan) {
        console.error("Missing required payment fields:", {
          paymentId,
          amount,
          plan,
        });
        return NextResponse.json(
          { success: false, message: "Missing required payment fields" },
          { status: 400 }
        );
      }

      // Validate plan
      if (!["1m", "6m", "12m"].includes(plan)) {
        console.error("Invalid plan:", plan);
        return NextResponse.json(
          { success: false, message: "Invalid plan" },
          { status: 400 }
        );
      }

      // 6️⃣ Update payments table
      // Try to match by payment_id first, then by order_id if payment_id not set yet
      const orderId = payment.order_id;

      let paymentUpdateError;
      
      if (orderId) {
        // Update by order_id (more reliable since order is created before payment)
        const { error } = await supabase
          .from("payments")
          .update({
            status: "completed",
            razorpay_payment_id: paymentId,
            updated_at: new Date().toISOString(),
          })
          .eq("razorpay_order_id", orderId);

        paymentUpdateError = error;
      } else {
        // Fallback: try to update by payment_id
        const { error } = await supabase
          .from("payments")
          .update({
            status: "completed",
            razorpay_payment_id: paymentId,
            updated_at: new Date().toISOString(),
          })
          .eq("razorpay_payment_id", paymentId);

        paymentUpdateError = error;
      }

      if (paymentUpdateError) {
        console.error("Error updating payments table:", paymentUpdateError);
        // Continue processing even if payment update fails (might be a duplicate webhook)
      }

      // 7️⃣ Update subscriptions table
      // Calculate end_date based on plan
      const startDate = new Date();
      const endDate = new Date();

      // Set end_date based on plan duration
      if (plan === "1m") {
        endDate.setDate(endDate.getDate() + 30);
      } else if (plan === "6m") {
        endDate.setDate(endDate.getDate() + 180);
      } else if (plan === "12m") {
        endDate.setDate(endDate.getDate() + 365);
      }

      // Update or insert subscription
      // If user_id is provided, use it; otherwise, we'll need to handle it differently
      const subscriptionData: any = {
        status: "active",
        start_date: startDate.toISOString(),
        end_date: endDate.toISOString(),
        plan: plan,
        payment_id: paymentId,
        updated_at: new Date().toISOString(),
      };

      // If user_id exists, add it to the subscription
      if (userId) {
        subscriptionData.user_id = userId;
      }

      // Try to update existing subscription for user, or insert new one
      if (userId) {
        // Update existing subscription or insert if doesn't exist
        const { error: subscriptionError } = await supabase
          .from("subscriptions")
          .upsert(
            {
              user_id: userId,
              ...subscriptionData,
            },
            {
              onConflict: "user_id",
            }
          );

        if (subscriptionError) {
          console.error("Error updating subscriptions table:", subscriptionError);
          // Log but don't fail - payment is already captured
        }
      } else {
        // If no user_id, insert subscription without user_id (might be anonymous payment)
        const { error: subscriptionError } = await supabase
          .from("subscriptions")
          .insert(subscriptionData);

        if (subscriptionError) {
          console.error("Error inserting subscription:", subscriptionError);
          // Log but don't fail - payment is already captured
        }
      }

      console.log("Payment captured successfully:", {
        paymentId,
        plan,
        userId,
        amount,
      });

      // Return success response
      return NextResponse.json({ success: true });
    }

    // Handle other event types (optional - log for debugging)
    console.log("Received webhook event (not payment.captured):", event.event);

    // Return success for other events (Razorpay expects 200 response)
    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("Error processing Razorpay webhook:", error);
    return NextResponse.json(
      { success: false, message: error.message || "Internal server error" },
      { status: 500 }
    );
  }
}
