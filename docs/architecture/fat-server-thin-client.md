# Architecture: Fat Server, Thin Client

## Core Rule

The browser NEVER talks directly to Supabase.
Every database call is made on the server (Server Components, Server Actions, Route Handlers).

## Examples

**Correct — data fetched on the server:**
```tsx
// app/(app)/plans/page.tsx — Server Component
import { createClient } from '@/lib/supabase/server'

export default async function PlansPage() {
  const supabase = await createClient()
  const { data } = await supabase.from('plans').select('*')
  return <PlanTable plans={data} />
}
```

**Wrong — data fetched on the client:**
```tsx
'use client'
import { createClient } from '@/lib/supabase/client' // NEVER on data pages

export default function PlansPage() {
  const [plans, setPlans] = useState([])
  useEffect(() => {
    createClient().from('plans').select('*').then(...) // FORBIDDEN
  }, [])
}
```

**Correct — mutation via Server Action:**
```tsx
// app/(app)/plans/actions.ts
'use server'
import { createClient } from '@/lib/supabase/server'

export async function createPlan(formData: FormData) {
  const supabase = await createClient() // server client — not exposed
  await supabase.from('plans').insert(...)
}
```

**Wrong — mutation via client fetch:**
```tsx
'use client'
// NEVER call supabase.from() directly in a client component for mutations
```

## When `supabase/client.ts` can be used

Only for these specific cases, with no database access:
- `supabase.auth.getUser()` — check active session on the client
- `supabase.auth.signOut()` — logout
- Realtime subscriptions (when real-time notifications are needed — document explicitly)

## Required data flow

```
Browser                    Server (Next.js)             Supabase
  │                               │                         │
  │── clicks "Save" ──────────────▶│                         │
  │                        Server Action                    │
  │                               │── INSERT/SELECT ───────▶│
  │                               │◀── result ───────────────│
  │◀── redirect or toast ─────────│                         │
```

## Checklist before creating any file

1. Does this file have `'use client'`? → It CANNOT import `supabase/server` or run queries
2. Is this file a Server Component or does it have `'use server'`? → It CAN run queries
3. Do I need data on the client? → Receive it via props from the parent Server Component
