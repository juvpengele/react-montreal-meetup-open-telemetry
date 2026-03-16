import type { SpanProcessor } from "@opentelemetry/sdk-trace-node";

function resolveOtlpEndpoint(isProduction: boolean): string | undefined {
  if (isProduction) return undefined;
  const configured = process.env.OTEL_EXPORTER_OTLP_ENDPOINT;
  return configured ? `${configured}/v1/traces` : "http://localhost:4318/v1/traces";
}

async function buildSpanProcessors(isProduction: boolean): Promise<SpanProcessor[]> {
  const { SimpleSpanProcessor, ConsoleSpanExporter, BatchSpanProcessor } = await import("@opentelemetry/sdk-trace-node");
  const { OTLPTraceExporter } = await import("@opentelemetry/exporter-trace-otlp-http");
  const spanProcessors: SpanProcessor[] = [];

  const otlpEndpoint = resolveOtlpEndpoint(isProduction);
  spanProcessors.push(
    new SimpleSpanProcessor(new ConsoleSpanExporter()),
    new BatchSpanProcessor(new OTLPTraceExporter({ url: otlpEndpoint }))
  );
  return spanProcessors;
}

async function startNodeSDK(isProduction: boolean) {
  const { NodeSDK } = await import("@opentelemetry/sdk-node");
  const { ATTR_SERVICE_NAME } = await import("@opentelemetry/semantic-conventions");
  const { resourceFromAttributes } = await import("@opentelemetry/resources");
  const { getNodeAutoInstrumentations } = await import("@opentelemetry/auto-instrumentations-node");

  const spanProcessors = await buildSpanProcessors(isProduction);

  const resource = resourceFromAttributes({
    [ATTR_SERVICE_NAME]: process.env.OTEL_SERVICE_NAME ?? "otel-nextjs",
  });

  const sdk = new NodeSDK({
    resource,
    spanProcessors,
    instrumentations: [
      getNodeAutoInstrumentations({
        '@opentelemetry/instrumentation-fs': { enabled: false },
      }),
    ],
  });

  sdk.start();
  console.log(`🔭 OpenTelemetry: SDK started → ${isProduction ? 'production' : 'Jaeger at http://localhost:16686'}`);
}

export async function register() {
  if (process.env.NEXT_RUNTIME !== "nodejs") return;

  const isProduction = process.env.NODE_ENV === "production";
  console.log(`🔭 OpenTelemetry: register() called (${isProduction ? 'production' : 'development'} mode)`);

  await startNodeSDK(isProduction);
}
