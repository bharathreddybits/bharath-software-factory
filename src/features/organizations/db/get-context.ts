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
 * Call this at the top of any Server Component or Server Action that needs
 * the current user + org. It enforces three invariants:
 *   - Unauthenticated  → redirect /login
 *   - 0 organizations  → redirect /onboarding  (newly signed-up user)
 *   - ≥ 1 organization → return context
 */
export async function getServerContext(): Promise<UserContext> {
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
    // Authenticated but not yet part of any org — send to onboarding
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
}
