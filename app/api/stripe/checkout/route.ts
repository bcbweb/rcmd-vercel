import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server";
import { stripe, STRIPE_PRICE_IDS } from "@/utils/stripe";

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { priceId, billingInterval } = body; // 'month' or 'year'

    if (!priceId && !billingInterval) {
      return NextResponse.json(
        { error: "Price ID or billing interval required" },
        { status: 400 }
      );
    }

    // Determine price ID
    let finalPriceId = priceId;
    if (!finalPriceId) {
      finalPriceId =
        billingInterval === "year"
          ? STRIPE_PRICE_IDS.pro_yearly
          : STRIPE_PRICE_IDS.pro_monthly;
    }

    if (!finalPriceId) {
      return NextResponse.json(
        { error: "Price ID not configured" },
        { status: 400 }
      );
    }

    // Get or create Stripe customer
    let customerId: string | null = null;

    // Check if user already has a customer ID
    const { data: existingSubscription } = await supabase
      .from("user_subscriptions")
      .select("stripe_customer_id")
      .eq("auth_user_id", user.id)
      .single();

    if (existingSubscription?.stripe_customer_id) {
      customerId = existingSubscription.stripe_customer_id;
    } else {
      // Create new Stripe customer
      const customer = await stripe.customers.create({
        email: user.email || undefined,
        metadata: {
          supabase_user_id: user.id,
        },
      });
      customerId = customer.id;
    }

    // Get origin for redirect URLs
    const origin = request.headers.get("origin") || request.nextUrl.origin;

    // Create checkout session
    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      mode: "subscription",
      payment_method_types: ["card"],
      line_items: [
        {
          price: finalPriceId,
          quantity: 1,
        },
      ],
      success_url: `${origin}/protected/settings/subscription?success=true`,
      cancel_url: `${origin}/pricing?canceled=true`,
      metadata: {
        supabase_user_id: user.id,
      },
    });

    return NextResponse.json({ url: session.url });
  } catch (error) {
    console.error("Error creating checkout session:", error);
    return NextResponse.json(
      { error: "Failed to create checkout session" },
      { status: 500 }
    );
  }
}
