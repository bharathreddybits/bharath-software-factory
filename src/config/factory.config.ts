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
  modules: ModulesConfig;
  seo: SeoConfig;
  legal: LegalConfig;
}

// ─── Singleton ────────────────────────────────────────────────────────────────
// Modify this file to rebrand the entire product in under 10 seconds.

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
      imageUrl: "/og-image.png",
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
