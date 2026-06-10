"use client";

import { useEffect } from "react";
import posthog from "posthog-js";
import { PostHogProvider } from "posthog-js/react";
import { POSTHOG_CONFIG } from "./posthog";

export { usePostHog } from "posthog-js/react";

type Props = { children: React.ReactNode };

export function AnalyticsProvider({ children }: Props) {
  useEffect(() => {
    if (!POSTHOG_CONFIG.key) return;
    posthog.init(POSTHOG_CONFIG.key, {
      api_host: POSTHOG_CONFIG.host,
      capture_pageview: false, // handled manually to avoid double-counting
      capture_pageleave: true,
      persistence: "localStorage+cookie",
    });
  }, []);

  if (!POSTHOG_CONFIG.key) {
    return <>{children}</>;
  }

  return (
    <PostHogProvider apiKey={POSTHOG_CONFIG.key} options={{ api_host: POSTHOG_CONFIG.host }}>
      {children}
    </PostHogProvider>
  );
}
