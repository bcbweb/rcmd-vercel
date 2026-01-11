"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/utils/supabase/client";
import { useAuthStore } from "@/stores/auth-store";
import { toast } from "sonner";
import { Spinner } from "@/components/ui/spinner";
import { Button } from "@/components/ui/button";
import { Check, Loader2, ExternalLink } from "lucide-react";
import {
  getUserPlan,
  getUserSubscription,
  openCustomerPortal,
} from "@/utils/subscription";
import type { UserPlan, UserSubscription } from "@/utils/subscription";
import Link from "next/link";
import { useSearchParams } from "next/navigation";

export default function SubscriptionPage() {
  const [userPlan, setUserPlan] = useState<UserPlan | null>(null);
  const [subscription, setSubscription] = useState<UserSubscription | null>(
    null
  );
  const [loading, setLoading] = useState(true);
  const [openingPortal, setOpeningPortal] = useState(false);
  const { userId } = useAuthStore();
  const searchParams = useSearchParams();

  useEffect(() => {
    if (searchParams.get("success") === "true") {
      toast.success("Subscription activated successfully!");
    }
  }, [searchParams]);

  useEffect(() => {
    async function loadSubscription() {
      if (!userId) {
        setLoading(false);
        return;
      }

      try {
        const [plan, userSub] = await Promise.all([
          getUserPlan(userId),
          getUserSubscription(userId),
        ]);

        setUserPlan(plan);
        setSubscription(userSub);
      } catch (error) {
        console.error("Error loading subscription:", error);
        toast.error("Failed to load subscription information");
      } finally {
        setLoading(false);
      }
    }

    loadSubscription();
  }, [userId]);

  const handleManageSubscription = async () => {
    try {
      setOpeningPortal(true);
      const portalUrl = await openCustomerPortal();
      if (portalUrl) {
        window.location.href = portalUrl;
      }
    } catch (error) {
      console.error("Error opening portal:", error);
      toast.error(
        error instanceof Error ? error.message : "Failed to open customer portal"
      );
    } finally {
      setOpeningPortal(false);
    }
  };

  const formatDate = (dateString: string | null) => {
    if (!dateString) return "N/A";
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-full py-10">
        <Spinner className="h-8 w-8" />
      </div>
    );
  }

  const isPro = userPlan?.plan_name === "pro";
  const isActive = subscription?.status === "active" || subscription?.status === "trialing";

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-gray-900 dark:text-white">
          Subscription
        </h1>
        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
          Manage your subscription and billing
        </p>
      </div>

      {/* Current Plan Card */}
      <div className="border rounded-lg p-6 space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-medium text-gray-900 dark:text-white">
              Current Plan
            </h2>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
              {isPro ? "Pro Plan" : "Free Plan"}
            </p>
          </div>
          <div className="text-right">
            <div className="text-2xl font-bold text-gray-900 dark:text-white">
              {isPro ? "$9.99" : "Free"}
            </div>
            <div className="text-sm text-gray-500 dark:text-gray-400">
              {isPro ? "/month" : "Forever"}
            </div>
          </div>
        </div>

        {subscription && (
          <div className="pt-4 border-t border-gray-200 dark:border-gray-700 space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-gray-600 dark:text-gray-400">Status:</span>
              <span
                className={`font-medium ${
                  isActive
                    ? "text-green-600 dark:text-green-400"
                    : "text-yellow-600 dark:text-yellow-400"
                }`}
              >
                {subscription.status === "trialing"
                  ? "Trial"
                  : subscription.status.charAt(0).toUpperCase() +
                    subscription.status.slice(1)}
              </span>
            </div>
            {subscription.current_period_end && (
              <div className="flex justify-between text-sm">
                <span className="text-gray-600 dark:text-gray-400">
                  {subscription.cancel_at_period_end
                    ? "Cancels on:"
                    : "Renews on:"}
                </span>
                <span className="text-gray-900 dark:text-white">
                  {formatDate(subscription.current_period_end)}
                </span>
              </div>
            )}
          </div>
        )}

        {/* Plan Features */}
        {userPlan && (
          <div className="pt-4 border-t border-gray-200 dark:border-gray-700">
            <h3 className="text-sm font-medium text-gray-900 dark:text-white mb-3">
              Plan Features
            </h3>
            <ul className="space-y-2">
              {userPlan.features.map((feature, index) => (
                <li key={index} className="flex items-start text-sm">
                  <Check className="h-4 w-4 text-green-500 mr-2 flex-shrink-0 mt-0.5" />
                  <span className="text-gray-700 dark:text-gray-300">
                    {feature}
                  </span>
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Actions */}
        <div className="pt-4 border-t border-gray-200 dark:border-gray-700 flex gap-3">
          {isPro && subscription ? (
            <Button
              onClick={handleManageSubscription}
              disabled={openingPortal}
              className="flex-1"
            >
              {openingPortal ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Opening...
                </>
              ) : (
                <>
                  <ExternalLink className="mr-2 h-4 w-4" />
                  Manage Subscription
                </>
              )}
            </Button>
          ) : (
            <Button asChild className="flex-1">
              <Link href="/pricing">Upgrade to Pro</Link>
            </Button>
          )}
        </div>
      </div>

      {/* Usage Limits */}
      {userPlan && (
        <div className="border rounded-lg p-6">
          <h2 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
            Usage Limits
          </h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div>
              <div className="text-2xl font-bold text-gray-900 dark:text-white">
                {userPlan.max_profiles}
              </div>
              <div className="text-sm text-gray-500 dark:text-gray-400">
                Profiles
              </div>
            </div>
            <div>
              <div className="text-2xl font-bold text-gray-900 dark:text-white">
                {userPlan.max_rcmds}
              </div>
              <div className="text-sm text-gray-500 dark:text-gray-400">
                RCMDs
              </div>
            </div>
            <div>
              <div className="text-2xl font-bold text-gray-900 dark:text-white">
                {userPlan.max_collections}
              </div>
              <div className="text-sm text-gray-500 dark:text-gray-400">
                Collections
              </div>
            </div>
            <div>
              <div className="text-2xl font-bold text-gray-900 dark:text-white">
                {userPlan.max_custom_pages}
              </div>
              <div className="text-sm text-gray-500 dark:text-gray-400">
                Custom Pages
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
