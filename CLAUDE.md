@AGENTS.md

# BSF Boilerplate — Claude Code Guide

This is the Bharath Software Factory (BSF) boilerplate. Every decision below is intentional.
Read this before writing any code.

---

## Core Invariants

**`src/config/factory.config.ts` is the single source of truth.**
Never hardcode product names, URLs, domains, prices, or branding. Always read from `factoryConfig`.
The entire product rebrands by editing this one file.

**`getServerContext()` must be called at the top of every Server Component and Server Action.**
It enforces auth + org invariants (redirect to /login or /onboarding if violated) and returns
`UserContext` with `{ userId, email, organizationId, organizationName, role }`.
It is wrapped in `React.cache()` — calling it twice in one render is free.

**RLS is the primary security layer. Application checks are defense-in-depth.**
The Supabase `anon` key respects RLS policies in `supabase/rls_policies.sql`.
The `SUPABASE_SERVICE_ROLE_KEY` bypasses RLS — use it only in Route Handlers and webhooks,
never in Client Components or Server Components that render user-facing data.

---

## Adding a New Page

```
1. Create app/dashboard/<name>/page.tsx
2. Call: const context = await getServerContext()
3. If module-gated: if (!factoryConfig.modules.<x>) redirect("/dashboard")
4. Import UI from src/features/<name>/ui/ — NOT inline in the page
```

Example skeleton:
```tsx
import { redirect } from "next/navigation";
import { getServerContext } from "@/src/features/organizations/db/get-context";
import factoryConfig from "@/src/config/factory.config";

export default async function MyPage() {
  if (!factoryConfig.modules.myFeature) redirect("/dashboard");
  const context = await getServerContext();
  return <div>{context.organizationName}</div>;
}
```

---

## Adding a New Server Action

Every mutating Server Action MUST follow this pattern:

```typescript
"use server";
export async function myAction(_prev: State, formData: FormData): Promise<State> {
  // 1. Auth
  const { userId, organizationId, role } = await getServerContext();

  // 2. Role gate (for owner-only operations)
  if (role !== "owner") return { error: "Only owners can do this." };

  // 3. Zod input validation
  const input = InputSchema.safeParse(Object.fromEntries(formData));
  if (!input.success) return { error: input.error.issues[0].message };

  // 4. Ownership check — ALWAYS use organizationId from session, NEVER from client input
  const resource = await db.query.things.findFirst({
    where: and(eq(things.id, input.data.id), eq(things.organizationId, organizationId)),
  });
  if (!resource) return { error: "Not found." };

  // 5. Mutate
}
```

**Never trust `subscriptionId`, `orgId`, or any other ID from `formData` without verifying it
belongs to the current user's org. Skipping the ownership check is an IDOR vulnerability.**

---

## Feature Module Structure

Each feature in `src/features/<name>/` is self-contained:

```
src/features/
  <name>/
    index.ts          <- barrel export — only import features through this
    db/               <- Drizzle queries + getServerContext
    api/              <- Server Actions + Route Handler helpers
    ui/               <- React components for this feature
```

Do NOT import from `src/features/<a>/db/` in `src/features/<b>/`. All cross-feature
communication goes through the public `index.ts` barrel.

Do NOT put business logic in `app/`. Pages are thin — they call `getServerContext()`,
pass context to feature UI components, and handle module guards.

---

## Payment System

`PaymentRouter` in `src/features/subscriptions/api/router.ts` abstracts DoDo vs Razorpay.
Never call gateway APIs directly from pages or components.

Pricing lives in `factoryConfig.plans[]`. After creating plans in DoDo and Razorpay dashboards,
paste the returned plan IDs into `factoryConfig.plans[].international.dodoPlanId` and
`factoryConfig.plans[].domestic.razorpayPlanId`.

Webhook handlers (`app/api/webhooks/billing/`) are the ONLY writers to the `subscriptions` table.
They use the service role key. Never write to `subscriptions` from Server Actions.

---

## Database

Schema is in `src/lib/db/schema.ts`. Drizzle ORM.
Migrations are in `supabase/migrations/`. Generate with `npx drizzle-kit generate`.
Apply with `npx drizzle-kit push` (dev) or `supabase db push` (prod).

Every user-data table has `organizationId` FK. All queries must filter by `organizationId`
from `getServerContext()` — never from client input.

---

## UI Components

ShadCN base-nova variant. **`asChild` prop does NOT exist on Button** — this variant uses
Base UI, not Radix. For link-buttons, wrap Link inside Button:
```tsx
<Button size="sm"><Link href="/somewhere">Go</Link></Button>  <- correct
<Button asChild><Link href="/somewhere">Go</Link></Button>    <- TypeScript error
```

Installed primitives: Button, Input, Label, Card (CardContent/Header/Title/Description).
Add more with: `npx shadcn@latest add <component>`

Dark theme defaults: `bg-zinc-950`, `text-white`, `text-zinc-400` (muted).

Brand colors are in `factoryConfig.branding` and injected as CSS vars in `app/layout.tsx`:
- `var(--color-primary)` — primary brand color
- `var(--color-accent)` — accent color
- `var(--color-neutral)` — neutral near-white

---

## Auth Flow

Auth clients — use the right one for the context:
- `src/lib/supabase/server.ts` -> Server Components, Server Actions
- `src/lib/supabase/client.ts` -> Client Components
- `src/lib/supabase/middleware.ts` -> `src/middleware.ts` only
- `getSupabaseAdmin()` -> Route Handlers, webhooks (bypasses RLS)

OAuth and email confirmation require `/auth/callback` — it exists at
`app/auth/callback/route.ts`. Set the Supabase redirect URL to:
`https://<your-domain>/auth/callback`

---

## AI Module

The streaming edge route is `app/api/ai/stream/route.ts`.
- System prompt reads from `factoryConfig.product.name` — do not hardcode.
- Rate limiting via Upstash Redis — no-ops if `UPSTASH_REDIS_REST_URL` is unset (safe for local dev).
- Usage is logged to the `ai_usage` table in `onFinish` — never crashes the active stream.
- Model costs are defined in `COST_PER_TOKEN` at the top of the route file.

---

## AI Personas

Before implementing, load the relevant persona:

| Task | Command |
|------|---------|
| Any code | `/read src/ai/staff-engineer.md` |
| API / DB / webhooks | `/read src/ai/backend-engineer.md` |
| UI / components | `/read src/ai/frontend-engineer.md` |
| Auth / secrets / RLS | `/read src/ai/security-engineer.md` |
| Feature scoping | `/read src/ai/product-manager.md` |
| Landing page / design | `/read src/ai/designer.md` |
| Analytics / growth | `/read src/ai/growth-marketer.md` |

---

## Environment Variables

All secrets in `.env.local` (never committed). Template is `.env.example`.
Key vars:
- `NEXT_PUBLIC_APP_URL` — full app URL (e.g. `https://myapp.com`). Used in payment redirect URLs.
- `SUPABASE_SERVICE_ROLE_KEY` — bypasses RLS. Server-only. Never expose to browser.
- `ANTHROPIC_API_KEY` — Claude API. Required for AI chat.
- `DODO_PAYMENTS_API_KEY` / `DODO_PAYMENTS_WEBHOOK_SECRET` — DoDo (international payments).
- `RAZORPAY_KEY_ID` / `RAZORPAY_KEY_SECRET` / `RAZORPAY_WEBHOOK_SECRET` — Razorpay (India).

---

## Common Mistakes to Avoid

1. **Hardcoding product name, domain, or prices** — always use `factoryConfig`.
2. **Using `asChild` on Button** — use inner-Link pattern instead.
3. **Calling Supabase admin client from a page** — use it only in Route Handlers.
4. **Writing to `subscriptions` table from Server Actions** — webhooks only.
5. **Skipping ownership check in Server Actions** — IDOR vulnerability.
6. **Importing from `src/features/<a>/db/` in another feature** — use barrel exports.
7. **Using `user.email!` non-null assertion** — use `user.email ?? ""` for OAuth compatibility.
