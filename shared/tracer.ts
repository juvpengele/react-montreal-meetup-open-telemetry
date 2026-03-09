import { trace } from "@opentelemetry/api";

export const tracer = trace.getTracer("otel-nextjs", "1.0.0");
