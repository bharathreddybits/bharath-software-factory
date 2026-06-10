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
const authSchema = pgSchema("auth");
const authUsers = authSchema.table("users", {
  id: uuid("id").primaryKey().notNull(),
});

// ── Enums ─────────────────────────────────────────────────────────────────────

export const membershipRoleEnum = pgEnum("membership_role", ["owner", "admin", "member"]);

export const gatewayProviderEnum = pgEnum("gateway_provider", ["dodo", "razorpay"]);

export const subscriptionStatusEnum = pgEnum("subscription_status", [
  "active",
  "trialing",
  "past_due",
  "canceled",
  "unpaid",
]);

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

// Active subscription per organization — one row per org, upserted by webhooks
export const subscriptions = pgTable(
  "subscriptions",
  {
    id: uuid("id").primaryKey().defaultRandom().notNull(),
    organizationId: uuid("organization_id")
      .notNull()
      .references(() => organizations.id, { onDelete: "cascade" }),
    gatewayProvider: gatewayProviderEnum("gateway_provider").notNull(),
    gatewaySubscriptionId: text("gateway_subscription_id").notNull().unique(),
    gatewayCustomerId: text("gateway_customer_id").notNull(),
    status: subscriptionStatusEnum("status").notNull().default("trialing"),
    planId: text("plan_id").notNull(),
    currentPeriodEnd: timestamp("current_period_end", { withTimezone: true }),
    updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow(),
  },
  (table) => [uniqueIndex("subscriptions_org_idx").on(table.organizationId)]
);

// ── Relations ─────────────────────────────────────────────────────────────────

export const profilesRelations = relations(profiles, ({ many }) => ({
  memberships: many(memberships),
  aiUsage: many(aiUsage),
}));

export const organizationsRelations = relations(organizations, ({ many, one }) => ({
  memberships: many(memberships),
  aiUsage: many(aiUsage),
  subscription: one(subscriptions, {
    fields: [organizations.id],
    references: [subscriptions.organizationId],
  }),
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

export const subscriptionsRelations = relations(subscriptions, ({ one }) => ({
  organization: one(organizations, {
    fields: [subscriptions.organizationId],
    references: [organizations.id],
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

export type Subscription = typeof subscriptions.$inferSelect;
export type NewSubscription = typeof subscriptions.$inferInsert;
export type GatewayProvider = (typeof gatewayProviderEnum.enumValues)[number];
export type SubscriptionStatus = (typeof subscriptionStatusEnum.enumValues)[number];
