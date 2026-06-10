# Subscriptions Feature

## What this feature owns

Payment gateway abstraction (`PaymentRouter`), checkout and cancellation server actions,
and the `subscriptions` table. One subscription row per organization.

## Schema intent

- `subscriptions` — one row per org, upserted by webhook handlers. Unique on `organization_id`
  (a new subscription for an org overwrites the old one via `onConflictDoUpdate`).
- `planId` stores the BSF internal plan ID (e.g. `"starter"`, `"pro"`, `"enterprise"`),
  NOT the gateway's plan ID. Reconcile with `factoryConfig.plans` by `.find(p => p.id === planId)`.
- `gatewaySubscriptionId` is the gateway's subscription identifier (DoDo sub ID or Razorpay sub ID).
- `gatewayCustomerId` is the gateway's customer identifier — used for portal/management flows.

## Key invariants

1. **Webhooks are the ONLY writers to `subscriptions`.** Server Actions must never INSERT or
   UPDATE the subscriptions table directly. This prevents race conditions with gateway events.
2. `PaymentRouter` abstracts DoDo (international) vs Razorpay (India). Never call gateway
   APIs directly from pages or components.
3. Plan IDs in `factoryConfig.plans[].international.dodoPlanId` and
   `factoryConfig.plans[].domestic.razorpayPlanId` must be set before checkout works.
   Both default to `""` — calling checkout with empty IDs throws a descriptive error.
4. Checkout actions use `getServerContext()` for auth and `organizationId`. The `subscriptionId`
   in cancellation forms is verified against the session org before any gateway call.

## Gateway routing logic

`createCheckoutSession(orgId, planId, email, isDomestic)`:
- `isDomestic = true` → Razorpay (India, INR, client-side modal)
- `isDomestic = false` → DoDo Payments (international, USD, server redirect)

Razorpay checkout returns order data to the client; the `_billing-client.tsx` opens the
Razorpay SDK modal. DoDo issues a redirect URL which triggers `redirect()` server-side.

## What is explicitly NOT in scope

- Usage-based billing (AI token billing is separate via `ai_usage` table)
- One-time payments (schema/router only covers subscriptions)
- Proration or mid-cycle plan changes
- Subscription portal / customer self-service billing management

## Cross-feature rules

Other features import ONLY from `@/src/features/subscriptions` (the barrel).
`subscriptions/api/actions.ts` may import from `@/src/features/organizations` (the barrel)
for `getServerContext()`. No other cross-feature imports are permitted.
