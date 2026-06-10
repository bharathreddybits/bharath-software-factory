// ── PostHog server-side analytics ─────────────────────────────────────────────
// Use trackServerEvent inside Server Actions and Route Handlers.
// The client-side provider lives in ./provider.tsx.

export const POSTHOG_CONFIG = {
  key: process.env.NEXT_PUBLIC_POSTHOG_KEY ?? "",
  host: process.env.NEXT_PUBLIC_POSTHOG_HOST ?? "https://us.i.posthog.com",
};

type EventProperties = Record<string, string | number | boolean | null | undefined>;

/**
 * Capture a server-side event to PostHog via REST.
 * Safe to call from Server Actions, Route Handlers, and background jobs.
 * No-ops if NEXT_PUBLIC_POSTHOG_KEY is not set.
 */
export async function trackServerEvent(
  distinctId: string,
  event: string,
  properties: EventProperties = {}
): Promise<void> {
  const key = POSTHOG_CONFIG.key;
  if (!key) return;

  try {
    await fetch(`${POSTHOG_CONFIG.host}/capture/`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        api_key: key,
        distinct_id: distinctId,
        event,
        properties: { ...properties, $lib: "bsf-server" },
        timestamp: new Date().toISOString(),
      }),
    });
  } catch {
    // Analytics failures must never crash the main path
  }
}
