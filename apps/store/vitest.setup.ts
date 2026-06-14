// Env stubs required so modules that import `@vello/env/store` at load time
// (e.g. `lib/supabase/service.ts`) don't fail validation under vitest.
process.env.SUPABASE_SECRET_KEY ??= 'test-supabase-secret-key'
process.env.SUPABASE_CPF_PEPPER ??= 'test-pepper-with-at-least-32-characters-xxxxxx'
process.env.CLIENT_SESSION_SECRET ??= 'test-session-secret-with-at-least-32-chars-xx'
process.env.NEXT_PUBLIC_SUPABASE_URL ??= 'https://test.supabase.co'
process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ??= 'test-publishable-key'
process.env.STORE_BASE_DOMAIN ??= 'vellofinance.com.br'
