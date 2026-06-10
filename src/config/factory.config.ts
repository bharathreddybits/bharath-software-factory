// ─── Product Information ──────────────────────────────────────────────────────

export interface LogoConfig {
  src: string;
  alt: string;
  width: number;
  height: number;
}

export interface ProductInfo {
  name: string;
  tagline: string;
  description: string;
  logo: LogoConfig;
  domain: string;
  supportEmail: string;
}

// ─── Branding ─────────────────────────────────────────────────────────────────

export interface ColorToken {
  /** CSS custom property value, e.g. "oklch(0.65 0.2 250)" */
  value: string;
  label: string;
}

export interface TypographyConfig {
  /** CSS font-family stack for the primary (sans) face */
  fontSans: string;
  /** CSS font-family stack for the monospace face */
  fontMono: string;
}

export interface BrandingConfig {
  primary: ColorToken;
  accent: ColorToken;
  neutral: ColorToken;
  typography: TypographyConfig;
}

// ─── Business Model ───────────────────────────────────────────────────────────

export interface BusinessModelConfig {
  subscriptionEnabled: boolean;
  oneTimePaymentsEnabled: boolean;
  aiUsageBillingEnabled: boolean;
}

// ─── Pricing Plans ────────────────────────────────────────────────────────────
// Plans drive the billing UI, payment gateway calls, and webhook reconciliation.
// Set dodoPlanId / razorpayPlanId after creating matching plans in each dashboard.

export interface PlanConfig {
  /** BSF-internal plan identifier used as form values and in logs */
  id: string;
  name: string;
  description: string;
  /** Highlight this plan as "most popular" in the pricing UI */
  highlighted: boolean;
  international: {
    /** Display price in USD */
    priceUsd: number;
    /** DoDo Payments product_id — set after creating in DoDo dashboard */
    dodoPlanId: string;
  };
  domestic: {
    /** Display price in INR */
    priceInr: number;
    /** Razorpay plan_id — set after creating in Razorpay dashboard */
    razorpayPlanId: string;
  };
  features: readonly string[];
}

// ─── Feature Module Toggles ───────────────────────────────────────────────────

export interface ModulesConfig {
  organizations: boolean;
  teamManagement: boolean;
  aiFeatures: boolean;
  realtimeFeatures: boolean;
  leaderboards: boolean;
  referrals: boolean;
}

// ─── SEO ──────────────────────────────────────────────────────────────────────

export interface OpenGraphConfig {
  title: string;
  description: string;
  /** Path to OG image — use "/opengraph-image" to serve the dynamic Next.js route */
  imageUrl: string;
}

export interface SitemapConfig {
  changeFrequency: "always" | "hourly" | "daily" | "weekly" | "monthly" | "yearly" | "never";
  priority: number;
}

export interface SeoConfig {
  metaTitle: string;
  metaDescription: string;
  openGraph: OpenGraphConfig;
  sitemap: SitemapConfig;
}

// ─── Legal ────────────────────────────────────────────────────────────────────

export interface LegalConfig {
  companyName: string;
  privacyPolicyUrl: string;
  termsUrl: string;
  cookiePolicyUrl: string;
}

// ─── Master Config ────────────────────────────────────────────────────────────

export interface FactoryConfig {
  product: ProductInfo;
  branding: BrandingConfig;
  businessModel: BusinessModelConfig;
  plans: readonly PlanConfig[];
  modules: ModulesConfig;
  seo: SeoConfig;
  legal: LegalConfig;
}

// ─── Singleton ────────────────────────────────────────────────────────────────
// Modify this file to rebrand the entire product in under 10 seconds.
// bsf-init.sh updates product.name, tagline, domain, supportEmail, seo fields,
// and legal.companyName automatically when scaffolding a new product.

const factoryConfig = {
  product: {
    name: "Bharath Software Factory",
    tagline: "Ship SaaS products 10× faster with AI.",
    description: "AI-native SaaS framework optimized for LLM context efficiency.",
    logo: {
      src: "/logo.svg",
      alt: "BSF Logo",
      width: 120,
      height: 40,
    },
    domain: "bharathsoftwarefactory.com",
    supportEmail: "support@bharathsoftwarefactory.com",
  },

  branding: {
    primary: {
      value: "oklch(0.55 0.22 250)",
      label: "BSF Blue",
    },
    accent: {
      value: "oklch(0.65 0.18 310)",
      label: "BSF Violet",
    },
    neutral: {
      value: "oklch(0.98 0 0)",
      label: "Near White",
    },
    typography: {
      fontSans: "var(--font-geist-sans), ui-sans-serif, system-ui, sans-serif",
      fontMono: "var(--font-geist-mono), ui-monospace, monospace",
    },
  },

  businessModel: {
    subscriptionEnabled: true,
    oneTimePaymentsEnabled: true,
    aiUsageBillingEnabled: true,
  },

  // ── Pricing plans ────────────────────────────────────────────────────────────
  // After creating plans in DoDo and Razorpay dashboards, paste the IDs here.
  // The billing UI, checkout actions, and webhook handlers all read from this array.
  plans: [
    {
      id: "starter",
      name: "Starter",
      description: "Great for indie makers and small projects.",
      highlighted: false,
      international: { priceUsd: 9, dodoPlanId: "" },
      domestic: { priceInr: 749, razorpayPlanId: "" },
      features: ["Up to 3 team members", "10K AI tokens / month", "Email support"],
    },
    {
      id: "pro",
      name: "Pro",
      description: "For growing teams that need more power.",
      highlighted: true,
      international: { priceUsd: 29, dodoPlanId: "" },
      domestic: { priceInr: 2499, razorpayPlanId: "" },
      features: [
        "Up to 15 team members",
        "100K AI tokens / month",
        "Priority support",
        "Custom domain",
      ],
    },
    {
      id: "enterprise",
      name: "Enterprise",
      description: "Unlimited scale with dedicated support.",
      highlighted: false,
      international: { priceUsd: 99, dodoPlanId: "" },
      domestic: { priceInr: 8499, razorpayPlanId: "" },
      features: [
        "Unlimited team members",
        "1M AI tokens / month",
        "Dedicated support",
        "SSO + SAML",
        "Custom SLA",
      ],
    },
  ],

  modules: {
    organizations: true,
    teamManagement: true,
    aiFeatures: true,
    realtimeFeatures: false,
    leaderboards: false,
    referrals: false,
  },

  seo: {
    metaTitle: "Bharath Software Factory — Ship SaaS 10× Faster",
    metaDescription:
      "AI-native SaaS boilerplate. Auth, payments, multi-tenancy, and AI tooling — production-ready from day one.",
    openGraph: {
      title: "Bharath Software Factory",
      description: "Ship SaaS products 10× faster with Claude Code and BSF.",
      imageUrl: "/opengraph-image",
    },
    sitemap: {
      changeFrequency: "weekly",
      priority: 0.8,
    },
  },

  legal: {
    companyName: "Bharath Software Factory",
    privacyPolicyUrl: "/legal/privacy",
    termsUrl: "/legal/terms",
    cookiePolicyUrl: "/legal/cookies",
  },
} as const satisfies FactoryConfig;

export default factoryConfig;
