import { z } from 'zod'

export const sharedServer = {
  SUPABASE_SECRET_KEY: z.string().min(1),
  SUPABASE_CPF_PEPPER: z.string().min(32),
  CLIENT_SESSION_SECRET: z.string().min(32),
}

export const sharedClient = {
  NEXT_PUBLIC_SUPABASE_URL: z.string().url(),
  NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: z.string().min(1),
}

export const sharedRuntimeEnv = {
  SUPABASE_SECRET_KEY: process.env.SUPABASE_SECRET_KEY,
  SUPABASE_CPF_PEPPER: process.env.SUPABASE_CPF_PEPPER,
  CLIENT_SESSION_SECRET: process.env.CLIENT_SESSION_SECRET,
  NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL,
  NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY,
}
