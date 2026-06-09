import {
  pgTable,
  pgSchema,
  pgEnum,
  uuid,
  text,
  integer,
  numeric,
  timestamp,
  uniqueIndex,
} from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";

// ── External schema stub — Supabase auth ──────────────────────────────────────
// Declaring auth.users here tells Drizzle it lives in the "auth" schema managed
// by Supabase. Drizzle will emit the correct qualified FK reference in migrations
// and will never attempt to CREATE or DROP this table.

const authSchema = pgSchema("auth");

const authUsers = authSchema.table("users", {
  id: uuid("id").primaryKey().notNull(),
});

// ── Enums ─────────────────────────────────────────────────────────────────────

export const membershipRoleEnum = pgEnum("membership_role", ["owner", "admin", "member"]);

// ── Tables ────────────────────────────────────────────────────────────────────

// 1:1 with auth.users — stores public profile data only
export const profiles = pgTable("profiles", {
  id: uuid("id")
    .primaryKey()
    .notNull()
    .references(() => authUsers.id, { onDelete: "cascade" }),
  fullName: text("full_name"),
  avatarUrl: text("avatar_url"),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow(),
});

// Billing/data ownership tenant — every row of user-generated data belongs to one org
export const organizations = pgTable(
  "organizations",
  {
    id: uuid("id").primaryKey().defaultRandom().notNull(),
    name: text("name").notNull(),
    slug: text("slug").notNull(),
    stripeCustomerId: text("stripe_customer_id"),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
  },
  (table) => [uniqueIndex("organizations_slug_idx").on(table.slug)]
);

// Multi-tenant bridge — which users belong to which org and with what role
export const memberships = pgTable("memberships", {
  id: uuid("id").primaryKey().defaultRandom().notNull(),
  profileId: uuid("profile_id")
    .notNull()
    .references(() => profiles.id, { onDelete: "cascade" }),
  organizationId: uuid("organization_id")
    .notNull()
    .references(() => organizations.id, { onDelete: "cascade" }),
  role: membershipRoleEnum("role").notNull().default("member"),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
});

// Per-request AI usage ledger — tied to both the org (billing) and the user (audit)
export const aiUsage = pgTable("ai_usage", {
  id: uuid("id").primaryKey().defaultRandom().notNull(),
  organizationId: uuid("organization_id")
    .notNull()
    .references(() => organizations.id, { onDelete: "cascade" }),
  userId: uuid("user_id")
    .notNull()
    .references(() => profiles.id, { onDelete: "cascade" }),
  provider: text("provider").notNull(),
  model: text("model").notNull(),
  promptTokens: integer("prompt_tokens").notNull().default(0),
  completionTokens: integer("completion_tokens").notNull().default(0),
  totalTokens: integer("total_tokens").notNull().default(0),
  estimatedCost: numeric("estimated_cost", { precision: 10, scale: 6 }),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
});

// ── Relations ─────────────────────────────────────────────────────────────────

export const profilesRelations = relations(profiles, ({ many }) => ({
  memberships: many(memberships),
  aiUsage: many(aiUsage),
}));

export const organizationsRelations = relations(organizations, ({ many }) => ({
  memberships: many(memberships),
  aiUsage: many(aiUsage),
}));

export const membershipsRelations = relations(memberships, ({ one }) => ({
  profile: one(profiles, {
    fields: [memberships.profileId],
    references: [profiles.id],
  }),
  organization: one(organizations, {
    fields: [memberships.organizationId],
    references: [organizations.id],
  }),
}));

export const aiUsageRelations = relations(aiUsage, ({ one }) => ({
  organization: one(organizations, {
    fields: [aiUsage.organizationId],
    references: [organizations.id],
  }),
  user: one(profiles, {
    fields: [aiUsage.userId],
    references: [profiles.id],
  }),
}));

// ── Inferred Types ────────────────────────────────────────────────────────────

export type Profile = typeof profiles.$inferSelect;
export type NewProfile = typeof profiles.$inferInsert;

export type Organization = typeof organizations.$inferSelect;
export type NewOrganization = typeof organizations.$inferInsert;

export type Membership = typeof memberships.$inferSelect;
export type NewMembership = typeof memberships.$inferInsert;
export type MembershipRole = (typeof membershipRoleEnum.enumValues)[number];

export type AiUsage = typeof aiUsage.$inferSelect;
export type NewAiUsage = typeof aiUsage.$inferInsert;
