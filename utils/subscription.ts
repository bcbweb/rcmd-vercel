import { createClient } from "@/utils/supabase/client";
import type { SubscriptionPlan, UserSubscription } from "@/utils/stripe";

export interface UserPlan {
  plan_name: string;
  plan_id: string;
  status: string;
  current_period_end: string | null;
  max_profiles: number;
  max_rcmds: number;
  max_collections: number;
  max_custom_pages: number;
  features: string[];
}

export async function getUserPlan(userId: string): Promise<UserPlan | null> {
  try {
    const supabase = createClient();
    const { data, error } = await supabase.rpc("get_user_plan", {
      p_auth_user_id: userId,
    });

    if (error) {
      console.error("Error fetching user plan:", error);
      return null;
    }

    if (!data || data.length === 0) {
      // Default to free plan
      return {
        plan_name: "free",
        plan_id: "",
        status: "active",
        current_period_end: null,
        max_profiles: 1,
        max_rcmds: 10,
        max_collections: 3,
        max_custom_pages: 1,
        features: [
          "Basic profile",
          "10 RCMDs",
          "3 Collections",
          "1 Custom Page",
          "Social media links",
        ],
      };
    }

    return data[0] as UserPlan;
  } catch (error) {
    console.error("Error in getUserPlan:", error);
    return null;
  }
}

export async function getSubscriptionPlans(): Promise<SubscriptionPlan[]> {
  try {
    const supabase = createClient();
    const { data, error } = await supabase
      .from("subscription_plans")
      .select("*")
      .order("price_monthly", { ascending: true });

    if (error) {
      console.error("Error fetching subscription plans:", error);
      return [];
    }

    return (data || []).map((plan) => ({
      ...plan,
      features: (plan.features as string[]) || [],
    }));
  } catch (error) {
    console.error("Error in getSubscriptionPlans:", error);
    return [];
  }
}

export async function getUserSubscription(
  userId: string
): Promise<UserSubscription | null> {
  try {
    const supabase = createClient();
    const { data, error } = await supabase
      .from("user_subscriptions")
      .select("*")
      .eq("auth_user_id", userId)
      .eq("status", "active")
      .single();

    if (error) {
      if (error.code === "PGRST116") {
        // No subscription found - user is on free plan
        return null;
      }
      console.error("Error fetching user subscription:", error);
      return null;
    }

    return data as UserSubscription;
  } catch (error) {
    console.error("Error in getUserSubscription:", error);
    return null;
  }
}

export async function createCheckoutSession(
  priceId: string,
  billingInterval?: "month" | "year"
): Promise<string | null> {
  try {
    const response = await fetch("/api/stripe/checkout", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ priceId, billingInterval }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || "Failed to create checkout session");
    }

    const data = await response.json();
    return data.url;
  } catch (error) {
    console.error("Error creating checkout session:", error);
    throw error;
  }
}

export async function openCustomerPortal(): Promise<string | null> {
  try {
    const response = await fetch("/api/stripe/portal", {
      method: "POST",
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || "Failed to open customer portal");
    }

    const data = await response.json();
    return data.url;
  } catch (error) {
    console.error("Error opening customer portal:", error);
    throw error;
  }
}
