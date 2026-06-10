"use server";

import { redirect } from "next/navigation";
import { and, eq } from "drizzle-orm";
import { createClient } from "@/src/lib/supabase/server";
import {
  PaymentRouter,
  type RazorpayCheckoutResult,
} from "@/src/features/subscriptions/api/router";
import { db } from "@/src/lib/db";
import { memberships, subscriptions } from "@/src/lib/db/schema";

// ── Action state types ─────────────────────────────────────────────────────────

export type CheckoutActionState =
  | null
  | { error: string }
  | (RazorpayCheckoutResult & { provider: "razorpay" });

// ── createCheckoutAction ──────────────────────────────────────────────────────

export async function createCheckoutAction(
  _prev: CheckoutActionState,
  formData: FormData
): Promise<CheckoutActionState> {
  const planId = (formData.get("planId") as string | null)?.trim();
  const region = formData.get("region") as string | null;

  if (!planId) return { error: "No plan selected." };

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const [membership] = await db
    .select({ organizationId: memberships.organizationId })
    .from(memberships)
    .where(eq(memberships.profileId, user.id))
    .limit(1);

  if (!membership) redirect("/onboarding");

  const isDomestic = region === "domestic";

  try {
    const result = await PaymentRouter.createCheckoutSession(
      membership.organizationId,
      planId,
      user.email ?? "",
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

export type CancelActionState = null | { error: string } | { success: true };

export async function cancelSubscriptionAction(
  _prev: CancelActionState,
  formData: FormData
): Promise<CancelActionState> {
  const subscriptionId = formData.get("subscriptionId") as string | null;
  if (!subscriptionId) return { error: "Missing subscription ID." };

  // Auth check
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  // Role check — only owners and admins can cancel
  const [membership] = await db
    .select({ organizationId: memberships.organizationId, role: memberships.role })
    .from(memberships)
    .where(eq(memberships.profileId, user.id))
    .limit(1);

  if (!membership) redirect("/onboarding");

  if (membership.role === "member") {
    return { error: "Only owners and admins can cancel subscriptions." };
  }

  // Ownership check — subscription must belong to this user's org
  const sub = await db.query.subscriptions.findFirst({
    where: and(
      eq(subscriptions.id, subscriptionId),
      eq(subscriptions.organizationId, membership.organizationId)
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
