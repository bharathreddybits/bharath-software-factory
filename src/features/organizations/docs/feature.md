# Organizations Feature

## What this feature owns

Auth context, multi-tenancy, membership roles, and the `getServerContext()` primitive.
Every authenticated server request passes through this feature.

## Schema intent

- `profiles` — 1:1 mirror of `auth.users`. Stores public display data only. Created by the
  `on_auth_user_created` trigger in `rls_policies.sql`; also upserted in `createOrganizationAction`
  as a safety net for edge cases where the trigger runs before the profile row exists.
- `organizations` — the billing and data-ownership tenant. One org per product workspace.
  `slug` is unique and URL-safe; generated automatically from the org name.
- `memberships` — bridge table between profiles and organizations. `role` enum:
  `owner > admin > member`. Role checks in Server Actions must read from this table
  via `getServerContext()`, never from client input.

## Key invariants

1. `getServerContext()` is the ONLY way to get auth context in Server Components and Server Actions.
   It is wrapped in `React.cache()` — calling it multiple times in one render is free.
2. The `organizationId` returned by `getServerContext()` is always the user's FIRST org
   (ordered by `createdAt`). Multi-org switching is not implemented — org switching requires
   a separate context resolution mechanism.
3. Creating an org bypasses RLS (done server-side with direct DB insert). Reading/updating
   orgs respects RLS via the `is_member_of()` helper in `rls_policies.sql`.
4. There is no "delete organization" flow. Implement carefully — cascade deletes will
   remove all memberships, subscriptions, and user data.

## What is explicitly NOT in scope

- Multi-org switching in a single session (one user → multiple orgs)
- Org transfer (changing ownership to another member)
- Org deletion UI
- SSO / SAML (schema supports it but no implementation exists)

## Cross-feature rules

Other features import ONLY from `@/src/features/organizations` (the barrel).
Never import from `@/src/features/organizations/db/get-context` directly.
