"use server";

// NOTE: This action intentionally does NOT call getServerContext().
// getServerContext() redirects to /onboarding when the user has no org.
// This action IS the step that creates the org — using it here would loop.
// See CLAUDE.md "Core Invariants" for the documented exception.

import { redirect } from "next/navigation";
import { eq } from "drizzle-orm";
import { createClient } from "@/src/lib/supabase/server";
import { db } from "@/src/lib/db";
import { organizations, memberships, profiles } from "@/src/lib/db/schema";

export type OnboardingActionState = { error: string } | null;

function toSlug(name: string): string {
  return (
    name
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "") || "org"
  );
}

async function uniqueSlug(base: string): Promise<string> {
  const existing = await db
    .select({ id: organizations.id })
    .from(organizations)
    .where(eq(organizations.slug, base))
    .limit(1);

  if (existing.length === 0) return base;

  // Append a random 5-char alphanumeric suffix
  const suffix = Math.random().toString(36).slice(2, 7);
  return `${base}-${suffix}`;
}

export async function createOrganizationAction(
  _prevState: OnboardingActionState,
  formData: FormData
): Promise<OnboardingActionState> {
  const name = ((formData.get("name") as string | null) ?? "").trim();
  if (!name || name.length < 2) {
    return { error: "Organization name must be at least 2 characters." };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: "Session expired. Please sign in again." };
  }

  const slug = await uniqueSlug(toSlug(name));

  // Ensure a profiles row exists for this user (idempotent upsert)
  await db.insert(profiles).values({ id: user.id }).onConflictDoNothing();

  const [org] = await db
    .insert(organizations)
    .values({ name, slug })
    .returning({ id: organizations.id });

  await db.insert(memberships).values({
    profileId: user.id,
    organizationId: org.id,
    role: "owner",
  });

  redirect("/dashboard");
}
