import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@/app/lib/supabaseServer";
import { validateSession } from "@/app/lib/validateSession";
import { supabaseServiceRole } from "@/app/lib/supabaseServiceRole";
import { calculateEndDate } from "@/app/lib/subscription";
import crypto from "crypto";

export async function POST(request: NextRequest) {
  try {
    // Validate session token
    const { user, valid, error } = await validateSession(request);

    if (!valid || !user) {
      console.error("Session validation failed:", error);
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = body;

    // Validate required fields
    if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
      return NextResponse.json(
        { error: "Missing required payment verification fields" },
        { status: 400 }
      );
    }

    // Verify Razorpay signature
    const secret = process.env.RAZORPAY_KEY_SECRET;
    if (!secret) {
      return NextResponse.json(
        { error: "Razorpay secret key not configured" },
        { status: 500 }
      );
    }

    // Generate expected signature
    const text = `${razorpay_order_id}|${razorpay_payment_id}`;
    const expectedSignature = crypto
      .createHmac("sha256", secret)
      .update(text)
      .digest("hex");

    // Compare signatures
    const isSignatureValid = expectedSignature === razorpay_signature;

    if (!isSignatureValid) {
      console.error("Invalid payment signature", {
        order_id: razorpay_order_id,
        payment_id: razorpay_payment_id,
      });

      // Update payment status to failed (using service role to bypass RLS)
      await supabaseServiceRole
        .from("payments")
        .update({
          status: "failed",
          razorpay_payment_id: razorpay_payment_id,
          updated_at: new Date().toISOString(),
        })
        .eq("razorpay_order_id", razorpay_order_id);

      return NextResponse.json(
        { error: "Invalid payment signature", verified: false },
        { status: 400 }
      );
    }

    // Signature is valid - update payment record (using service role)
    const { data: updatedPayment, error: updateError } = await supabaseServiceRole
      .from("payments")
      .update({
        status: "completed",
        razorpay_payment_id: razorpay_payment_id,
        razorpay_signature: razorpay_signature,
        updated_at: new Date().toISOString(),
      })
      .eq("razorpay_order_id", razorpay_order_id)
      .select()
      .single();

    if (updateError) {
      console.error("Error updating payment record:", updateError);
      return NextResponse.json(
        { error: "Failed to update payment record", verified: true },
        { status: 500 }
      );
    }

    // Activate/Extend subscription (duplicate-safe, same logic as webhook)
    if (updatedPayment?.plan) {
      try {
        const plan = updatedPayment.plan as "1m" | "6m" | "12m";
        
        // Check if user already has an active subscription
        const { data: existingSubscription } = await supabaseServiceRole
          .from("subscriptions")
          .select("*")
          .eq("user_id", user.id)
          .eq("status", "active")
          .maybeSingle();

        const now = new Date();
        const startDate = existingSubscription
          ? new Date(existingSubscription.start_date)
          : now;
        const endDate = calculateEndDate(plan, now);

        // If user has an active subscription, extend it from current end_date
        // Otherwise, create new subscription
        if (existingSubscription && new Date(existingSubscription.end_date) > now) {
          // Extend existing subscription
          const currentEndDate = new Date(existingSubscription.end_date);
          const additionalDays =
            plan === "1m" ? 30 : plan === "6m" ? 180 : 365;
          currentEndDate.setDate(currentEndDate.getDate() + additionalDays);

          const { error: subscriptionError } = await supabaseServiceRole
            .from("subscriptions")
            .update({
              plan: plan,
              end_date: currentEndDate.toISOString(),
              status: "active",
              updated_at: new Date().toISOString(),
            })
            .eq("id", existingSubscription.id);

          if (subscriptionError) {
            console.error("Error extending subscription:", subscriptionError);
          } else {
            console.log("Subscription extended via verify-payment:", {
              userId: user.id,
              plan,
              newEndDate: currentEndDate.toISOString(),
            });
          }
        } else {
          // Create new subscription (upsert to prevent duplicates)
          const { error: subscriptionError } = await supabaseServiceRole
            .from("subscriptions")
            .upsert(
              {
                user_id: user.id,
                plan: plan,
                start_date: startDate.toISOString(),
                end_date: endDate.toISOString(),
                status: "active",
                updated_at: new Date().toISOString(),
              },
              {
                onConflict: "user_id",
              }
            );

          if (subscriptionError) {
            console.error("Error creating subscription:", subscriptionError);
          } else {
            console.log("Subscription created via verify-payment:", {
              userId: user.id,
              plan,
              endDate: endDate.toISOString(),
            });
          }
        }
      } catch (subscriptionError: any) {
        console.error("Error processing subscription in verify-payment:", subscriptionError);
        // Continue - don't fail the verification
      }
    }

    // Return success response
    return NextResponse.json({
      verified: true,
      message: "Payment verified successfully",
      payment: {
        order_id: razorpay_order_id,
        payment_id: razorpay_payment_id,
        status: "completed",
        plan: updatedPayment?.plan,
        amount: updatedPayment?.amount,
      },
    });
  } catch (error: any) {
    console.error("Error verifying payment:", error);
    return NextResponse.json(
      { error: error.message || "Failed to verify payment" },
      { status: 500 }
    );
  }
}

