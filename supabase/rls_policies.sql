-- ─────────────────────────────────────────────────────────────────────────────
-- Bharath Software Factory — Row Level Security Policies
--
-- Run this script once against your Supabase project after applying migrations.
-- Supabase Dashboard → SQL Editor, or: supabase db push
--
-- Design principle: every data row is owned by an organization. A user can
-- only see or modify data for organizations they have an active membership in.
-- The service_role key (used server-side only) bypasses all RLS.
-- ─────────────────────────────────────────────────────────────────────────────

-- ── Step 0: Auto-create public profile on auth user creation ─────────────────
-- This trigger fires whenever Supabase creates a new row in auth.users, so a
-- corresponding profiles row always exists before the user reaches the app.

CREATE OR REPLACE FUNCTION public.handle_new_auth_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, avatar_url)
  VALUES (
    NEW.id,
    NEW.raw_user_meta_data ->> 'full_name',
    NEW.raw_user_meta_data ->> 'avatar_url'
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$;

CREATE OR REPLACE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE PROCEDURE public.handle_new_auth_user();

-- ── Step 1: Enable RLS on every table ────────────────────────────────────────

ALTER TABLE profiles         ENABLE ROW LEVEL SECURITY;
ALTER TABLE organizations    ENABLE ROW LEVEL SECURITY;
ALTER TABLE memberships      ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_usage         ENABLE ROW LEVEL SECURITY;
ALTER TABLE subscriptions    ENABLE ROW LEVEL SECURITY;

-- ── Step 2: Helper function — membership check ───────────────────────────────
-- Encapsulates the "is the current user a member of this org?" check so all
-- downstream policies stay readable and consistent.

CREATE OR REPLACE FUNCTION is_member_of(org_id uuid)
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER   -- runs as table owner; prevents infinite RLS recursion
STABLE
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM memberships
    WHERE memberships.profile_id    = auth.uid()
      AND memberships.organization_id = org_id
  );
$$;

-- ─────────────────────────────────────────────────────────────────────────────
-- TABLE: profiles
--
-- 1:1 mirror of auth.users. Users can only read and modify their own row.
-- ─────────────────────────────────────────────────────────────────────────────

-- A user can view their own profile row
CREATE POLICY "profiles: select own"
  ON profiles
  FOR SELECT
  USING (auth.uid() = id);

-- A user can update their own profile row (full_name, avatar_url, etc.)
CREATE POLICY "profiles: update own"
  ON profiles
  FOR UPDATE
  USING     (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- A user can insert their own profile (called by a post-signup DB trigger)
CREATE POLICY "profiles: insert own"
  ON profiles
  FOR INSERT
  WITH CHECK (auth.uid() = id);

-- ─────────────────────────────────────────────────────────────────────────────
-- TABLE: organizations
--
-- Members can read their org; only owners/admins can mutate it.
-- Creating an org is handled server-side via service_role (bypasses RLS).
-- ─────────────────────────────────────────────────────────────────────────────

-- Any member of an org can read its record
CREATE POLICY "organizations: select members"
  ON organizations
  FOR SELECT
  USING (is_member_of(id));

-- Only owners and admins can update the org record (name, slug, etc.)
CREATE POLICY "organizations: update admins"
  ON organizations
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1
      FROM memberships
      WHERE memberships.profile_id      = auth.uid()
        AND memberships.organization_id = organizations.id
        AND memberships.role            IN ('owner', 'admin')
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1
      FROM memberships
      WHERE memberships.profile_id      = auth.uid()
        AND memberships.organization_id = organizations.id
        AND memberships.role            IN ('owner', 'admin')
    )
  );

-- Only owners can delete an org
CREATE POLICY "organizations: delete owners"
  ON organizations
  FOR DELETE
  USING (
    EXISTS (
      SELECT 1
      FROM memberships
      WHERE memberships.profile_id      = auth.uid()
        AND memberships.organization_id = organizations.id
        AND memberships.role            = 'owner'
    )
  );

-- ─────────────────────────────────────────────────────────────────────────────
-- TABLE: memberships
--
-- Members can see all other members in their shared orgs (needed for team UI).
-- Only owners can invite (INSERT) or change roles (UPDATE).
-- Members can remove themselves; owners can remove anyone.
-- ─────────────────────────────────────────────────────────────────────────────

-- Any member of an org can see all membership rows for that org
CREATE POLICY "memberships: select org members"
  ON memberships
  FOR SELECT
  USING (is_member_of(organization_id));

-- Only an owner of the org can add new members
CREATE POLICY "memberships: insert owners"
  ON memberships
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1
      FROM memberships m
      WHERE m.profile_id      = auth.uid()
        AND m.organization_id = memberships.organization_id
        AND m.role            = 'owner'
    )
  );

-- Only an owner of the org can change a member's role
CREATE POLICY "memberships: update owners"
  ON memberships
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1
      FROM memberships m
      WHERE m.profile_id      = auth.uid()
        AND m.organization_id = memberships.organization_id
        AND m.role            = 'owner'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1
      FROM memberships m
      WHERE m.profile_id      = auth.uid()
        AND m.organization_id = memberships.organization_id
        AND m.role            = 'owner'
    )
  );

-- Members can leave (delete own row); owners can remove any member
CREATE POLICY "memberships: delete own or owner"
  ON memberships
  FOR DELETE
  USING (
    profile_id = auth.uid()
    OR EXISTS (
      SELECT 1
      FROM memberships m
      WHERE m.profile_id      = auth.uid()
        AND m.organization_id = memberships.organization_id
        AND m.role            = 'owner'
    )
  );

-- ─────────────────────────────────────────────────────────────────────────────
-- TABLE: ai_usage
--
-- Members can read usage records for their orgs (billing transparency).
-- Members can insert their own usage rows for orgs they belong to.
-- No UPDATE or DELETE — usage records are append-only audit logs.
-- ─────────────────────────────────────────────────────────────────────────────

-- Any member of an org can view AI usage records for that org
CREATE POLICY "ai_usage: select members"
  ON ai_usage
  FOR SELECT
  USING (is_member_of(organization_id));

-- Members can record their own AI usage against their org
CREATE POLICY "ai_usage: insert members"
  ON ai_usage
  FOR INSERT
  WITH CHECK (
    is_member_of(organization_id)
    AND auth.uid() = user_id
  );

-- ─────────────────────────────────────────────────────────────────────────────
-- TABLE: subscriptions
--
-- Written exclusively by webhook handlers via service_role (bypasses RLS).
-- Members can read their org's subscription for billing transparency.
-- No INSERT/UPDATE/DELETE from client-side.
-- ─────────────────────────────────────────────────────────────────────────────

CREATE POLICY "subscriptions: select members"
  ON subscriptions
  FOR SELECT
  USING (is_member_of(organization_id));
