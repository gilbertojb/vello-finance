# System Architecture — Vello Finance

## System Fronts

| App | Name | Production URL | Audience |
|---|---|---|---|
| `apps/admin` | Vello Admin | `admin.vellofinance.com.br` | Internal team |
| `apps/console` | Vello Console | `[slug].vellofinance.com.br` | Consultants / tenants |
| `apps/store` | Vello Store | Tenant's domain | End customer |
| `apps/api` | Python Services | `api.vellofinance.com.br` | Internal (CNAB, integrations) |

## Multi-Tenant Routing

The Next.js middleware (`apps/console` and `apps/store`) reads the `hostname` and resolves the tenant:

```
[slug].vellofinance.com.br      → looks up tenant by slug
creditos.empresa.com.br         → looks up tenant by custom_domain
admin.vellofinance.com.br       → backoffice, no tenant_id
```

The resolved `tenant_id` is injected as an internal header and consumed by Server Components
and Server Actions via `headers()`.

```typescript
// apps/console/middleware.ts (and apps/store/middleware.ts)
export async function middleware(request: NextRequest) {
  const hostname = request.headers.get('host') ?? ''
  const slug = hostname.replace('.vellofinance.com.br', '')

  const tenant = await resolveTenant(slug) // looks up in Supabase
  if (!tenant) return NextResponse.redirect('/404')

  const response = NextResponse.next()
  response.headers.set('x-tenant-id', tenant.id)
  response.headers.set('x-tenant-slug', tenant.slug)
  return response
}
```

## Data Isolation (RLS)

Every table with tenant data has `tenant_id UUID NOT NULL REFERENCES tenants(id)`.

```sql
-- Default policy: tenant sees only its own data
CREATE POLICY "tenant_isolation" ON [table]
  FOR ALL USING (
    tenant_id = (auth.jwt() ->> 'tenant_id')::uuid
  );

-- Backoffice accesses everything
CREATE POLICY "backoffice_full_access" ON [table]
  FOR ALL USING (
    (auth.jwt() ->> 'user_role') = ANY(ARRAY[
      'super_admin', 'admin', 'financial', 'support'
    ])
  );
```

## JWT Claims (Supabase Auth Hook)

Injected via `packages/auth` and validated in RLS policies:

```json
{
  "user_role": "tenant_admin",
  "tenant_id": "tenant-uuid"
}
```

For backoffice users: `"tenant_id": null`

## White-Label: Instances, not Repositories

Each white-label is a tenant with `custom_domain` filled in. No new code or deploy
is required. The flow when onboarding a white-label:

```
1. Admin registers tenant → INSERT into tenants with custom_domain
2. Client points CNAME in their DNS → Vercel
3. Vercel API registers the domain + automatically provisions SSL
4. Store and Console already respond on the new domain with the tenant's identity
```

## Component Diagram

```
┌─────────────────────────────────────────────────────────────┐
│                        Vercel                                │
│  ┌─────────────┐  ┌──────────────┐  ┌──────────────┐       │
│  │ apps/admin  │  │ apps/console │  │  apps/store  │       │
│  │ Vello Admin │  │Vello Console │  │ Vello Store  │       │
│  └──────┬──────┘  └──────┬───────┘  └──────┬───────┘       │
└─────────┼───────────────┼────────────────┼───────────────── ┘
          │               │                │
          └───────────────┴────────────────┘
                          │
               ┌──────────▼──────────┐
               │       Supabase       │
               │  PostgreSQL + RLS    │
               │  Auth (JWT + MFA)    │
               │  Storage (docs)      │
               │  Edge Functions      │
               │  Realtime            │
               └──────────┬──────────┘
                          │
        ┌─────────────────┼──────────────────┐
        │                 │                  │
 ┌──────▼──────┐  ┌───────▼──────┐  ┌───────▼──────┐
 │     N8N     │  │  apps/api    │  │   Partners   │
 │(automations)│  │ FastAPI/CNAB │  │   Banking    │
 │  Railway    │  │   Railway    │  │  (Qi Tech,   │
 └─────────────┘  └──────────────┘  │   Bancly...) │
                                     └──────────────┘
```
