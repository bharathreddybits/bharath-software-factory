"use server";

import { redirect } from "next/navigation";
import { and, eq } from "drizzle-orm";
import { getServerContext } from "@/src/features/organizations";
import { PaymentRouter, type RazorpayCheckoutResult } from "./router";
import { db } from "@/src/lib/db";
import { subscriptions } from "@/src/lib/db/schema";

// ── Action state types ─────────────────────────────────────────────────────────

export type CheckoutActionState =
  | null
  | { error: string }
  | (RazorpayCheckoutResult & { provider: "razorpay" });

export type CancelActionState = null | { error: string } | { success: true };

// ── createCheckoutAction ──────────────────────────────────────────────────────

export async function createCheckoutAction(
  _prev: CheckoutActionState,
  formData: FormData
): Promise<CheckoutActionState> {
  const planId = (formData.get("planId") as string | null)?.trim();
  const region = formData.get("region") as string | null;

  if (!planId) return { error: "No plan selected." };

  const { organizationId, email } = await getServerContext();
  const isDomestic = region === "domestic";

  try {
    const result = await PaymentRouter.createCheckoutSession(
      organizationId,
      planId,
      email,
      isDomestic
    );

    if (result.provider === "dodo") {
      redirect(result.url);
    }

    // Razorpay: return order data for the client-side modal
    return result;
  } catch (err) {
    const message = err instanceof Error ? err.message : "Checkout failed. Try again.";
    return { error: message };
  }
}

// ── cancelSubscriptionAction ──────────────────────────────────────────────────

export async function cancelSubscriptionAction(
  _prev: CancelActionState,
  formData: FormData
): Promise<CancelActionState> {
  const subscriptionId = formData.get("subscriptionId") as string | null;
  if (!subscriptionId) return { error: "Missing subscription ID." };

  const { organizationId, role } = await getServerContext();

  // Role gate — only owners and admins can cancel
  if (role === "member") {
    return { error: "Only owners and admins can cancel subscriptions." };
  }

  // Ownership check — subscription must belong to this user's org
  const sub = await db.query.subscriptions.findFirst({
    where: and(
      eq(subscriptions.id, subscriptionId),
      eq(subscriptions.organizationId, organizationId)
    ),
  });

  if (!sub) return { error: "Subscription not found." };

  try {
    await PaymentRouter.cancelSubscription(subscriptionId);
    return { success: true };
  } catch (err) {
    const message = err instanceof Error ? err.message : "Cancellation failed.";
    return { error: message };
  }
}
