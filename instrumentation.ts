export async function register() {
  const isProduction = process.env.NODE_ENV === "production";
  
  // Initialize Sentry for production
  if (isProduction) {
    if (process.env.NEXT_RUNTIME === "nodejs") {
      const Sentry = await import("@sentry/nextjs");
      Sentry.init({
        dsn: process.env.SENTRY_DSN,
        tracesSampleRate: 1,
        debug: false,
        skipOpenTelemetrySetup: true, // Prevent Sentry from auto-instrumenting OpenTelemetry spans
      });
      console.log("🛡️ Sentry: initialized for production");
    }
    return;
  }

  // Local development: use OpenTelemetry with Jaeger
  if (process.env.NEXT_RUNTIME === "nodejs") {
    const { NodeSDK } = await import("@opentelemetry/sdk-node");
    const { OTLPTraceExporter } = await import("@opentelemetry/exporter-trace-otlp-http");
    const { ATTR_SERVICE_NAME } = await import("@opentelemetry/semantic-conventions");
    const { SimpleSpanProcessor, ConsoleSpanExporter } = await import("@opentelemetry/sdk-trace-node");
    const { resourceFromAttributes } = await import("@opentelemetry/resources");

    console.log("🔭 OpenTelemetry: register() called (development mode)");


    // OTLP trace exporter to Jaeger
    const otlpExporter = new OTLPTraceExporter({
      url: process.env.OTEL_EXPORTER_OTLP_ENDPOINT
        ? `${process.env.OTEL_EXPORTER_OTLP_ENDPOINT}/v1/traces`
        : "http://localhost:4318/v1/traces",
    });

    const resource = resourceFromAttributes({
      [ATTR_SERVICE_NAME]: process.env.OTEL_SERVICE_NAME ?? "otel-nextjs",
    });

    const sdk = new NodeSDK({
      resource,
      spanProcessors: [
        new SimpleSpanProcessor(new ConsoleSpanExporter()),
        new SimpleSpanProcessor(otlpExporter),
      ],
    });

    sdk.start();
    console.log("🔭 OpenTelemetry: SDK started → Jaeger at http://localhost:16686");
  }
}
