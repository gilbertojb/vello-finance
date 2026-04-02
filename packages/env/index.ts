import { createEnv } from '@t3-oss/env-nextjs'
import { z } from 'zod'

export const env = createEnv({
  server: {
    PORT: z.coerce.number().default(3333),
    DATABASE_URL: z.url(),
    RESEND_API_KEY: z.string(),
    JWT_SECRET: z.string(),
    APP_NAME: z.string(),
    APP_EMAIL: z.email(),
    ASAAS_API_KEY: z.string(),
    ASAAS_BASE_URL: z.url().default('https://sandbox.asaas.com/api/v3'),
  },
  client: {},
  shared: {
    NEXT_PUBLIC_APP_URL: z.url(),
    NEXT_PUBLIC_API_URL: z.url(),
  },
  runtimeEnv: {
    PORT: process.env.SERVER_PORT,
    DATABASE_URL: process.env.DATABASE_URL,
    RESEND_API_KEY: process.env.RESEND_API_KEY,
    JWT_SECRET: process.env.JWT_SECRET,
    NEXT_PUBLIC_APP_URL: process.env.NEXT_PUBLIC_APP_URL,
    NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL,
    APP_NAME: process.env.APP_NAME,
    APP_EMAIL: process.env.APP_EMAIL,
    ASAAS_API_KEY: process.env.ASAAS_API_KEY,
    ASAAS_BASE_URL: process.env.ASAAS_BASE_URL,
  },
  emptyStringAsUndefined: true,
})
