import { cache } from "react";
import { redirect } from "next/navigation";
import { createClient } from "@/src/lib/supabase/server";
import { db } from "@/src/lib/db";
import { memberships, organizations } from "@/src/lib/db/schema";
import { eq } from "drizzle-orm";
import type { MembershipRole } from "@/src/lib/db/schema";

export type UserContext = {
  userId: string;
  email: string;
  organizationId: string;
  organizationName: string;
  role: MembershipRole;
};

/**
 * Returns the authenticated user's active organization context.
 *
 * Wrapped in React.cache() — deduplicates calls within a single render pass so
 * layout + page both calling this makes only one Supabase auth request + one DB query.
 *
 * Enforces three invariants:
 *   - Unauthenticated  → redirect /login
 *   - 0 organizations  → redirect /onboarding  (newly signed-up user)
 *   - ≥ 1 organization → return context
 */
export const getServerContext = cache(async function (): Promise<UserContext> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const rows = await db
    .select({
      organizationId: memberships.organizationId,
      role: memberships.role,
      organizationName: organizations.name,
    })
    .from(memberships)
    .innerJoin(organizations, eq(memberships.organizationId, organizations.id))
    .where(eq(memberships.profileId, user.id))
    .orderBy(memberships.createdAt)
    .limit(1);

  if (rows.length === 0) {
    redirect("/onboarding");
  }

  const { organizationId, role, organizationName } = rows[0];

  return {
    userId: user.id,
    email: user.email ?? "",
    organizationId,
    organizationName,
    role,
  };
});
