import { getServerContext } from "@/src/features/organizations/db/get-context";
import { db } from "@/src/lib/db";
import { subscriptions } from "@/src/lib/db/schema";
import { eq } from "drizzle-orm";
import { BillingClient } from "./_billing-client";

export default async function BillingPage() {
  const context = await getServerContext();

  const subscription = await db.query.subscriptions.findFirst({
    where: eq(subscriptions.organizationId, context.organizationId),
  });

  return <BillingClient subscription={subscription ?? null} orgName={context.organizationName} />;
}
