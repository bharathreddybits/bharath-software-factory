import type { NextConfig } from "next";
import { withSentryConfig } from "@sentry/nextjs";

const nextConfig: NextConfig = {
  /* config options here */
};

export default withSentryConfig(nextConfig, {
  // ── Source map upload ──────────────────────────────────────────────────────
  org: process.env.SENTRY_ORG,
  project: process.env.SENTRY_PROJECT,
  authToken: process.env.SENTRY_AUTH_TOKEN,

  // Silence Sentry output outside CI to keep local builds clean
  silent: !process.env.CI,

  // Upload larger client-side source files for better stack traces
  widenClientFileUpload: true,

  // Route Sentry SDK calls through /monitoring to bypass ad-blockers
  tunnelRoute: "/monitoring",
});
