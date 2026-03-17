// instrumentation.ts
import { registerOTel } from '@vercel/otel'

export function register() {
  if (process.env.NEXT_RUNTIME !== 'nodejs') return

  registerOTel({
    serviceName: process.env.OTEL_SERVICE_NAME ?? 'otel-nextjs',
  })
}