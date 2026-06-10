"use client";

import { useActionState, useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { createCheckoutAction, cancelSubscriptionAction } from "./actions";
import factoryConfig from "@/src/config/factory.config";
import type { Subscription } from "@/src/lib/db/schema";

// ── Razorpay window type ──────────────────────────────────────────────────────

type RazorpayOptions = {
  key: string;
  subscription_id: string;
  name: string;
  description: string;
  prefill: { email: string };
  handler: () => void;
};

declare global {
  interface Window {
    Razorpay?: new (options: RazorpayOptions) => { open(): void };
  }
}

// ── Props ─────────────────────────────────────────────────────────────────────

type Props = {
  subscription: Subscription | null;
  orgName: string;
};

// ── Component ─────────────────────────────────────────────────────────────────

export function BillingClient({ subscription, orgName }: Props) {
  const [region, setRegion] = useState<"international" | "domestic">("international");
  const [checkoutState, checkoutAction, checkoutPending] = useActionState(
    createCheckoutAction,
    null
  );
  const [cancelState, cancelAction] = useActionState(cancelSubscriptionAction, null);

  // Open Razorpay modal when server action returns order data
  useEffect(() => {
    if (!checkoutState || !("provider" in checkoutState) || checkoutState.provider !== "razorpay")
      return;

    const script = document.createElement("script");
    script.src = "https://checkout.razorpay.com/v1/checkout.js";
    script.onload = () => {
      if (!window.Razorpay || !("provider" in checkoutState)) return;
      const rzp = new window.Razorpay({
        key: checkoutState.keyId,
        subscription_id: checkoutState.subscriptionId,
        name: checkoutState.name,
        description: `${factoryConfig.product.name} Subscription`,
        prefill: { email: checkoutState.email },
        handler: () => {
          window.location.href = "/dashboard/billing?success=true";
        },
      });
      rzp.open();
    };
    document.body.appendChild(script);
    return () => {
      if (document.body.contains(script)) document.body.removeChild(script);
    };
  }, [checkoutState]);

  const currency = region === "domestic" ? "₹" : "$";

  return (
    <div className="p-8 max-w-5xl">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-semibold text-white">Billing</h1>
        <p className="mt-1 text-sm text-zinc-400">
          Manage your subscription for <span className="text-zinc-200 font-medium">{orgName}</span>.
        </p>
      </div>

      {/* Active subscription status */}
      {subscription && (
        <div className="mb-8 rounded-xl border border-zinc-800 bg-zinc-900/50 p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-zinc-200">
                Current plan: <span className="capitalize">{subscription.planId}</span>
              </p>
              <p className="mt-0.5 text-xs text-zinc-500">
                via {subscription.gatewayProvider === "dodo" ? "DoDo Payments" : "Razorpay"} ·
                Status:{" "}
                <span
                  className={
                    subscription.status === "active"
                      ? "text-emerald-400"
                      : subscription.status === "trialing"
                        ? "text-sky-400"
                        : "text-red-400"
                  }
                >
                  {subscription.status.replace("_", " ")}
                </span>
                {subscription.currentPeriodEnd && (
                  <> · renews {new Date(subscription.currentPeriodEnd).toLocaleDateString()}</>
                )}
              </p>
            </div>
            <form action={cancelAction}>
              <input type="hidden" name="subscriptionId" value={subscription.id} />
              <Button
                type="submit"
                variant="destructive"
                size="sm"
                disabled={!!cancelState && "success" in cancelState}
              >
                {cancelState && "success" in cancelState ? "Canceled" : "Cancel plan"}
              </Button>
            </form>
          </div>
          {cancelState && "error" in cancelState && (
            <p className="mt-2 text-xs text-red-400">{cancelState.error}</p>
          )}
        </div>
      )}

      {/* Region toggle */}
      <div className="mb-6 flex items-center gap-2">
        <span className="text-xs text-zinc-500 uppercase tracking-wide mr-1">Checkout via</span>
        <button
          type="button"
          onClick={() => setRegion("international")}
          className={`rounded-lg px-3 py-1.5 text-sm font-medium transition-colors ${
            region === "international"
              ? "bg-zinc-700 text-white"
              : "text-zinc-400 hover:text-white hover:bg-zinc-800"
          }`}
        >
          🌍 International
        </button>
        <button
          type="button"
          onClick={() => setRegion("domestic")}
          className={`rounded-lg px-3 py-1.5 text-sm font-medium transition-colors ${
            region === "domestic"
              ? "bg-zinc-700 text-white"
              : "text-zinc-400 hover:text-white hover:bg-zinc-800"
          }`}
        >
          🇮🇳 India / Domestic
        </button>
      </div>

      {/* Error banner */}
      {checkoutState && "error" in checkoutState && (
        <div className="mb-6 rounded-lg border border-red-900 bg-red-950/30 px-4 py-3 text-sm text-red-400">
          {checkoutState.error}
        </div>
      )}

      {/* Plan cards — driven by factoryConfig.plans */}
      <form action={checkoutAction}>
        <input type="hidden" name="region" value={region} />
        <div className="grid gap-4 sm:grid-cols-3">
          {factoryConfig.plans.map((plan) => (
            <Card
              key={plan.id}
              className={`flex flex-col bg-zinc-900 border-zinc-800 ${
                plan.highlighted ? "ring-2 ring-indigo-500/60" : ""
              }`}
            >
              <CardHeader>
                {plan.highlighted && (
                  <span className="mb-1 w-fit rounded-full bg-indigo-500/15 px-2 py-0.5 text-xs font-medium text-indigo-400">
                    Most popular
                  </span>
                )}
                <CardTitle className="text-white">{plan.name}</CardTitle>
                <CardDescription className="text-zinc-400">{plan.description}</CardDescription>
              </CardHeader>

              <CardContent className="flex-1">
                <p className="mb-4 text-3xl font-bold text-white">
                  {currency}
                  {region === "domestic" ? plan.domestic.priceInr : plan.international.priceUsd}
                  <span className="text-base font-normal text-zinc-400">/mo</span>
                </p>
                <ul className="space-y-1.5">
                  {plan.features.map((f) => (
                    <li key={f} className="flex items-center gap-2 text-sm text-zinc-300">
                      <span className="text-emerald-400">✓</span>
                      {f}
                    </li>
                  ))}
                </ul>
              </CardContent>

              <CardFooter>
                <Button
                  type="submit"
                  name="planId"
                  value={plan.id}
                  variant={plan.highlighted ? "default" : "outline"}
                  className="w-full"
                  disabled={checkoutPending}
                >
                  {checkoutPending ? "Loading…" : "Subscribe"}
                </Button>
              </CardFooter>
            </Card>
          ))}
        </div>
      </form>

      <p className="mt-6 text-xs text-zinc-600">
        {region === "domestic"
          ? "Payments processed by Razorpay. Prices in INR, inclusive of GST."
          : "Payments processed by DoDo Payments. Prices in USD."}
      </p>
    </div>
  );
}
