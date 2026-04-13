import { createEnv } from '@t3-oss/env-nextjs'
import { z } from 'zod'
import { sharedClient, sharedRuntimeEnv, sharedServer } from './shared'

export const env = createEnv({
  server: {
    ...sharedServer,
    CONSOLE_BASE_DOMAIN: z.string().min(1), // ex: vellofinance.com.br
    NODE_ENV: z.enum(['development', 'test', 'production']),
    RESEND_API_KEY: z.string().min(1),
  },
  client: {
    ...sharedClient,
  },
  runtimeEnv: {
    ...sharedRuntimeEnv,
    CONSOLE_BASE_DOMAIN: process.env.CONSOLE_BASE_DOMAIN,
    NODE_ENV: process.env.NODE_ENV,
    RESEND_API_KEY: process.env.RESEND_API_KEY,
  },
  emptyStringAsUndefined: true,
})
