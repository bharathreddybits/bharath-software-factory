import { db } from "@/src/lib/db";
import { subscriptions } from "@/src/lib/db/schema";
import { eq } from "drizzle-orm";
import factoryConfig from "@/src/config/factory.config";

// ── Return types ───────────────────────────────────────────────────────────────

export type DodoCheckoutResult = {
  provider: "dodo";
  url: string;
};

export type RazorpayCheckoutResult = {
  provider: "razorpay";
  subscriptionId: string;
  keyId: string;
  amount: number;
  currency: string;
  name: string;
  email: string;
};

export type CheckoutResult = DodoCheckoutResult | RazorpayCheckoutResult;

// ── Internal gateway helpers ──────────────────────────────────────────────────

async function createDodoCheckout(
  organizationId: string,
  planId: string,
  userEmail: string
): Promise<DodoCheckoutResult> {
  const apiKey = process.env.DODO_PAYMENTS_API_KEY;
  if (!apiKey) throw new Error("DODO_PAYMENTS_API_KEY is not configured in .env.local");

  const plan = factoryConfig.plans.find((p) => p.id === planId);
  if (!plan) throw new Error(`Unknown plan: "${planId}"`);
  if (!plan.international.dodoPlanId)
    throw new Error(
      `DoDo plan ID not configured for "${planId}". Set factoryConfig.plans[].international.dodoPlanId after creating the plan in DoDo dashboard.`
    );

  const res = await fetch("https://api.dodopayments.com/subscriptions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      product_id: plan.international.dodoPlanId,
      customer: { email: userEmail },
      payment_link: true,
      metadata: { organization_id: organizationId },
      return_url: `${process.env.NEXT_PUBLIC_APP_URL}/dashboard/billing?success=true`,
      cancel_url: `${process.env.NEXT_PUBLIC_APP_URL}/dashboard/billing?canceled=true`,
    }),
  });

  if (!res.ok) {
    const body = await res.text();
    throw new Error(`DoDo checkout failed (${res.status}): ${body}`);
  }

  const data = (await res.json()) as { payment_link: string };
  return { provider: "dodo", url: data.payment_link };
}

async function createRazorpayCheckout(
  organizationId: string,
  planId: string,
  userEmail: string
): Promise<RazorpayCheckoutResult> {
  const keyId = process.env.RAZORPAY_KEY_ID;
  const keySecret = process.env.RAZORPAY_KEY_SECRET;
  if (!keyId || !keySecret) throw new Error("RAZORPAY_KEY_ID / RAZORPAY_KEY_SECRET not configured");

  const plan = factoryConfig.plans.find((p) => p.id === planId);
  if (!plan) throw new Error(`Unknown plan: "${planId}"`);
  if (!plan.domestic.razorpayPlanId)
    throw new Error(
      `Razorpay plan ID not configured for "${planId}". Set factoryConfig.plans[].domestic.razorpayPlanId after creating the plan in Razorpay dashboard.`
    );

  const credentials = Buffer.from(`${keyId}:${keySecret}`).toString("base64");

  const res = await fetch("https://api.razorpay.com/v1/subscriptions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Basic ${credentials}`,
    },
    body: JSON.stringify({
      plan_id: plan.domestic.razorpayPlanId,
      total_count: 12,
      quantity: 1,
      notes: { organization_id: organizationId },
      notify_info: { notify_email: userEmail },
    }),
  });

  if (!res.ok) {
    const body = await res.text();
    throw new Error(`Razorpay subscription creation failed (${res.status}): ${body}`);
  }

  const data = (await res.json()) as { id: string };
  return {
    provider: "razorpay",
    subscriptionId: data.id,
    keyId,
    amount: plan.domestic.priceInr * 100, // display amount in paise
    currency: "INR",
    name: factoryConfig.product.name,
    email: userEmail,
  };
}

async function cancelDodoSubscription(gatewaySubscriptionId: string): Promise<void> {
  const apiKey = process.env.DODO_PAYMENTS_API_KEY;
  if (!apiKey) throw new Error("DODO_PAYMENTS_API_KEY is not configured");

  const res = await fetch(`https://api.dodopayments.com/subscriptions/${gatewaySubscriptionId}`, {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({ status: "cancelled" }),
  });

  if (!res.ok) {
    const body = await res.text();
    throw new Error(`DoDo cancel failed (${res.status}): ${body}`);
  }
}

async function cancelRazorpaySubscription(gatewaySubscriptionId: string): Promise<void> {
  const keyId = process.env.RAZORPAY_KEY_ID;
  const keySecret = process.env.RAZORPAY_KEY_SECRET;
  if (!keyId || !keySecret) throw new Error("RAZORPAY_KEY_ID / RAZORPAY_KEY_SECRET not configured");

  const credentials = Buffer.from(`${keyId}:${keySecret}`).toString("base64");

  const res = await fetch(
    `https://api.razorpay.com/v1/subscriptions/${gatewaySubscriptionId}/cancel`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Basic ${credentials}`,
      },
      body: JSON.stringify({ cancel_at_cycle_end: false }),
    }
  );

  if (!res.ok) {
    const body = await res.text();
    throw new Error(`Razorpay cancel failed (${res.status}): ${body}`);
  }
}

// ── Public API ────────────────────────────────────────────────────────────────

export const PaymentRouter = {
  /**
   * Creates a checkout session with the appropriate gateway.
   * isDomestic=true → Razorpay (India); false → DoDo Payments (international).
   * planId must match a factoryConfig.plans[].id value.
   */
  async createCheckoutSession(
    organizationId: string,
    planId: string,
    userEmail: string,
    isDomestic: boolean
  ): Promise<CheckoutResult> {
    if (isDomestic) {
      return createRazorpayCheckout(organizationId, planId, userEmail);
    }
    return createDodoCheckout(organizationId, planId, userEmail);
  },

  /**
   * Cancels a subscription by its internal DB id.
   * Looks up gateway_provider to route to the correct cancellation endpoint.
   */
  async cancelSubscription(subscriptionId: string): Promise<void> {
    const sub = await db.query.subscriptions.findFirst({
      where: eq(subscriptions.id, subscriptionId),
    });
    if (!sub) throw new Error(`Subscription ${subscriptionId} not found`);

    if (sub.gatewayProvider === "razorpay") {
      return cancelRazorpaySubscription(sub.gatewaySubscriptionId);
    }
    return cancelDodoSubscription(sub.gatewaySubscriptionId);
  },
};
