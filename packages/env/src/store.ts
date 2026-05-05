import { createEnv } from '@t3-oss/env-nextjs'
import { z } from 'zod'
import { sharedClient, sharedRuntimeEnv, sharedServer } from './shared'

export const env = createEnv({
  server: {
    ...sharedServer,
    STORE_BASE_DOMAIN: z.string().min(1), // ex: vellofinance.com.br
  },
  client: {
    ...sharedClient,
  },
  runtimeEnv: {
    ...sharedRuntimeEnv,
    STORE_BASE_DOMAIN: process.env.STORE_BASE_DOMAIN,
  },
  emptyStringAsUndefined: true,
})
