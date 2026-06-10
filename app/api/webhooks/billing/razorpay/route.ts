import { createHmac, timingSafeEqual } from "crypto";
import { eq } from "drizzle-orm";
import { db } from "@/src/lib/db";
import { subscriptions } from "@/src/lib/db/schema";
import type { SubscriptionStatus } from "@/src/lib/db/schema";

export const dynamic = "force-dynamic";

// ── Signature verification ────────────────────────────────────────────────────

function verifyRazorpaySignature(rawBody: string, signature: string, secret: string): boolean {
  const expected = createHmac("sha256", secret).update(rawBody, "utf8").digest("hex");
  try {
    return timingSafeEqual(Buffer.from(signature, "hex"), Buffer.from(expected, "hex"));
  } catch {
    return false;
  }
}

// ── Event → status mapping ────────────────────────────────────────────────────

const EVENT_STATUS_MAP: Record<string, SubscriptionStatus> = {
  "subscription.activated": "active",
  "subscription.charged": "active",
  "subscription.pending": "trialing",
  "subscription.created": "trialing",
  "subscription.halted": "past_due",
  "subscription.cancelled": "canceled",
  "subscription.completed": "canceled",
  "payment.failed": "past_due",
};

// ── Payload types ─────────────────────────────────────────────────────────────

type RazorpaySubscriptionEntity = {
  id: string;
  customer_id?: string;
  status?: string;
  current_end?: number;
  plan_id?: string;
  notes?: { organization_id?: string };
};

type RazorpayEvent = {
  event: string;
  payload: {
    subscription?: { entity: RazorpaySubscriptionEntity };
  };
};

function isRazorpayEvent(v: unknown): v is RazorpayEvent {
  return (
    typeof v === "object" &&
    v !== null &&
    typeof (v as Record<string, unknown>).event === "string" &&
    typeof (v as Record<string, unknown>).payload === "object"
  );
}

// ── Route handler ─────────────────────────────────────────────────────────────

export async function POST(request: Request): Promise<Response> {
  const secret = process.env.RAZORPAY_WEBHOOK_SECRET;
  if (!secret) {
    console.error("[razorpay-webhook] RAZORPAY_WEBHOOK_SECRET not set");
    return new Response("Webhook secret not configured", { status: 500 });
  }

  const rawBody = await request.text();
  const signature = request.headers.get("x-razorpay-signature") ?? "";

  if (!verifyRazorpaySignature(rawBody, signature, secret)) {
    return new Response("Invalid signature", { status: 401 });
  }

  let event: unknown;
  try {
    event = JSON.parse(rawBody);
  } catch {
    return new Response("Invalid JSON", { status: 400 });
  }

  if (!isRazorpayEvent(event)) {
    return new Response("Unexpected payload shape", { status: 400 });
  }

  const entity = event.payload.subscription?.entity;
  if (!entity) {
    return new Response("OK", { status: 200 });
  }

  const status: SubscriptionStatus = EVENT_STATUS_MAP[event.event] ?? "unpaid";
  const organizationId = entity.notes?.organization_id;

  if (!organizationId) {
    console.warn("[razorpay-webhook] Missing organization_id in notes for subscription", entity.id);
    return new Response("OK", { status: 200 });
  }

  try {
    switch (event.event) {
      case "subscription.activated":
      case "subscription.created":
      case "subscription.pending": {
        await db
          .insert(subscriptions)
          .values({
            organizationId,
            gatewayProvider: "razorpay",
            gatewaySubscriptionId: entity.id,
            gatewayCustomerId: entity.customer_id ?? "",
            status,
            planId: entity.plan_id ?? "",
            currentPeriodEnd: entity.current_end ? new Date(entity.current_end * 1000) : null,
            updatedAt: new Date(),
          })
          .onConflictDoUpdate({
            target: subscriptions.organizationId,
            set: {
              gatewayProvider: "razorpay",
              gatewaySubscriptionId: entity.id,
              gatewayCustomerId: entity.customer_id ?? "",
              status,
              planId: entity.plan_id ?? "",
              currentPeriodEnd: entity.current_end ? new Date(entity.current_end * 1000) : null,
              updatedAt: new Date(),
            },
          });
        break;
      }

      case "subscription.charged":
      case "subscription.halted":
      case "subscription.cancelled":
      case "subscription.completed":
      case "payment.failed": {
        await db
          .update(subscriptions)
          .set({
            status,
            currentPeriodEnd: entity.current_end ? new Date(entity.current_end * 1000) : undefined,
            updatedAt: new Date(),
          })
          .where(eq(subscriptions.gatewaySubscriptionId, entity.id));
        break;
      }

      default:
        break;
    }
  } catch (err) {
    console.error("[razorpay-webhook] DB error:", err);
    return new Response("Internal error", { status: 500 });
  }

  return new Response("OK", { status: 200 });
}
