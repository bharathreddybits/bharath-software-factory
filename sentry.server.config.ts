import * as Sentry from "@sentry/nextjs";

Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,

  // 10% of server transactions captured for performance tracing
  tracesSampleRate: 0.1,

  debug: false,
});
