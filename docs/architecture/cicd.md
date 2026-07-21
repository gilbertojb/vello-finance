# CI/CD and Setup — Vello Finance

## Vercel Projects

Three distinct projects in the Vercel dashboard, all pointing to the same GitHub repository:

| Vercel Project | Root Directory | Domain |
|---|---|---|
| `vello-admin` | `apps/admin` | `admin.vellofinance.com.br` |
| `vello-console` | `apps/console` | `*.app.vellofinance.com.br` |
| `vello-store` | `apps/store` | `*.vellofinance.com.br` |

## Environments

| Environment | Branch | Admin | Console | Store |
|---|---|---|---|---|
| Production | `main` | `admin.vellofinance.com.br` | `[slug].vellofinance.com.br` | Tenant's domain |
| Staging | `staging` | `admin.staging.vellofinance.com.br` | `[slug].staging.vellofinance.com.br` | `store.staging.vellofinance.com.br` |
| Preview | Pull Requests | Automatic Vercel URL | Automatic Vercel URL | Automatic Vercel URL |

## GitHub Actions — Workflows

### Deploy with path filters

Each app only redeploys when its code or `packages/` change:

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

Replicate for `deploy-console.yml` and `deploy-store.yml` with their respective `project-id`.

### Automatic migrations (staging)

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

> Production migrations are run **manually** before deploying to `main`.
> Never automate production migrations without human review.

### Type generation after migration

```yaml
# Add to the migration workflow
- name: Regenerate Supabase types
  run: |
    supabase gen types typescript --linked > packages/database/src/types.ts
    git config user.name "github-actions"
    git config user.email "github-actions@github.com"
    git add packages/database/src/types.ts
    git diff --staged --quiet || git commit -m "chore(packages/database): regenerate types [skip ci]"
    git push
```

## turbo.json Scripts

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

**Useful commands from the root:**

```bash
pnpm dev --filter=admin          # Starts only Vello Admin
pnpm dev --filter=console        # Starts only Vello Console
pnpm dev --filter=store          # Starts only Vello Store
pnpm build --filter=admin        # Build the admin
pnpm db:types                    # Regenerate Supabase types in packages/database
pnpm lint                        # Lint across all apps and packages
pnpm type-check                  # TypeScript check across all
```

## Local Setup (step by step)

```bash
# 1. Clone and install
git clone git@github.com:sua-org/vello-finance.git
cd vello-finance
pnpm install

# 2. Supabase CLI
brew install supabase/tap/supabase  # macOS
supabase login
supabase link --project-ref YOUR_PROJECT_REF_STAGING

# 3. Copy environment variables
cp apps/admin/.env.example apps/admin/.env.local
cp apps/console/.env.example apps/console/.env.local
cp apps/store/.env.example apps/store/.env.local
# Fill in with the staging Supabase keys

# 4. Run migrations on staging
supabase db push --linked

# 5. Regenerate types
pnpm db:types

# 6. Install shadcn in each app (first time)
cd apps/admin && npx shadcn@latest init
cd ../console && npx shadcn@latest init
cd ../store && npx shadcn@latest init

# 7. Start in development
cd ../..
pnpm dev --filter=admin   # http://localhost:3000
pnpm dev --filter=console # http://localhost:3001
pnpm dev --filter=store   # http://localhost:3002
```

## Required Secrets in GitHub

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
