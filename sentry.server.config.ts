import * as Sentry from "@sentry/nextjs";

// Only initialize Sentry in production (instrumentation.ts handles the switch)
if (process.env.NODE_ENV === "production") {
  Sentry.init({
    dsn: process.env.SENTRY_DSN,

    // Set tracesSampleRate to 1.0 to capture 100% of transactions for tracing.
    tracesSampleRate: 1,

    // Set to false in production
    debug: false,
  });
}
