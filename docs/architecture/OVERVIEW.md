# Arquitetura do Sistema — Vello Finance

## Frentes do Sistema

| App | Nome | URL Produção | Audiência |
|---|---|---|---|
| `apps/admin` | Vello Admin | `admin.vellofinance.com.br` | Equipe interna |
| `apps/console` | Vello Console | `[slug].vellofinance.com.br` | Consultores / tenants |
| `apps/store` | Vello Store | Domínio do tenant | Cliente final |
| `apps/api` | Serviços Python | `api.vellofinance.com.br` | Interno (CNAB, integrações) |

## Roteamento Multi-Tenant

O middleware do Next.js (`apps/console` e `apps/store`) lê o `hostname` e resolve o tenant:

```
[slug].vellofinance.com.br      → busca tenant por slug
creditos.empresa.com.br         → busca tenant por custom_domain
admin.vellofinance.com.br       → backoffice, sem tenant_id
```

O `tenant_id` resolvido é injetado como header interno e consumido pelos Server Components
e Server Actions via `headers()`.

```typescript
// apps/console/middleware.ts (e apps/store/middleware.ts)
export async function middleware(request: NextRequest) {
  const hostname = request.headers.get('host') ?? ''
  const slug = hostname.replace('.vellofinance.com.br', '')

  const tenant = await resolveTenant(slug) // busca no Supabase
  if (!tenant) return NextResponse.redirect('/404')

  const response = NextResponse.next()
  response.headers.set('x-tenant-id', tenant.id)
  response.headers.set('x-tenant-slug', tenant.slug)
  return response
}
```

## Isolamento de Dados (RLS)

Toda tabela com dados de tenant possui `tenant_id UUID NOT NULL REFERENCES tenants(id)`.

```sql
-- Política padrão: tenant vê apenas seus dados
CREATE POLICY "tenant_isolation" ON [tabela]
  FOR ALL USING (
    tenant_id = (auth.jwt() ->> 'tenant_id')::uuid
  );

-- Backoffice acessa tudo
CREATE POLICY "backoffice_full_access" ON [tabela]
  FOR ALL USING (
    (auth.jwt() ->> 'user_role') = ANY(ARRAY[
      'super_admin', 'admin', 'financial', 'support'
    ])
  );
```

## Claims JWT (Supabase Auth Hook)

Injetados via `packages/auth` e validados nas policies RLS:

```json
{
  "user_role": "tenant_admin",
  "tenant_id": "uuid-do-tenant"
}
```

Para usuários do backoffice: `"tenant_id": null`

## White-Label: Instâncias, não Repositórios

Cada white-label é um tenant com `custom_domain` preenchido. Nenhum código ou deploy novo
é necessário. O fluxo ao contratar um white-label:

```
1. Admin cadastra tenant → INSERT em tenants com custom_domain
2. Cliente aponta CNAME no DNS dele → Vercel
3. Vercel API registra o domínio + provisiona SSL automaticamente
4. Store e Console já respondem no novo domínio com identidade do tenant
```

## Diagrama de Componentes

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
 │     N8N     │  │  apps/api    │  │   Parceiros  │
 │ (automações)│  │ FastAPI/CNAB │  │  Bancários   │
 │  Railway    │  │   Railway    │  │  (Qi Tech,   │
 └─────────────┘  └──────────────┘  │   Bancly...) │
                                     └──────────────┘
```
