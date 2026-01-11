"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Check, Loader2 } from "lucide-react";
import { getSubscriptionPlans, createCheckoutSession } from "@/utils/subscription";
import type { SubscriptionPlan } from "@/utils/stripe";
import { useAuthStore } from "@/stores/auth-store";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import Link from "next/link";

export default function PricingPage() {
  const [plans, setPlans] = useState<SubscriptionPlan[]>([]);
  const [loading, setLoading] = useState(true);
  const [billingInterval, setBillingInterval] = useState<"month" | "year">(
    "month"
  );
  const [processingPlan, setProcessingPlan] = useState<string | null>(null);
  const { userId, status } = useAuthStore();
  const router = useRouter();

  useEffect(() => {
    async function loadPlans() {
      try {
        const subscriptionPlans = await getSubscriptionPlans();
        setPlans(subscriptionPlans);
      } catch (error) {
        console.error("Error loading plans:", error);
        toast.error("Failed to load pricing plans");
      } finally {
        setLoading(false);
      }
    }

    loadPlans();
  }, []);

  const handleUpgrade = async (plan: SubscriptionPlan) => {
    if (!userId) {
      router.push("/sign-in?redirect=/pricing");
      return;
    }

    if (plan.name === "free") {
      toast.info("You're already on the free plan");
      return;
    }

    try {
      setProcessingPlan(plan.name);
      const priceId =
        billingInterval === "year"
          ? plan.stripe_price_id_yearly
          : plan.stripe_price_id_monthly;

      if (!priceId) {
        toast.error("Price not configured for this plan");
        return;
      }

      const checkoutUrl = await createCheckoutSession(
        priceId,
        billingInterval
      );

      if (checkoutUrl) {
        window.location.href = checkoutUrl;
      }
    } catch (error) {
      console.error("Error creating checkout:", error);
      toast.error(
        error instanceof Error ? error.message : "Failed to start checkout"
      );
    } finally {
      setProcessingPlan(null);
    }
  };

  const formatPrice = (cents: number | null) => {
    if (!cents) return "Free";
    return `$${(cents / 100).toFixed(2)}`;
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  const proPlan = plans.find((p) => p.name === "pro");
  const freePlan = plans.find((p) => p.name === "free");

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white dark:from-gray-900 dark:to-gray-800">
      <div className="container mx-auto px-4 py-16">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-4">
            Choose Your Plan
          </h1>
          <p className="text-xl text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
            Start free, upgrade when you're ready to unlock more features
          </p>
        </div>

        {/* Billing Toggle */}
        {proPlan && (
          <div className="flex justify-center mb-8">
            <div className="inline-flex items-center bg-white dark:bg-gray-800 rounded-lg p-1 border border-gray-200 dark:border-gray-700">
              <button
                onClick={() => setBillingInterval("month")}
                className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                  billingInterval === "month"
                    ? "bg-blue-600 text-white"
                    : "text-gray-700 dark:text-gray-300"
                }`}
              >
                Monthly
              </button>
              <button
                onClick={() => setBillingInterval("year")}
                className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                  billingInterval === "year"
                    ? "bg-blue-600 text-white"
                    : "text-gray-700 dark:text-gray-300"
                }`}
              >
                Yearly
                <span className="ml-1 text-xs opacity-90">(Save 17%)</span>
              </button>
            </div>
          </div>
        )}

        {/* Pricing Cards */}
        <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
          {/* Free Plan */}
          {freePlan && (
            <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-8">
              <div className="mb-6">
                <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                  {freePlan.display_name}
                </h3>
                <div className="flex items-baseline">
                  <span className="text-4xl font-bold text-gray-900 dark:text-white">
                    {formatPrice(freePlan.price_monthly)}
                  </span>
                  <span className="text-gray-600 dark:text-gray-400 ml-2">
                    /month
                  </span>
                </div>
                {freePlan.description && (
                  <p className="text-gray-600 dark:text-gray-400 mt-2">
                    {freePlan.description}
                  </p>
                )}
              </div>

              <ul className="space-y-3 mb-8">
                {freePlan.features.map((feature, index) => (
                  <li key={index} className="flex items-start">
                    <Check className="h-5 w-5 text-green-500 mr-2 flex-shrink-0 mt-0.5" />
                    <span className="text-gray-700 dark:text-gray-300">
                      {feature}
                    </span>
                  </li>
                ))}
              </ul>

              <Button
                variant="outline"
                className="w-full"
                onClick={() => handleUpgrade(freePlan)}
                disabled={processingPlan === freePlan.name}
              >
                {processingPlan === freePlan.name ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Processing...
                  </>
                ) : (
                  "Current Plan"
                )}
              </Button>
            </div>
          )}

          {/* Pro Plan */}
          {proPlan && (
            <div className="bg-gradient-to-br from-blue-600 to-blue-700 rounded-lg border-2 border-blue-500 p-8 text-white relative overflow-hidden">
              <div className="absolute top-0 right-0 bg-yellow-400 text-yellow-900 px-3 py-1 text-xs font-bold rounded-bl-lg">
                POPULAR
              </div>

              <div className="mb-6">
                <h3 className="text-2xl font-bold mb-2">{proPlan.display_name}</h3>
                <div className="flex items-baseline">
                  <span className="text-4xl font-bold">
                    {formatPrice(
                      billingInterval === "year"
                        ? proPlan.price_yearly
                        : proPlan.price_monthly
                    )}
                  </span>
                  <span className="ml-2 opacity-90">/month</span>
                </div>
                {billingInterval === "year" && (
                  <p className="text-sm opacity-90 mt-1">
                    Billed annually (${(proPlan.price_yearly! / 100 / 12).toFixed(2)}/month)
                  </p>
                )}
                {proPlan.description && (
                  <p className="opacity-90 mt-2">{proPlan.description}</p>
                )}
              </div>

              <ul className="space-y-3 mb-8">
                {proPlan.features.map((feature, index) => (
                  <li key={index} className="flex items-start">
                    <Check className="h-5 w-5 mr-2 flex-shrink-0 mt-0.5" />
                    <span>{feature}</span>
                  </li>
                ))}
              </ul>

              <Button
                className="w-full bg-white text-blue-600 hover:bg-gray-100"
                onClick={() => handleUpgrade(proPlan)}
                disabled={processingPlan === proPlan.name}
              >
                {processingPlan === proPlan.name ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Processing...
                  </>
                ) : status === "authenticated" ? (
                  "Upgrade to Pro"
                ) : (
                  "Sign Up for Pro"
                )}
              </Button>
            </div>
          )}
        </div>

        {/* FAQ or Additional Info */}
        <div className="mt-16 text-center">
          <p className="text-gray-600 dark:text-gray-400 mb-4">
            All plans include a 14-day money-back guarantee
          </p>
          <p className="text-sm text-gray-500 dark:text-gray-500">
            Questions?{" "}
            <Link
              href="/help"
              className="text-blue-600 dark:text-blue-400 hover:underline"
            >
              Contact support
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
