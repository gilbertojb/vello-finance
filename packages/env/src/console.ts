// packages/env/src/console.ts
import { createEnv } from '@t3-oss/env-nextjs'
import { z } from 'zod'
import { sharedClient, sharedRuntimeEnv, sharedServer } from './shared'

export const env = createEnv({
  server: {
    ...sharedServer,
    CONSOLE_BASE_DOMAIN: z.string().min(1), // ex: vellofinance.com.br
    NODE_ENV: z.enum(['development', 'test', 'production']),
  },
  client: {
    ...sharedClient,
  },
  runtimeEnv: {
    ...sharedRuntimeEnv,
    CONSOLE_BASE_DOMAIN: process.env.CONSOLE_BASE_DOMAIN,
    NODE_ENV: process.env.NODE_ENV,
  },
  emptyStringAsUndefined: true,
})
