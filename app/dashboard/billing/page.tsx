import { redirect } from "next/navigation";
import factoryConfig from "@/src/config/factory.config";
import { getServerContext } from "@/src/features/organizations";
import { db } from "@/src/lib/db";
import { subscriptions } from "@/src/lib/db/schema";
import { eq } from "drizzle-orm";
import { BillingClient } from "./_billing-client";

export default async function BillingPage() {
  if (!factoryConfig.businessModel.subscriptionEnabled) redirect("/dashboard");
  const context = await getServerContext();

  const subscription = await db.query.subscriptions.findFirst({
    where: eq(subscriptions.organizationId, context.organizationId),
  });

  return <BillingClient subscription={subscription ?? null} orgName={context.organizationName} />;
}
