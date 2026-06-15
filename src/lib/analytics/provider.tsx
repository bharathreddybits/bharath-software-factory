"use client";

import { PostHogProvider } from "posthog-js/react";
import { POSTHOG_CONFIG } from "./posthog";

export { usePostHog } from "posthog-js/react";

type Props = { children: React.ReactNode };

export function AnalyticsProvider({ children }: Props) {
  if (!POSTHOG_CONFIG.key) {
    return <>{children}</>;
  }

  return (
    <PostHogProvider
      apiKey={POSTHOG_CONFIG.key}
      options={{
        api_host: POSTHOG_CONFIG.host,
        capture_pageview: false,
        capture_pageleave: true,
        persistence: "localStorage+cookie",
      }}
    >
      {children}
    </PostHogProvider>
  );
}
