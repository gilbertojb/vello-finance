# CI/CD e Setup — Vello Finance

## Projetos na Vercel

Três projetos distintos no painel da Vercel, todos apontando para o mesmo repositório GitHub:

| Projeto Vercel | Root Directory | Domínio |
|---|---|---|
| `vello-admin` | `apps/admin` | `admin.vellofinance.com.br` |
| `vello-console` | `apps/console` | `*.app.vellofinance.com.br` |
| `vello-store` | `apps/store` | `*.vellofinance.com.br` |

## Ambientes

| Ambiente | Branch | Admin | Console | Store |
|---|---|---|---|---|
| Produção | `main` | `admin.vellofinance.com.br` | `[slug].vellofinance.com.br` | Domínio do tenant |
| Staging | `staging` | `admin.staging.vellofinance.com.br` | `[slug].staging.vellofinance.com.br` | `store.staging.vellofinance.com.br` |
| Preview | Pull Requests | URL automática Vercel | URL automática Vercel | URL automática Vercel |

## GitHub Actions — Workflows

### Deploy com path filters

Cada app só redeploya quando seu código ou `packages/` mudam:

```yaml
# .github/workflows/deploy-admin.yml
name: Deploy — Vello Admin

on:
  push:
    branches: [main]
    paths:
      - 'apps/admin/**'
      - 'packages/**'
      - 'supabase/migrations/**'

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: amondnet/vercel-action@v25
        with:
          vercel-token: ${{ secrets.VERCEL_TOKEN }}
          vercel-org-id: ${{ secrets.VERCEL_ORG_ID }}
          vercel-project-id: ${{ secrets.VERCEL_PROJECT_ID_ADMIN }}
          vercel-args: '--prod'
```

Replicar para `deploy-console.yml` e `deploy-store.yml` com seus respectivos `project-id`.

### Migrations automáticas (staging)

```yaml
# .github/workflows/migrate-staging.yml
name: Migrations — Staging

on:
  push:
    branches: [staging]
    paths:
      - 'supabase/migrations/**'

jobs:
  migrate:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: supabase/setup-cli@v1
      - run: supabase db push --linked
        env:
          SUPABASE_ACCESS_TOKEN: ${{ secrets.SUPABASE_ACCESS_TOKEN }}
          SUPABASE_DB_PASSWORD: ${{ secrets.SUPABASE_DB_PASSWORD_STAGING }}
```

> Migrations em produção são executadas **manualmente** antes do deploy em `main`.
> Nunca automatizar migrations em produção sem revisão humana.

### Geração de Types após migration

```yaml
# Adicionar ao workflow de migration
- name: Regenerar types do Supabase
  run: |
    supabase gen types typescript --linked > packages/database/src/types.ts
    git config user.name "github-actions"
    git config user.email "github-actions@github.com"
    git add packages/database/src/types.ts
    git diff --staged --quiet || git commit -m "chore(packages/database): regenera types [skip ci]"
    git push
```

## Scripts do turbo.json

```json
{
  "$schema": "https://turbo.build/schema.json",
  "tasks": {
    "build": {
      "dependsOn": ["^build"],
      "outputs": [".next/**", "!.next/cache/**", "dist/**"]
    },
    "dev": {
      "cache": false,
      "persistent": true
    },
    "lint": {},
    "type-check": {
      "dependsOn": ["^build"]
    },
    "db:types": {
      "cache": false
    }
  }
}
```

**Comandos úteis na raiz:**

```bash
pnpm dev --filter=admin          # Sobe apenas o Vello Admin
pnpm dev --filter=console        # Sobe apenas o Vello Console
pnpm dev --filter=store          # Sobe apenas o Vello Store
pnpm build --filter=admin        # Build do admin
pnpm db:types                    # Regenera types do Supabase em packages/database
pnpm lint                        # Lint em todos os apps e packages
pnpm type-check                  # TypeScript check em todos
```

## Setup Local (passo a passo)

```bash
# 1. Clonar e instalar
git clone git@github.com:sua-org/vello-finance.git
cd vello-finance
pnpm install

# 2. Supabase CLI
brew install supabase/tap/supabase  # macOS
supabase login
supabase link --project-ref SEU_PROJECT_REF_STAGING

# 3. Copiar variáveis de ambiente
cp apps/admin/.env.example apps/admin/.env.local
cp apps/console/.env.example apps/console/.env.local
cp apps/store/.env.example apps/store/.env.local
# Preencher com as keys do Supabase staging

# 4. Rodar migrations no staging
supabase db push --linked

# 5. Regenerar types
pnpm db:types

# 6. Instalar shadcn em cada app (primeira vez)
cd apps/admin && npx shadcn@latest init
cd ../console && npx shadcn@latest init
cd ../store && npx shadcn@latest init

# 7. Subir em desenvolvimento
cd ../..
pnpm dev --filter=admin   # http://localhost:3000
pnpm dev --filter=console # http://localhost:3001
pnpm dev --filter=store   # http://localhost:3002
```

## Secrets necessários no GitHub

```
VERCEL_TOKEN
VERCEL_ORG_ID
VERCEL_PROJECT_ID_ADMIN
VERCEL_PROJECT_ID_CONSOLE
VERCEL_PROJECT_ID_STORE
SUPABASE_ACCESS_TOKEN
SUPABASE_DB_PASSWORD_STAGING
SUPABASE_DB_PASSWORD_PRODUCTION
```
