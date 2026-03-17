// instrumentation.ts
import { registerOTel } from '@vercel/otel';

export function register() {
  console.log("Registering OpenTelemetry instrumentation...");
  registerOTel('next-app')
}