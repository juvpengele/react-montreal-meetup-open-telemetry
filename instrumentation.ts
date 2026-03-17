// instrumentation.ts
import { registerOTel } from '@vercel/otel';

export function register() {
console.log('🔭 instrumentation.ts → register() called, runtime:', process.env.NEXT_RUNTIME)
  registerOTel('next-app')
}