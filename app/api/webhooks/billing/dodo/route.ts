import { createHmac, timingSafeEqual } from "crypto";
import { db } from "@/src/lib/db";
import { subscriptions } from "@/src/lib/db/schema";
import type { SubscriptionStatus } from "@/src/lib/db/schema";
import { eq } from "drizzle-orm";

export const dynamic = "force-dynamic";

// ── Signature verification ────────────────────────────────────────────────────

function verifyDodoSignature(rawBody: string, signature: string, secret: string): boolean {
  const expected = createHmac("sha256", secret).update(rawBody, "utf8").digest("hex");
  try {
    return timingSafeEqual(Buffer.from(signature, "hex"), Buffer.from(expected, "hex"));
  } catch {
    return false;
  }
}

// ── Status normalisation ──────────────────────────────────────────────────────

const STATUS_MAP: Record<string, SubscriptionStatus> = {
  active: "active",
  trialing: "trialing",
  past_due: "past_due",
  canceled: "canceled",
  cancelled: "canceled",
  unpaid: "unpaid",
};

function normalizeStatus(raw: string): SubscriptionStatus {
  return STATUS_MAP[raw] ?? "unpaid";
}

// ── Event payload types ───────────────────────────────────────────────────────

type DodoEventData = {
  subscription_id?: string;
  customer?: { customer_id?: string };
  status?: string;
  product_id?: string;
  next_billing_date?: string;
  metadata?: { organization_id?: string };
};

type DodoEvent = {
  type: string;
  data: DodoEventData;
};

function isDodoEvent(v: unknown): v is DodoEvent {
  return (
    typeof v === "object" &&
    v !== null &&
    typeof (v as Record<string, unknown>).type === "string" &&
    typeof (v as Record<string, unknown>).data === "object"
  );
}

// ── Route handler ─────────────────────────────────────────────────────────────

export async function POST(request: Request): Promise<Response> {
  const secret = process.env.DODO_PAYMENTS_WEBHOOK_SECRET;
  if (!secret) {
    console.error("[dodo-webhook] DODO_PAYMENTS_WEBHOOK_SECRET not set");
    return new Response("Webhook secret not configured", { status: 500 });
  }

  const rawBody = await request.text();
  const signature = request.headers.get("webhook-signature") ?? "";

  if (!verifyDodoSignature(rawBody, signature, secret)) {
    return new Response("Invalid signature", { status: 401 });
  }

  let event: unknown;
  try {
    event = JSON.parse(rawBody);
  } catch {
    return new Response("Invalid JSON", { status: 400 });
  }

  if (!isDodoEvent(event)) {
    return new Response("Unexpected payload shape", { status: 400 });
  }

  try {
    switch (event.type) {
      case "subscription.user.created": {
        const d = event.data;
        const organizationId = d.metadata?.organization_id;
        const gatewaySubscriptionId = d.subscription_id;

        if (!organizationId || !gatewaySubscriptionId) break;

        await db
          .insert(subscriptions)
          .values({
            organizationId,
            gatewayProvider: "dodo",
            gatewaySubscriptionId,
            gatewayCustomerId: d.customer?.customer_id ?? "",
            status: normalizeStatus(d.status ?? "trialing"),
            planId: d.product_id ?? "",
            currentPeriodEnd: d.next_billing_date ? new Date(d.next_billing_date) : null,
            updatedAt: new Date(),
          })
          .onConflictDoUpdate({
            target: subscriptions.organizationId,
            set: {
              gatewayProvider: "dodo",
              gatewaySubscriptionId,
              gatewayCustomerId: d.customer?.customer_id ?? "",
              status: normalizeStatus(d.status ?? "trialing"),
              planId: d.product_id ?? "",
              currentPeriodEnd: d.next_billing_date ? new Date(d.next_billing_date) : null,
              updatedAt: new Date(),
            },
          });
        break;
      }

      case "subscription.status.updated": {
        const d = event.data;
        if (!d.subscription_id) break;

        await db
          .update(subscriptions)
          .set({
            status: normalizeStatus(d.status ?? "unpaid"),
            currentPeriodEnd: d.next_billing_date ? new Date(d.next_billing_date) : undefined,
            updatedAt: new Date(),
          })
          .where(eq(subscriptions.gatewaySubscriptionId, d.subscription_id));
        break;
      }

      default:
        // Unhandled event — acknowledge so DoDo stops retrying
        break;
    }
  } catch (err) {
    console.error("[dodo-webhook] DB error:", err);
    return new Response("Internal error", { status: 500 });
  }

  return new Response("OK", { status: 200 });
}
