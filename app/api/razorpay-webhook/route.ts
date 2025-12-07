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
      console.error("❌ [webhook] RAZORPAY_WEBHOOK_SECRET is not configured");
      // Always return 200 to avoid Razorpay retries
      return NextResponse.json({ success: true });
    }

    // Generate expected signature using crypto.createHmac
    const expectedSignature = crypto
      .createHmac("sha256", webhookSecret)
      .update(rawBody)
      .digest("hex");

    console.log("🔐 [webhook] Signature validation:", {
      receivedSignature: signature.substring(0, 20) + "...",
      expectedSignature: expectedSignature.substring(0, 20) + "...",
    });

    // Compare signatures using constant-time comparison
    const signatureBuffer = Buffer.from(signature, "hex");
    const expectedBuffer = Buffer.from(expectedSignature, "hex");

    if (signatureBuffer.length !== expectedBuffer.length) {
      console.error("❌ [webhook] Invalid Razorpay webhook signature (length mismatch):", {
        receivedLength: signatureBuffer.length,
        expectedLength: expectedBuffer.length,
      });
      // Always return 200 to avoid Razorpay retries
      return NextResponse.json({ success: true });
    }

    const isValidSignature = crypto.timingSafeEqual(
      signatureBuffer,
      expectedBuffer
    );

    if (!isValidSignature) {
      console.error("❌ [webhook] Invalid Razorpay webhook signature (mismatch)");
      // Always return 200 to avoid Razorpay retries
      return NextResponse.json({ success: true });
    }

    console.log("✅ [webhook] Signature validated successfully");

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
      const amountInRupees = amount / 100; // Convert paise to rupees
      
      // Try to get user_id and plan from payment notes (may be missing in test payments)
      let userId = payment.notes?.user_id;
      let plan = payment.notes?.plan; // Should be "1m", "6m", or "12m"
      
      // Extract payment signature if available (for payment verification signature)
      // Note: This is different from webhook signature
      const razorpaySignature = payment.signature || null;

      console.log("🔔 [webhook] Payment captured event:", {
        paymentId,
        orderId,
        amount: amountInRupees,
        userIdFromNotes: userId,
        planFromNotes: plan,
        hasNotes: !!payment.notes,
      });

      // Fallback: If notes are missing (common in test payments), fetch from pending payment record
      if ((!userId || !plan) && orderId) {
        console.log("⚠️ [webhook] Missing user_id or plan in notes, fetching from pending payment record...");
        
        const { data: pendingPayment, error: fetchError } = await supabaseServiceRole
          .from("payments")
          .select("user_id, plan, amount, currency")
          .eq("razorpay_order_id", orderId)
          .eq("status", "pending")
          .maybeSingle();

        if (fetchError) {
          console.error("❌ [webhook] Error fetching pending payment:", fetchError);
        } else if (pendingPayment) {
          userId = userId || pendingPayment.user_id;
          plan = plan || pendingPayment.plan;
          console.log("✅ [webhook] Retrieved from pending payment:", {
            userId,
            plan,
            amount: pendingPayment.amount,
          });
        } else {
          console.warn("⚠️ [webhook] No pending payment found for order_id:", orderId);
        }
      }

      // Validate required fields after fallback
      if (!paymentId || !amount || !plan || !userId) {
        console.error("❌ [webhook] Missing required payment fields after fallback:", {
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
        console.error("❌ [webhook] Invalid plan:", plan);
        // Always return 200 to avoid Razorpay retries
        return NextResponse.json({ success: true });
      }

      // 6️⃣ Update payments table fully (using service role to bypass RLS)
      // Idempotent: If order_id not found or already updated, continue processing
      if (orderId) {
        const now = new Date();
        
        // Check if payment already exists and is completed (idempotency check)
        const { data: existingPayment } = await supabaseServiceRole
          .from("payments")
          .select("id, status, razorpay_payment_id, user_id, plan, amount")
          .eq("razorpay_order_id", orderId)
          .maybeSingle();

        // Update payment record with all fields
        if (existingPayment) {
          // Only update if not already completed (handle retries/idempotency)
          if (existingPayment.status !== "completed") {
            const updateData: any = {
              status: "completed",
              razorpay_payment_id: paymentId,
              razorpay_signature: razorpaySignature,
              updated_at: now.toISOString(),
            };

            // Update amount if not already set (convert from paise to rupees)
            if (!existingPayment.amount) {
              updateData.amount = amountInRupees;
            }

            // Ensure user_id and plan are set (in case they were missing before)
            if (!existingPayment.user_id && userId) {
              updateData.user_id = userId;
            }
            if (!existingPayment.plan && plan) {
              updateData.plan = plan;
            }

            const { error: paymentUpdateError } = await supabaseServiceRole
              .from("payments")
              .update(updateData)
              .eq("razorpay_order_id", orderId);

            if (paymentUpdateError) {
              console.error("❌ [webhook] Error updating payments table:", paymentUpdateError);
              // Continue processing even if payment update fails
            } else {
              console.log("✅ [webhook] Payment record fully updated:", {
                orderId,
                paymentId,
                userId,
                plan,
                amount: amountInRupees,
                status: "completed",
              });
            }
          } else {
            console.log("ℹ️ [webhook] Payment already completed (webhook retry):", orderId);
          }
        } else {
          // Payment record not found - create it if we have all required data
          console.warn("⚠️ [webhook] Payment record not found for order_id, creating new record:", orderId);
          
          if (userId && plan) {
            const { error: createError } = await supabaseServiceRole
              .from("payments")
              .insert({
                user_id: userId,
                razorpay_order_id: orderId,
                razorpay_payment_id: paymentId,
                plan: plan,
                amount: amountInRupees,
                currency: "INR",
                status: "completed",
                razorpay_signature: razorpaySignature,
                created_at: now.toISOString(),
                updated_at: now.toISOString(),
              });

            if (createError) {
              console.error("❌ [webhook] Error creating payment record:", createError);
            } else {
              console.log("✅ [webhook] Payment record created:", { orderId, paymentId, userId, plan });
            }
          }
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

        // Calculate end_date based on plan duration using calculateEndDate utility
        const endDate = calculateEndDate(plan as "1m" | "6m" | "12m", now);
        const planDays = plan === "1m" ? 30 : plan === "6m" ? 180 : 365;

        console.log("📅 [webhook] Subscription calculation:", {
          userId,
          plan,
          startDate: startDate.toISOString(),
          endDate: endDate.toISOString(),
          planDays,
          hasExistingSubscription: !!existingSubscription,
          existingEndDate: existingSubscription?.end_date,
        });

        // If user has an active subscription that hasn't expired, extend it from current end_date
        if (existingSubscription && new Date(existingSubscription.end_date) > now) {
          // Extend existing subscription from current end_date
          const currentEndDate = new Date(existingSubscription.end_date);
          const newEndDate = new Date(currentEndDate);
          newEndDate.setDate(newEndDate.getDate() + planDays);

          const { error: subscriptionError } = await supabaseServiceRole
            .from("subscriptions")
            .update({
              plan: plan,
              end_date: newEndDate.toISOString(),
              status: "active",
              updated_at: now.toISOString(),
            })
            .eq("id", existingSubscription.id);

          if (subscriptionError) {
            console.error("❌ [webhook] Error extending subscription:", subscriptionError);
          } else {
            console.log("✅ [webhook] Subscription extended:", {
              userId,
              plan,
              oldEndDate: existingSubscription.end_date,
              newEndDate: newEndDate.toISOString(),
              daysAdded: planDays,
            });
          }
        } else {
          // Create new subscription or replace expired one
          // start_date = NOW(), end_date = NOW() + INTERVAL of plan
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
            console.error("❌ [webhook] Error upserting subscription:", subscriptionError);
          } else {
            console.log("✅ [webhook] Subscription created/updated:", {
              userId,
              plan,
              startDate: startDate.toISOString(),
              endDate: endDate.toISOString(),
              durationDays: planDays,
            });
          }
        }
      } catch (subscriptionError: any) {
        console.error("❌ [webhook] Error processing subscription:", subscriptionError);
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
