# Store Client Document Portal — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Implementar portal público na Store onde clientes informam CPF, visualizam suas propostas no tenant e enviam documentos pendentes. Card de compartilhamento do link na aba Documentos do Console.

**Architecture:** Server Components + Server Actions (Fat Server). CPF identifica via hash (sha256+pepper) indexado em `proposals.client_cpf_hash`. Sessão por JWT assinado em cookie httpOnly de 30min, sempre verificada contra `tenant_id` do header. Validação rígida de arquivos (Zod + magic bytes). Audit log e rate limit em tabelas dedicadas.

**Tech Stack:** Next.js 16 App Router, TypeScript, Tailwind v4, shadcn/ui, Zod, Supabase (Postgres + Storage), `jose` (JWT), `file-type` (magic bytes), Vitest (testes unitários).

**Spec:** `docs/superpowers/specs/2026-06-13-store-client-document-portal-design.md`

---

## Estrutura de arquivos (mapa completo)

**Novo pacote:**
```
packages/proposals-shared/
├── package.json
├── tsconfig.json
└── src/
    ├── index.ts
    ├── required-documents.ts        (movido de apps/console)
    └── status-config.ts             (parte sem JSX, movida de apps/console)
```

**Migration + script:**
```
supabase/migrations/20260613120000_client_document_portal.sql
scripts/backfill-cpf-hash.ts
```

**Env shared (modificado):**
```
packages/env/src/shared.ts            (adiciona SUPABASE_CPF_PEPPER, CLIENT_SESSION_SECRET)
.env.example                          (adiciona novas vars)
```

**Store (novos arquivos):**
```
apps/store/src/app/(store)/meus-documentos/
├── page.tsx
├── actions.ts
├── queries.ts
├── _lib/
│   ├── cpf-hash.ts
│   ├── session.ts
│   ├── rate-limit.ts
│   ├── file-validation.ts
│   ├── audit.ts
│   └── __tests__/
│       ├── cpf-hash.test.ts
│       ├── session.test.ts
│       ├── rate-limit.test.ts
│       └── file-validation.test.ts
├── _components/
│   ├── cpf-form.tsx
│   ├── client-header.tsx
│   ├── proposal-card.tsx
│   └── document-uploader.tsx
└── propostas/
    ├── page.tsx
    └── [proposalId]/
        └── page.tsx
```

**Store (modificados):**
```
apps/store/src/app/(store)/contratar/actions.ts   (preenche client_cpf_hash em createProposal/saveStep)
apps/store/proxy.ts                                (headers de segurança para /meus-documentos)
apps/store/vitest.config.ts                        (novo — para testes do _lib)
apps/store/package.json                            (adiciona jose, file-type, vitest)
```

**Console (modificados/novos):**
```
apps/console/src/app/(private)/proposals/[id]/_components/client-share-card.tsx   (novo)
apps/console/src/app/(private)/proposals/[id]/_components/documents-tab.tsx       (integra card)
apps/console/src/app/(private)/proposals/[id]/page.tsx                            (passa portalUrl)
apps/console/src/lib/tenant/portal-url.ts                                         (novo: getPortalUrl)
apps/console/src/app/(private)/proposals/required-documents.ts                    (deletado — vira shim ou removido)
apps/console/src/app/(private)/proposals/status-config.ts                          (refatorado para importar de shared)
packages/env/src/console.ts                                                        (adiciona STORE_BASE_DOMAIN)
```

**Docs:**
```
docs/features/store/client-document-portal.md     (novo)
```

---

## Princípios de execução

- **Commit frequente** após cada task verde
- **TDD onde fizer sentido**: helpers puros (hash, session, file validation) têm teste antes da implementação. Componentes UI são verificados visualmente
- **Sem emojis** em código/commits
- **Sempre alias `@/`** nos imports (regra do projeto)
- **Sem valores arbitrários Tailwind** — apenas tokens (`bg-primary`, `text-foreground`, etc.)
- **Mobile-first responsivo**
- **Variáveis/identificadores em inglês**
- **Co-Authored-By NÃO** vai em nenhum commit

---

## Task 1 — Criar pacote `@vello/proposals-shared`

**Files:**
- Create: `packages/proposals-shared/package.json`
- Create: `packages/proposals-shared/tsconfig.json`
- Create: `packages/proposals-shared/src/index.ts`
- Create: `packages/proposals-shared/src/required-documents.ts`
- Create: `packages/proposals-shared/src/status-config.ts`

- [ ] **Step 1: Criar `packages/proposals-shared/package.json`**

```json
{
  "name": "@vello/proposals-shared",
  "version": "0.0.0",
  "private": true,
  "main": "src/index.ts",
  "types": "src/index.ts",
  "exports": {
    ".": "./src/index.ts",
    "./required-documents": "./src/required-documents.ts",
    "./status-config": "./src/status-config.ts"
  },
  "devDependencies": {
    "@vello/biome-config": "workspace:*",
    "@vello/typescript-config": "workspace:*"
  },
  "biome": {
    "extends": "@vello/biome-config/base"
  },
  "tsconfig": {
    "extends": "@vello/typescript-config/library"
  }
}
```

- [ ] **Step 2: Criar `packages/proposals-shared/tsconfig.json`**

```json
{
  "extends": "@vello/typescript-config/library",
  "include": ["src/**/*.ts"]
}
```

- [ ] **Step 3: Criar `packages/proposals-shared/src/required-documents.ts`**

Copiar o conteúdo de `apps/console/src/app/(private)/proposals/required-documents.ts` exatamente:

```ts
export interface RequiredDoc {
  type: string
  label: string
}

export const REQUIRED_DOCUMENTS: Record<string, RequiredDoc[]> = {
  auto_equity: [
    { type: 'rg_cnh',                  label: 'RG ou CNH (frente e verso)' },
    { type: 'comprovante_estado_civil', label: 'Comprovante de estado civil' },
    { type: 'comprovante_endereco',     label: 'Comprovante de endereço' },
    { type: 'crlv',                    label: 'CRLV do veículo' },
    { type: 'foto_traseira',           label: 'Foto traseira do veículo' },
    { type: 'foto_placa',              label: 'Foto da placa traseira' },
    { type: 'foto_chassi',             label: 'Foto do chassi' },
  ],
  fgts: [],
  consignado_privado: [
    { type: 'rg_cnh',               label: 'RG ou CNH (frente e verso)' },
    { type: 'comprovante_endereco',  label: 'Comprovante de endereço' },
    { type: 'contracheque',         label: 'Contracheque (últimos 3 meses)' },
  ],
  consignado_publico: [
    { type: 'rg_cnh',               label: 'RG ou CNH (frente e verso)' },
    { type: 'comprovante_endereco',  label: 'Comprovante de endereço' },
    { type: 'contracheque',         label: 'Contracheque (últimos 3 meses)' },
    { type: 'margem_consignavel',   label: 'Comprovante de margem consignável' },
  ],
  home_equity: [
    { type: 'rg_cnh',               label: 'RG ou CNH (frente e verso)' },
    { type: 'comprovante_endereco',  label: 'Comprovante de endereço' },
    { type: 'matricula_imovel',     label: 'Matrícula do imóvel atualizada' },
    { type: 'iptu',                 label: 'IPTU do imóvel' },
  ],
}

export function getRequiredDocs(productTypeSlug: string): RequiredDoc[] {
  return REQUIRED_DOCUMENTS[productTypeSlug] ?? []
}
```

- [ ] **Step 4: Criar `packages/proposals-shared/src/status-config.ts`**

A versão shared não tem dependência de JSX nem de `badgeVariants` do shadcn. Coloca só labels e listas:

```ts
export const STATUS_LABELS: Record<string, string> = {
  nova_proposta:      'Nova proposta',
  em_analise:         'Em análise',
  pre_aprovada:       'Pré-aprovada',
  necessita_detalhes: 'Det. pendentes',
  reprovada:          'Reprovada',
  aprovada:           'Aprovada',
}

export const PIPELINE_STATUSES = [
  'em_analise',
  'pre_aprovada',
  'necessita_detalhes',
] as const

export const COMPLETED_STATUSES = [
  'em_analise',
  'pre_aprovada',
  'necessita_detalhes',
  'reprovada',
  'aprovada',
] as const

export type ProposalStatus = keyof typeof STATUS_LABELS

export function getStatusLabel(status: string): string {
  return STATUS_LABELS[status] ?? status
}
```

- [ ] **Step 5: Criar `packages/proposals-shared/src/index.ts`**

```ts
export * from './required-documents'
export * from './status-config'
```

- [ ] **Step 6: Adicionar workspace deps**

Em `apps/store/package.json` → bloco `dependencies`, adicionar:
```json
"@vello/proposals-shared": "workspace:*",
```

Em `apps/console/package.json` → bloco `dependencies`, adicionar:
```json
"@vello/proposals-shared": "workspace:*",
```

- [ ] **Step 7: Instalar e verificar build do package**

```bash
pnpm install
pnpm --filter @vello/proposals-shared build || echo "(no build script — typecheck via consumer apps)"
```

Esperado: install ok, sem erros de resolução.

- [ ] **Step 8: Substituir imports no console**

Em `apps/console/src/app/(private)/proposals/[id]/_components/documents-tab.tsx`, trocar:
```ts
import { getRequiredDocs } from '@/app/(private)/proposals/required-documents'
```
por:
```ts
import { getRequiredDocs } from '@vello/proposals-shared/required-documents'
```

Em `apps/console/src/app/(private)/proposals/queries.ts`, trocar:
```ts
import { COMPLETED_STATUSES } from './status-config'
```
por:
```ts
import { COMPLETED_STATUSES } from '@vello/proposals-shared/status-config'
```

(O `status-config.ts` local continua existindo porque tem JSX-dependent `STATUS_CFG`. Só removemos do local as constantes que migraram.)

- [ ] **Step 9: Limpar status-config local do console**

Em `apps/console/src/app/(private)/proposals/status-config.ts`, remover `PIPELINE_STATUSES`, `COMPLETED_STATUSES` (agora vêm do shared). Manter `STATUS_CFG`, `STATUS_FILTERS` e a interface `StatusConfig`.

- [ ] **Step 10: Apagar `apps/console/src/app/(private)/proposals/required-documents.ts`**

Já foi para o shared. Procurar outros imports e atualizar:
```bash
grep -rn "from.*proposals/required-documents" apps/console/src
```
Esperado: zero referências restantes (Task 8 já cobriu o único). Remover o arquivo.

- [ ] **Step 11: Typecheck dos apps**

```bash
pnpm --filter console typecheck
pnpm --filter store typecheck
```
Esperado: sem erros.

Caso `typecheck` não exista nos scripts:
```bash
cd apps/console && npx tsc --noEmit
cd apps/store && npx tsc --noEmit
```

- [ ] **Step 12: Commit**

```bash
git add packages/proposals-shared apps/console/src/app/\(private\)/proposals apps/console/package.json apps/store/package.json pnpm-lock.yaml
git commit -m "feat(packages): cria @vello/proposals-shared com required-documents e status-config"
```

---

## Task 2 — Adicionar variáveis de ambiente

**Files:**
- Modify: `packages/env/src/shared.ts`
- Modify: `packages/env/src/store.ts`
- Modify: `packages/env/src/console.ts`
- Modify: `.env.example`

- [ ] **Step 1: Atualizar `packages/env/src/shared.ts`**

```ts
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
```

- [ ] **Step 2: Adicionar `STORE_BASE_DOMAIN` ao console env**

Em `packages/env/src/console.ts`, no bloco `server`:
```ts
STORE_BASE_DOMAIN: z.string().min(1),
```
E em `runtimeEnv`:
```ts
STORE_BASE_DOMAIN: process.env.STORE_BASE_DOMAIN,
```

(O console precisa para montar a URL `https://{slug}.{baseDomain}/meus-documentos`.)

- [ ] **Step 3: Atualizar `.env.example`**

Adicionar ao final:
```
# Portal do cliente (Store)
SUPABASE_CPF_PEPPER=change-me-to-a-random-string-of-32-chars-or-more
CLIENT_SESSION_SECRET=change-me-to-a-random-string-of-32-chars-or-more

# Base domain compartilhado com a store (já existe no env da store)
STORE_BASE_DOMAIN=vellofinance.com.br
```

- [ ] **Step 4: Adicionar variáveis ao `.env` local**

Gerar dois segredos aleatórios e adicionar ao `.env` raiz (não commitado):
```bash
node -e "console.log('SUPABASE_CPF_PEPPER=' + require('crypto').randomBytes(48).toString('hex'))"
node -e "console.log('CLIENT_SESSION_SECRET=' + require('crypto').randomBytes(48).toString('hex'))"
```
Colar os outputs no `.env`. Avisar o usuário para adicionar no Vercel (store + console).

- [ ] **Step 5: Typecheck**

```bash
pnpm --filter console typecheck
pnpm --filter store typecheck
```

- [ ] **Step 6: Commit**

```bash
git add packages/env .env.example
git commit -m "feat(env): adiciona SUPABASE_CPF_PEPPER, CLIENT_SESSION_SECRET e STORE_BASE_DOMAIN"
```

---

## Task 3 — Migration: coluna `client_cpf_hash` + tabelas auxiliares

**Files:**
- Create: `supabase/migrations/20260613120000_client_document_portal.sql`

- [ ] **Step 1: Criar a migration**

```sql
-- ============================================================
-- Portal de documentos do cliente — coluna de hash + tabelas auxiliares
-- ============================================================

-- 1. Hash de CPF para lookup seguro
ALTER TABLE proposals
  ADD COLUMN client_cpf_hash TEXT;

CREATE INDEX idx_proposals_tenant_cpf_hash
  ON proposals(tenant_id, client_cpf_hash)
  WHERE client_cpf_hash IS NOT NULL;

-- 2. Tabela de tentativas (rate limit)
CREATE TABLE client_access_attempts (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id     UUID NOT NULL REFERENCES tenants(id),
  ip_hash       TEXT NOT NULL,
  cpf_hash      TEXT,
  success       BOOLEAN NOT NULL DEFAULT FALSE,
  attempted_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_attempts_ip_recent
  ON client_access_attempts(ip_hash, attempted_at DESC);

CREATE INDEX idx_attempts_cpf_recent
  ON client_access_attempts(cpf_hash, attempted_at DESC)
  WHERE cpf_hash IS NOT NULL;

ALTER TABLE client_access_attempts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "client_attempts_service_role" ON client_access_attempts
  FOR ALL TO service_role USING (true) WITH CHECK (true);

-- 3. Tabela de auditoria de acesso a documentos
CREATE TABLE proposal_document_access_log (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id       UUID NOT NULL REFERENCES tenants(id),
  proposal_id     UUID NOT NULL REFERENCES proposals(id) ON DELETE CASCADE,
  action          TEXT NOT NULL CHECK (action IN ('viewed_list','viewed_proposal','uploaded','downloaded')),
  document_type   TEXT,
  ip_hash         TEXT NOT NULL,
  user_agent_hash TEXT,
  occurred_at     TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_access_log_proposal ON proposal_document_access_log(proposal_id, occurred_at DESC);
CREATE INDEX idx_access_log_tenant ON proposal_document_access_log(tenant_id, occurred_at DESC);

ALTER TABLE proposal_document_access_log ENABLE ROW LEVEL SECURITY;

CREATE POLICY "access_log_service_role" ON proposal_document_access_log
  FOR ALL TO service_role USING (true) WITH CHECK (true);

CREATE POLICY "access_log_tenant_select" ON proposal_document_access_log
  FOR SELECT USING (tenant_id = (auth.jwt() ->> 'tenant_id')::uuid);
```

- [ ] **Step 2: Aplicar migration localmente**

```bash
pnpm supabase db push
```
Esperado: migration aplicada sem erro.

- [ ] **Step 3: Regenerar types**

```bash
pnpm db:types
```
Esperado: `packages/database/src/types.ts` atualizado com `client_cpf_hash`, `client_access_attempts`, `proposal_document_access_log`.

- [ ] **Step 4: Typecheck**

```bash
pnpm --filter store typecheck
pnpm --filter console typecheck
```

- [ ] **Step 5: Commit**

```bash
git add supabase/migrations packages/database
git commit -m "feat(db): adiciona client_cpf_hash, client_access_attempts e proposal_document_access_log"
```

---

## Task 4 — Helper `cpf-hash` (com testes)

**Files:**
- Create: `apps/store/vitest.config.ts`
- Create: `apps/store/src/app/(store)/meus-documentos/_lib/cpf-hash.ts`
- Create: `apps/store/src/app/(store)/meus-documentos/_lib/__tests__/cpf-hash.test.ts`
- Modify: `apps/store/package.json`

- [ ] **Step 1: Adicionar vitest à store**

Em `apps/store/package.json`, adicionar em `devDependencies`:
```json
"vitest": "^2.2.0",
"@vitest/ui": "^2.2.0",
```

E em `scripts`:
```json
"test": "vitest run",
"test:watch": "vitest"
```

Rodar:
```bash
pnpm install
```

- [ ] **Step 2: Criar `apps/store/vitest.config.ts`**

```ts
import { defineConfig } from 'vitest/config'
import { fileURLToPath } from 'node:url'

export default defineConfig({
  test: {
    environment: 'node',
    globals: true,
  },
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },
})
```

- [ ] **Step 3: Escrever teste falhando para `hashCpf`**

`apps/store/src/app/(store)/meus-documentos/_lib/__tests__/cpf-hash.test.ts`:

```ts
import { describe, expect, it, beforeAll } from 'vitest'
import { hashCpf, hashIp, hashUserAgent } from '@/app/(store)/meus-documentos/_lib/cpf-hash'

beforeAll(() => {
  process.env.SUPABASE_CPF_PEPPER = 'test-pepper-with-at-least-32-characters-xxxxxx'
})

describe('hashCpf', () => {
  it('returns hex sha256 of digits-only CPF + pepper', () => {
    const h1 = hashCpf('123.456.789-09')
    const h2 = hashCpf('12345678909')
    expect(h1).toBe(h2)
    expect(h1).toMatch(/^[0-9a-f]{64}$/)
  })

  it('produces different hashes for different CPFs', () => {
    expect(hashCpf('11111111111')).not.toBe(hashCpf('22222222222'))
  })

  it('throws if pepper is missing', () => {
    const before = process.env.SUPABASE_CPF_PEPPER
    delete process.env.SUPABASE_CPF_PEPPER
    expect(() => hashCpf('12345678909')).toThrow()
    process.env.SUPABASE_CPF_PEPPER = before
  })
})

describe('hashIp', () => {
  it('returns hex sha256 of ip + pepper', () => {
    expect(hashIp('127.0.0.1')).toMatch(/^[0-9a-f]{64}$/)
  })

  it('produces different hash than hashCpf for same input', () => {
    expect(hashIp('12345678909')).not.toBe(hashCpf('12345678909'))
  })
})

describe('hashUserAgent', () => {
  it('returns hex sha256 of UA + pepper', () => {
    expect(hashUserAgent('Mozilla/5.0')).toMatch(/^[0-9a-f]{64}$/)
  })

  it('handles empty UA returning consistent hash', () => {
    expect(hashUserAgent('')).toMatch(/^[0-9a-f]{64}$/)
  })
})
```

- [ ] **Step 4: Rodar teste — esperar falha**

```bash
pnpm --filter store test
```
Esperado: FAIL — módulo não existe.

- [ ] **Step 5: Implementar `cpf-hash.ts`**

`apps/store/src/app/(store)/meus-documentos/_lib/cpf-hash.ts`:

```ts
import { createHash } from 'node:crypto'

function getPepper(): string {
  const pepper = process.env.SUPABASE_CPF_PEPPER
  if (!pepper) throw new Error('SUPABASE_CPF_PEPPER missing')
  return pepper
}

function sha256Hex(input: string, namespace: string): string {
  return createHash('sha256').update(`${namespace}:${input}:${getPepper()}`).digest('hex')
}

export function hashCpf(cpf: string): string {
  const digits = cpf.replace(/\D/g, '')
  return sha256Hex(digits, 'cpf')
}

export function hashIp(ip: string): string {
  return sha256Hex(ip, 'ip')
}

export function hashUserAgent(ua: string): string {
  return sha256Hex(ua, 'ua')
}
```

Nota: usar `namespace` (`cpf:`, `ip:`, `ua:`) garante que mesmo se um CPF coincidir textualmente com um IP, os hashes não colidem.

- [ ] **Step 6: Rodar teste — esperar pass**

```bash
pnpm --filter store test
```
Esperado: 6 passing.

- [ ] **Step 7: Commit**

```bash
git add apps/store
git commit -m "feat(store): adiciona helper de hash com pepper para CPF, IP e UA"
```

---

## Task 5 — Helper `session` (JWT cookie com testes)

**Files:**
- Modify: `apps/store/package.json` (adiciona `jose`)
- Create: `apps/store/src/app/(store)/meus-documentos/_lib/session.ts`
- Create: `apps/store/src/app/(store)/meus-documentos/_lib/__tests__/session.test.ts`

- [ ] **Step 1: Instalar `jose`**

```bash
pnpm --filter store add jose
```

- [ ] **Step 2: Escrever teste falhando**

`apps/store/src/app/(store)/meus-documentos/_lib/__tests__/session.test.ts`:

```ts
import { describe, expect, it, beforeAll } from 'vitest'
import { signClientSession, verifyClientSession } from '@/app/(store)/meus-documentos/_lib/session'

beforeAll(() => {
  process.env.CLIENT_SESSION_SECRET = 'test-secret-with-at-least-32-chars-xxxxxxxx'
})

describe('signClientSession / verifyClientSession', () => {
  const cpfHash = 'a'.repeat(64)
  const tenantId = '11111111-1111-1111-1111-111111111111'

  it('round-trips a valid payload', async () => {
    const token = await signClientSession({ cpf_hash: cpfHash, tenant_id: tenantId })
    const verified = await verifyClientSession(token, tenantId)
    expect(verified).not.toBeNull()
    expect(verified?.cpf_hash).toBe(cpfHash)
    expect(verified?.tenant_id).toBe(tenantId)
  })

  it('rejects token signed for a different tenant', async () => {
    const token = await signClientSession({ cpf_hash: cpfHash, tenant_id: tenantId })
    const otherTenant = '22222222-2222-2222-2222-222222222222'
    expect(await verifyClientSession(token, otherTenant)).toBeNull()
  })

  it('rejects expired token', async () => {
    const token = await signClientSession(
      { cpf_hash: cpfHash, tenant_id: tenantId },
      { expiresInSeconds: -1 },
    )
    expect(await verifyClientSession(token, tenantId)).toBeNull()
  })

  it('rejects tampered token', async () => {
    const token = await signClientSession({ cpf_hash: cpfHash, tenant_id: tenantId })
    const tampered = `${token}x`
    expect(await verifyClientSession(tampered, tenantId)).toBeNull()
  })
})
```

- [ ] **Step 3: Rodar teste — esperar falha**

```bash
pnpm --filter store test
```
Esperado: FAIL — módulo não existe.

- [ ] **Step 4: Implementar `session.ts`**

`apps/store/src/app/(store)/meus-documentos/_lib/session.ts`:

```ts
// TODO Futuro: Passwordless — substituir validação por CPF apenas por OTP via SMS/email
// ou senha. Quando implementarmos, manter rate-limit e estrutura de sessão; trocar
// apenas o "fator" (CPF → OTP/senha). A coluna client_cpf_hash continua útil como
// chave entre identidade autenticada e propostas existentes.

import { SignJWT, jwtVerify } from 'jose'
import { cookies } from 'next/headers'

const COOKIE_NAME = 'vello_client_session'
const COOKIE_PATH = '/meus-documentos'
const DEFAULT_EXPIRES_SECONDS = 30 * 60

interface ClientSessionPayload {
  cpf_hash: string
  tenant_id: string
}

function getSecret(): Uint8Array {
  const secret = process.env.CLIENT_SESSION_SECRET
  if (!secret) throw new Error('CLIENT_SESSION_SECRET missing')
  return new TextEncoder().encode(secret)
}

export async function signClientSession(
  payload: ClientSessionPayload,
  opts: { expiresInSeconds?: number } = {},
): Promise<string> {
  const exp = opts.expiresInSeconds ?? DEFAULT_EXPIRES_SECONDS
  return new SignJWT({ cpf_hash: payload.cpf_hash, tenant_id: payload.tenant_id })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime(Math.floor(Date.now() / 1000) + exp)
    .sign(getSecret())
}

export async function verifyClientSession(
  token: string,
  expectedTenantId: string,
): Promise<ClientSessionPayload | null> {
  try {
    const { payload } = await jwtVerify(token, getSecret(), { algorithms: ['HS256'] })
    if (typeof payload.cpf_hash !== 'string' || typeof payload.tenant_id !== 'string') return null
    if (payload.tenant_id !== expectedTenantId) return null
    return { cpf_hash: payload.cpf_hash, tenant_id: payload.tenant_id }
  } catch {
    return null
  }
}

export async function setClientSessionCookie(token: string): Promise<void> {
  const store = await cookies()
  store.set(COOKIE_NAME, token, {
    httpOnly: true,
    secure: true,
    sameSite: 'strict',
    path: COOKIE_PATH,
    maxAge: DEFAULT_EXPIRES_SECONDS,
  })
}

export async function clearClientSessionCookie(): Promise<void> {
  const store = await cookies()
  store.set(COOKIE_NAME, '', {
    httpOnly: true,
    secure: true,
    sameSite: 'strict',
    path: COOKIE_PATH,
    maxAge: 0,
  })
}

export async function readClientSession(expectedTenantId: string): Promise<ClientSessionPayload | null> {
  const store = await cookies()
  const token = store.get(COOKIE_NAME)?.value
  if (!token) return null
  return verifyClientSession(token, expectedTenantId)
}
```

- [ ] **Step 5: Rodar teste — esperar pass**

```bash
pnpm --filter store test
```
Esperado: 10 passing (testes anteriores + 4 novos).

- [ ] **Step 6: Commit**

```bash
git add apps/store
git commit -m "feat(store): adiciona helper de sessao JWT do cliente com cookie httpOnly"
```

---

## Task 6 — Helper `rate-limit` (com testes)

**Files:**
- Create: `apps/store/src/app/(store)/meus-documentos/_lib/rate-limit.ts`
- Create: `apps/store/src/app/(store)/meus-documentos/_lib/__tests__/rate-limit.test.ts`

- [ ] **Step 1: Escrever teste falhando**

`apps/store/src/app/(store)/meus-documentos/_lib/__tests__/rate-limit.test.ts`:

```ts
import { describe, expect, it } from 'vitest'
import {
  RATE_LIMIT_IP_MAX,
  RATE_LIMIT_IP_WINDOW_MIN,
  RATE_LIMIT_CPF_MAX,
  RATE_LIMIT_CPF_WINDOW_MIN,
  isOverLimit,
} from '@/app/(store)/meus-documentos/_lib/rate-limit'

describe('rate-limit constants', () => {
  it('IP limit defaults to 5 per 15 minutes', () => {
    expect(RATE_LIMIT_IP_MAX).toBe(5)
    expect(RATE_LIMIT_IP_WINDOW_MIN).toBe(15)
  })

  it('CPF limit defaults to 10 per 60 minutes', () => {
    expect(RATE_LIMIT_CPF_MAX).toBe(10)
    expect(RATE_LIMIT_CPF_WINDOW_MIN).toBe(60)
  })
})

describe('isOverLimit', () => {
  it('returns false when ipCount and cpfCount under limits', () => {
    expect(isOverLimit({ ipCount: 4, cpfCount: 9 })).toBe(false)
  })

  it('returns true when ipCount reaches IP limit', () => {
    expect(isOverLimit({ ipCount: 5, cpfCount: 0 })).toBe(true)
  })

  it('returns true when cpfCount reaches CPF limit', () => {
    expect(isOverLimit({ ipCount: 0, cpfCount: 10 })).toBe(true)
  })

  it('returns true when either exceeds', () => {
    expect(isOverLimit({ ipCount: 6, cpfCount: 11 })).toBe(true)
  })
})
```

- [ ] **Step 2: Rodar teste — esperar falha**

```bash
pnpm --filter store test
```
Esperado: FAIL.

- [ ] **Step 3: Implementar `rate-limit.ts`**

`apps/store/src/app/(store)/meus-documentos/_lib/rate-limit.ts`:

```ts
import { createServiceClient } from '@/lib/supabase/service'

export const RATE_LIMIT_IP_MAX = 5
export const RATE_LIMIT_IP_WINDOW_MIN = 15
export const RATE_LIMIT_CPF_MAX = 10
export const RATE_LIMIT_CPF_WINDOW_MIN = 60

export function isOverLimit({
  ipCount,
  cpfCount,
}: { ipCount: number; cpfCount: number }): boolean {
  return ipCount >= RATE_LIMIT_IP_MAX || cpfCount >= RATE_LIMIT_CPF_MAX
}

export async function checkRateLimit({
  ipHash,
  cpfHash,
}: { ipHash: string; cpfHash: string }): Promise<{ blocked: boolean }> {
  const supabase = createServiceClient()
  const nowMs = Date.now()
  const ipFloor = new Date(nowMs - RATE_LIMIT_IP_WINDOW_MIN * 60_000).toISOString()
  const cpfFloor = new Date(nowMs - RATE_LIMIT_CPF_WINDOW_MIN * 60_000).toISOString()

  const [ipRes, cpfRes] = await Promise.all([
    supabase
      .from('client_access_attempts')
      .select('id', { count: 'exact', head: true })
      .eq('ip_hash', ipHash)
      .gte('attempted_at', ipFloor),
    supabase
      .from('client_access_attempts')
      .select('id', { count: 'exact', head: true })
      .eq('cpf_hash', cpfHash)
      .gte('attempted_at', cpfFloor),
  ])

  return { blocked: isOverLimit({ ipCount: ipRes.count ?? 0, cpfCount: cpfRes.count ?? 0 }) }
}

export async function recordAttempt({
  tenantId,
  ipHash,
  cpfHash,
  success,
}: { tenantId: string; ipHash: string; cpfHash: string | null; success: boolean }): Promise<void> {
  const supabase = createServiceClient()
  await supabase.from('client_access_attempts').insert({
    tenant_id: tenantId,
    ip_hash: ipHash,
    cpf_hash: cpfHash,
    success,
  })
}
```

- [ ] **Step 4: Rodar teste — esperar pass (só as constantes/`isOverLimit`)**

```bash
pnpm --filter store test
```
Esperado: 16 passing. `checkRateLimit` e `recordAttempt` são integração com Supabase — testados pelo smoke test final.

- [ ] **Step 5: Commit**

```bash
git add apps/store
git commit -m "feat(store): adiciona rate limit por IP e CPF para portal do cliente"
```

---

## Task 7 — Helper `file-validation` (com testes)

**Files:**
- Modify: `apps/store/package.json` (adiciona `file-type`)
- Create: `apps/store/src/app/(store)/meus-documentos/_lib/file-validation.ts`
- Create: `apps/store/src/app/(store)/meus-documentos/_lib/__tests__/file-validation.test.ts`

- [ ] **Step 1: Instalar `file-type`**

```bash
pnpm --filter store add file-type
```

- [ ] **Step 2: Escrever teste falhando**

`apps/store/src/app/(store)/meus-documentos/_lib/__tests__/file-validation.test.ts`:

```ts
import { describe, expect, it } from 'vitest'
import {
  ALLOWED_MIME,
  ALLOWED_EXT_MAP,
  MAX_FILE_SIZE_BYTES,
  validateUploadedFile,
} from '@/app/(store)/meus-documentos/_lib/file-validation'

describe('constants', () => {
  it('allowed MIMEs include pdf and core image formats', () => {
    expect(ALLOWED_MIME).toContain('application/pdf')
    expect(ALLOWED_MIME).toContain('image/jpeg')
    expect(ALLOWED_MIME).toContain('image/png')
    expect(ALLOWED_MIME).toContain('image/webp')
    expect(ALLOWED_MIME).toContain('image/heic')
  })

  it('does NOT allow SVG, HTML, ZIP, DOC', () => {
    expect(ALLOWED_MIME).not.toContain('image/svg+xml')
    expect(ALLOWED_MIME).not.toContain('text/html')
    expect(ALLOWED_MIME).not.toContain('application/zip')
    expect(ALLOWED_MIME).not.toContain('application/msword')
  })

  it('extension map covers every allowed mime', () => {
    for (const mime of ALLOWED_MIME) expect(ALLOWED_EXT_MAP[mime]).toBeTruthy()
  })

  it('max file size is 10MB', () => {
    expect(MAX_FILE_SIZE_BYTES).toBe(10 * 1024 * 1024)
  })
})

const PNG_MAGIC = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a])
const PDF_MAGIC = Buffer.from('%PDF-1.4\n', 'ascii')

describe('validateUploadedFile', () => {
  it('accepts a valid PNG with matching MIME', async () => {
    const file = new File([PNG_MAGIC], 'doc.png', { type: 'image/png' })
    const result = await validateUploadedFile(file)
    expect(result.ok).toBe(true)
    if (result.ok) {
      expect(result.detectedMime).toBe('image/png')
      expect(result.ext).toBe('png')
    }
  })

  it('accepts a valid PDF', async () => {
    const file = new File([PDF_MAGIC], 'doc.pdf', { type: 'application/pdf' })
    const result = await validateUploadedFile(file)
    expect(result.ok).toBe(true)
  })

  it('rejects an empty file', async () => {
    const file = new File([], 'empty.png', { type: 'image/png' })
    const result = await validateUploadedFile(file)
    expect(result.ok).toBe(false)
  })

  it('rejects when claimed MIME is not in allow-list (svg)', async () => {
    const file = new File([Buffer.from('<svg></svg>')], 'doc.svg', { type: 'image/svg+xml' })
    const result = await validateUploadedFile(file)
    expect(result.ok).toBe(false)
  })

  it('rejects when magic bytes do not match claimed MIME (html disguised as png)', async () => {
    const html = Buffer.from('<html><body>x</body></html>')
    const file = new File([html], 'doc.png', { type: 'image/png' })
    const result = await validateUploadedFile(file)
    expect(result.ok).toBe(false)
  })

  it('rejects files larger than max size', async () => {
    const big = Buffer.alloc(10 * 1024 * 1024 + 1)
    PNG_MAGIC.copy(big)
    const file = new File([big], 'doc.png', { type: 'image/png' })
    const result = await validateUploadedFile(file)
    expect(result.ok).toBe(false)
  })
})
```

- [ ] **Step 3: Rodar teste — esperar falha**

```bash
pnpm --filter store test
```

- [ ] **Step 4: Implementar `file-validation.ts`**

`apps/store/src/app/(store)/meus-documentos/_lib/file-validation.ts`:

```ts
import { fileTypeFromBuffer } from 'file-type'
import { z } from 'zod'

export const ALLOWED_MIME = [
  'application/pdf',
  'image/jpeg',
  'image/png',
  'image/webp',
  'image/heic',
] as const

export const ALLOWED_EXT_MAP: Record<string, string> = {
  'application/pdf': 'pdf',
  'image/jpeg': 'jpg',
  'image/png': 'png',
  'image/webp': 'webp',
  'image/heic': 'heic',
}

export const MAX_FILE_SIZE_BYTES = 10 * 1024 * 1024

export const fileSchema = z
  .instanceof(File)
  .refine((f) => f.size > 0, 'Arquivo vazio')
  .refine((f) => f.size <= MAX_FILE_SIZE_BYTES, 'Máximo 10MB')
  .refine((f) => ALLOWED_MIME.includes(f.type as (typeof ALLOWED_MIME)[number]), 'Tipo não permitido')

export type FileValidationResult =
  | { ok: true; buffer: Buffer; detectedMime: string; ext: string }
  | { ok: false; error: string }

export async function validateUploadedFile(file: File): Promise<FileValidationResult> {
  const parsed = fileSchema.safeParse(file)
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? 'Arquivo inválido' }
  }

  const buffer = Buffer.from(await file.arrayBuffer())
  const detected = await fileTypeFromBuffer(buffer)
  if (!detected) return { ok: false, error: 'Arquivo inválido' }
  if (!ALLOWED_MIME.includes(detected.mime as (typeof ALLOWED_MIME)[number])) {
    return { ok: false, error: 'Arquivo inválido' }
  }
  if (detected.mime !== file.type) return { ok: false, error: 'Arquivo inválido' }

  const ext = ALLOWED_EXT_MAP[detected.mime]
  if (!ext) return { ok: false, error: 'Arquivo inválido' }

  return { ok: true, buffer, detectedMime: detected.mime, ext }
}
```

- [ ] **Step 5: Rodar teste — esperar pass**

```bash
pnpm --filter store test
```
Esperado: 22 passing.

- [ ] **Step 6: Commit**

```bash
git add apps/store
git commit -m "feat(store): adiciona validacao rigida de upload com Zod e magic bytes"
```

---

## Task 8 — Helper `audit`

**Files:**
- Create: `apps/store/src/app/(store)/meus-documentos/_lib/audit.ts`

- [ ] **Step 1: Implementar `audit.ts`**

```ts
import { createServiceClient } from '@/lib/supabase/service'

type AuditAction = 'viewed_list' | 'viewed_proposal' | 'uploaded' | 'downloaded'

export async function logAccess(params: {
  tenantId: string
  proposalId: string
  action: AuditAction
  documentType?: string | null
  ipHash: string
  userAgentHash: string
}): Promise<void> {
  const supabase = createServiceClient()
  await supabase.from('proposal_document_access_log').insert({
    tenant_id: params.tenantId,
    proposal_id: params.proposalId,
    action: params.action,
    document_type: params.documentType ?? null,
    ip_hash: params.ipHash,
    user_agent_hash: params.userAgentHash,
  })
}
```

- [ ] **Step 2: Commit**

```bash
git add apps/store
git commit -m "feat(store): adiciona helper de audit log para portal de documentos"
```

---

## Task 9 — Hook: popular `client_cpf_hash` ao criar/salvar proposta

**Files:**
- Modify: `apps/store/src/app/(store)/contratar/actions.ts`

- [ ] **Step 1: Identificar onde o CPF entra no `form_data`**

Buscar para confirmar:
```bash
grep -rn "cpf" apps/store/src/app/\(store\)/contratar/\[productTypeSlug\]/_components/steps/
```
Esperado: confirmar que `dados-pessoais-pf-step.tsx` envia `data: { nome, cpf, nascimento, email, whatsapp }` para `stepData`. A chave do CPF dentro de `form_data` é `dados-pessoais.cpf` (chave do step pode variar por wizard).

- [ ] **Step 2: Adicionar utilitário `extractCpfFromFormData` em `actions.ts`**

No topo de `apps/store/src/app/(store)/contratar/actions.ts` (após imports), adicionar:

```ts
import { hashCpf } from '@/app/(store)/meus-documentos/_lib/cpf-hash'
import { validateCPF } from '@/lib/utils/cpf'

function extractCpfFromFormData(formData: Record<string, unknown>): string | null {
  for (const value of Object.values(formData)) {
    if (value && typeof value === 'object' && 'cpf' in value) {
      const raw = (value as { cpf?: unknown }).cpf
      if (typeof raw === 'string') {
        const digits = raw.replace(/\D/g, '')
        if (validateCPF(digits)) return digits
      }
    }
  }
  return null
}
```

- [ ] **Step 3: Popular hash em `createProposal`**

Em `createProposal`, no objeto `.insert({...})`, calcular hash do CPF se o `stepData` tiver:

```ts
const candidateData = { [stepSlug]: stepData } as Record<string, unknown>
const cpf = extractCpfFromFormData(candidateData)
const clientCpfHash = cpf ? hashCpf(cpf) : null

const { data: proposal, error } = await supabase
  .from('proposals')
  .insert({
    tenant_id: tenantId,
    product_id: (tp.products as { id: string }).id,
    product_type_slug: productTypeSlug,
    simulation_id: simulationId ?? null,
    status: 'nova_proposta',
    current_step: nextStep,
    client_name: clientName ?? null,
    client_phone: clientPhone ?? null,
    client_cpf_hash: clientCpfHash,
    form_data: candidateData as Json,
  })
  .select('id')
  .single()
```

- [ ] **Step 4: Popular hash em `saveStep`**

Na função `saveStep`, após calcular `mergedFormData`:

```ts
const mergedCpf = extractCpfFromFormData(mergedFormData)
const updatePayload: Record<string, unknown> = {
  form_data: mergedFormData as Json,
  current_step: nextStep,
}
if (mergedCpf) updatePayload.client_cpf_hash = hashCpf(mergedCpf)

const { error: updateError } = await supabase
  .from('proposals')
  .update(updatePayload)
  .eq('id', proposalId)
  .eq('tenant_id', tenantId)
```

(Substituir o `update` existente por esta versão. Manter qualquer outro campo já atualizado lá.)

- [ ] **Step 5: Typecheck**

```bash
pnpm --filter store typecheck
```

- [ ] **Step 6: Commit**

```bash
git add apps/store/src/app/\(store\)/contratar/actions.ts
git commit -m "feat(store): preenche client_cpf_hash em propostas ao criar e salvar"
```

---

## Task 10 — Script de backfill `scripts/backfill-cpf-hash.ts`

**Files:**
- Create: `scripts/backfill-cpf-hash.ts`
- Modify: `package.json` raiz (adiciona script)

- [ ] **Step 1: Criar o script**

`scripts/backfill-cpf-hash.ts`:

```ts
// Executar com: pnpm tsx scripts/backfill-cpf-hash.ts
// Requer SUPABASE_SECRET_KEY, NEXT_PUBLIC_SUPABASE_URL e SUPABASE_CPF_PEPPER no env.
import 'dotenv/config'
import { createClient } from '@supabase/supabase-js'
import { createHash } from 'node:crypto'

const url = process.env.NEXT_PUBLIC_SUPABASE_URL
const key = process.env.SUPABASE_SECRET_KEY
const pepper = process.env.SUPABASE_CPF_PEPPER

if (!url || !key || !pepper) {
  console.error('Missing env vars: NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SECRET_KEY, SUPABASE_CPF_PEPPER')
  process.exit(1)
}

function validateCPF(raw: string): boolean {
  const d = raw.replace(/\D/g, '')
  if (d.length !== 11 || /^(\d)\1+$/.test(d)) return false
  const calc = (len: number) => {
    let s = 0
    for (let i = 0; i < len; i++) s += Number(d[i]) * (len + 1 - i)
    const r = 11 - (s % 11)
    return r >= 10 ? 0 : r
  }
  return calc(9) === Number(d[9]) && calc(10) === Number(d[10])
}

function hashCpf(cpf: string): string {
  const digits = cpf.replace(/\D/g, '')
  return createHash('sha256').update(`cpf:${digits}:${pepper}`).digest('hex')
}

function extractCpf(formData: Record<string, unknown> | null): string | null {
  if (!formData) return null
  for (const value of Object.values(formData)) {
    if (value && typeof value === 'object' && 'cpf' in value) {
      const raw = (value as { cpf?: unknown }).cpf
      if (typeof raw === 'string') {
        const digits = raw.replace(/\D/g, '')
        if (validateCPF(digits)) return digits
      }
    }
  }
  return null
}

async function main() {
  const supabase = createClient(url!, key!)
  const pageSize = 500
  let processed = 0
  let updated = 0
  let skipped = 0

  while (true) {
    const { data, error } = await supabase
      .from('proposals')
      .select('id, form_data')
      .is('client_cpf_hash', null)
      .order('created_at', { ascending: true })
      .limit(pageSize)

    if (error) {
      console.error('Query error:', error)
      process.exit(1)
    }
    if (!data || data.length === 0) break

    for (const row of data) {
      processed++
      const cpf = extractCpf(row.form_data as Record<string, unknown> | null)
      if (!cpf) { skipped++; continue }
      const { error: updErr } = await supabase
        .from('proposals')
        .update({ client_cpf_hash: hashCpf(cpf) })
        .eq('id', row.id)
      if (updErr) {
        console.error(`Failed update ${row.id}:`, updErr)
        skipped++
        continue
      }
      updated++
    }

    if (data.length < pageSize) break
  }

  console.log(`Backfill done: processed=${processed} updated=${updated} skipped=${skipped}`)
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})
```

- [ ] **Step 2: Adicionar script em `package.json` raiz**

```json
"scripts": {
  "...": "...",
  "backfill:cpf-hash": "tsx scripts/backfill-cpf-hash.ts"
}
```

(Adicionar logo após o script de `db:types`.)

- [ ] **Step 3: Instalar `tsx` se ainda não estiver no devDeps raiz**

```bash
pnpm add -Dw tsx
```

- [ ] **Step 4: Rodar backfill contra o ambiente local**

```bash
pnpm env:load pnpm backfill:cpf-hash
```
Ou (se `env:load` não estiver na raiz):
```bash
SUPABASE_SECRET_KEY=... NEXT_PUBLIC_SUPABASE_URL=... SUPABASE_CPF_PEPPER=... pnpm backfill:cpf-hash
```

Esperado: linha `Backfill done: processed=X updated=Y skipped=Z`.

- [ ] **Step 5: Verificar amostra no banco**

```bash
psql $SUPABASE_DB_URL -c "select id, client_cpf_hash is not null as has_hash from proposals limit 10;"
```
Ou via Supabase Studio.

- [ ] **Step 6: Commit**

```bash
git add scripts package.json pnpm-lock.yaml
git commit -m "chore(scripts): adiciona backfill de client_cpf_hash em proposals"
```

---

## Task 11 — Server Action `validateCpfAction`

**Files:**
- Create: `apps/store/src/app/(store)/meus-documentos/actions.ts`
- Create: `apps/store/src/app/(store)/meus-documentos/queries.ts`

- [ ] **Step 1: Criar `queries.ts`**

```ts
import { createServiceClient } from '@/lib/supabase/service'
import { getRequiredDocs } from '@vello/proposals-shared/required-documents'

export async function listClientProposals(tenantId: string, cpfHash: string) {
  const supabase = createServiceClient()
  const { data } = await supabase
    .from('proposals')
    .select(`
      id,
      status,
      product_type_slug,
      products ( name ),
      proposal_documents ( document_type )
    `)
    .eq('tenant_id', tenantId)
    .eq('client_cpf_hash', cpfHash)
    .order('created_at', { ascending: false })

  const list = data ?? []
  return list.map((p) => {
    const required = getRequiredDocs(p.product_type_slug)
    const uploaded = new Set(
      Array.isArray(p.proposal_documents)
        ? p.proposal_documents.map((d) => d.document_type)
        : [],
    )
    const pendingCount = required.filter((r) => !uploaded.has(r.type)).length
    return {
      id: p.id,
      status: p.status,
      productName: (p.products as { name?: string } | null)?.name ?? '—',
      productTypeSlug: p.product_type_slug,
      pendingCount,
    }
  })
}

export async function getClientProposal(
  proposalId: string,
  tenantId: string,
  cpfHash: string,
) {
  const supabase = createServiceClient()
  const { data } = await supabase
    .from('proposals')
    .select(`
      id,
      status,
      product_type_slug,
      products ( name ),
      proposal_documents ( id, document_type, file_name, storage_path, created_at )
    `)
    .eq('id', proposalId)
    .eq('tenant_id', tenantId)
    .eq('client_cpf_hash', cpfHash)
    .single()
  return data ?? null
}
```

- [ ] **Step 2: Criar `actions.ts` com `validateCpfAction`**

```ts
'use server'

import { headers } from 'next/headers'
import { redirect } from 'next/navigation'
import { z } from 'zod'

import { hashCpf, hashIp, hashUserAgent } from './_lib/cpf-hash'
import { checkRateLimit, recordAttempt } from './_lib/rate-limit'
import { signClientSession, setClientSessionCookie, clearClientSessionCookie, readClientSession } from './_lib/session'
import { validateUploadedFile } from './_lib/file-validation'
import { logAccess } from './_lib/audit'
import { createServiceClient } from '@/lib/supabase/service'
import { validateCPF } from '@/lib/utils/cpf'
import { revalidatePath } from 'next/cache'
import { randomUUID } from 'node:crypto'

const cpfSchema = z.object({
  cpf: z.string().transform((v) => v.replace(/\D/g, '')).refine(validateCPF, 'CPF inválido'),
})

const GENERIC_ERROR = 'Não foi possível validar. Tente novamente em alguns minutos.'

async function getRequestContext() {
  const h = await headers()
  const tenantId = h.get('x-tenant-id') ?? ''
  const ip = h.get('x-forwarded-for')?.split(',')[0]?.trim() ?? h.get('x-real-ip') ?? '0.0.0.0'
  const ua = h.get('user-agent') ?? ''
  return { tenantId, ipHash: hashIp(ip), userAgentHash: hashUserAgent(ua) }
}

export async function validateCpfAction(formData: FormData): Promise<{ error?: string }> {
  const { tenantId, ipHash } = await getRequestContext()
  if (!tenantId) return { error: GENERIC_ERROR }

  const parsed = cpfSchema.safeParse({ cpf: formData.get('cpf') })
  if (!parsed.success) return { error: GENERIC_ERROR }

  const cpfHash = hashCpf(parsed.data.cpf)

  const { blocked } = await checkRateLimit({ ipHash, cpfHash })
  if (blocked) {
    await recordAttempt({ tenantId, ipHash, cpfHash, success: false })
    return { error: GENERIC_ERROR }
  }

  await recordAttempt({ tenantId, ipHash, cpfHash, success: true })

  const token = await signClientSession({ cpf_hash: cpfHash, tenant_id: tenantId })
  await setClientSessionCookie(token)

  redirect('/meus-documentos/propostas')
}

export async function logoutClientAction(): Promise<void> {
  await clearClientSessionCookie()
  redirect('/meus-documentos')
}

const uploadSchema = z.object({
  proposalId: z.string().uuid(),
  documentType: z.string().min(1).max(64).regex(/^[a-z0-9_]+$/),
})

export async function uploadDocumentAction(formData: FormData): Promise<{ error?: string; ok?: true }> {
  const { tenantId, ipHash, userAgentHash } = await getRequestContext()
  if (!tenantId) return { error: 'Tenant não identificado' }

  const session = await readClientSession(tenantId)
  if (!session) return { error: 'Sessão expirada' }

  const parsedMeta = uploadSchema.safeParse({
    proposalId: formData.get('proposalId'),
    documentType: formData.get('documentType'),
  })
  if (!parsedMeta.success) return { error: 'Dados inválidos' }

  const file = formData.get('file')
  if (!(file instanceof File)) return { error: 'Arquivo ausente' }

  const supabase = createServiceClient()
  const { data: proposal } = await supabase
    .from('proposals')
    .select('id, tenant_id, client_cpf_hash')
    .eq('id', parsedMeta.data.proposalId)
    .single()
  if (!proposal || proposal.tenant_id !== tenantId || proposal.client_cpf_hash !== session.cpf_hash) {
    return { error: 'Proposta não encontrada' }
  }

  const validation = await validateUploadedFile(file)
  if (!validation.ok) return { error: 'Arquivo inválido' }

  const storagePath = `${tenantId}/${parsedMeta.data.proposalId}/${parsedMeta.data.documentType}/${randomUUID()}.${validation.ext}`

  const { error: uploadErr } = await supabase.storage
    .from('proposal-documents')
    .upload(storagePath, validation.buffer, {
      contentType: validation.detectedMime,
      upsert: false,
    })
  if (uploadErr) return { error: 'Falha no upload' }

  const safeName = file.name.replace(/[^\w.\-]/g, '_').slice(0, 100)
  const { error: insertErr } = await supabase
    .from('proposal_documents')
    .upsert(
      {
        proposal_id: parsedMeta.data.proposalId,
        document_type: parsedMeta.data.documentType,
        storage_path: storagePath,
        file_name: safeName,
      },
      { onConflict: 'proposal_id,document_type' },
    )
  if (insertErr) return { error: 'Falha ao registrar documento' }

  await logAccess({
    tenantId,
    proposalId: parsedMeta.data.proposalId,
    action: 'uploaded',
    documentType: parsedMeta.data.documentType,
    ipHash,
    userAgentHash,
  })

  revalidatePath(`/meus-documentos/propostas/${parsedMeta.data.proposalId}`)
  return { ok: true }
}
```

- [ ] **Step 3: Typecheck**

```bash
pnpm --filter store typecheck
```

- [ ] **Step 4: Commit**

```bash
git add apps/store/src/app/\(store\)/meus-documentos
git commit -m "feat(store): adiciona server actions e queries do portal de documentos"
```

---

## Task 12 — Página `/meus-documentos` (form CPF)

**Files:**
- Create: `apps/store/src/app/(store)/meus-documentos/page.tsx`
- Create: `apps/store/src/app/(store)/meus-documentos/_components/cpf-form.tsx`

- [ ] **Step 1: Criar `cpf-form.tsx`**

```tsx
'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { InputMask } from '@react-input/mask'
import { toast } from 'sonner'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { validateCpfAction } from '@/app/(store)/meus-documentos/actions'

export function CpfForm() {
  const [cpf, setCpf] = useState('')
  const [pending, startTransition] = useTransition()
  const router = useRouter()

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    const fd = new FormData()
    fd.set('cpf', cpf)
    startTransition(async () => {
      const result = await validateCpfAction(fd)
      if (result?.error) toast.error(result.error)
      else router.refresh()
    })
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      <div className="flex flex-col gap-2">
        <label htmlFor="cpf" className="text-sm font-medium text-foreground">
          CPF
        </label>
        <InputMask
          component={Input}
          mask="___.___.___-__"
          replacement={{ _: /\d/ }}
          id="cpf"
          name="cpf"
          inputMode="numeric"
          placeholder="000.000.000-00"
          value={cpf}
          onChange={(e) => setCpf(e.currentTarget.value)}
          autoComplete="off"
          required
        />
      </div>
      <Button type="submit" disabled={pending || cpf.replace(/\D/g, '').length !== 11}>
        {pending ? 'Validando…' : 'Continuar'}
      </Button>
      <p className="text-xs text-muted-foreground">
        Suas informações são protegidas.
      </p>
    </form>
  )
}
```

- [ ] **Step 2: Criar `page.tsx`**

```tsx
import { headers } from 'next/headers'
import { redirect } from 'next/navigation'

import { CpfForm } from './_components/cpf-form'
import { readClientSession } from './_lib/session'

export const dynamic = 'force-dynamic'

export default async function MeusDocumentosPage() {
  const tenantId = (await headers()).get('x-tenant-id') ?? ''
  if (tenantId) {
    const session = await readClientSession(tenantId)
    if (session) redirect('/meus-documentos/propostas')
  }

  return (
    <section className="mx-auto flex w-full max-w-md flex-col gap-8 px-4 py-12 md:py-20">
      <div className="flex flex-col gap-2">
        <p className="text-xs uppercase tracking-widest text-muted-foreground">
          Portal do cliente
        </p>
        <h1 className="text-4xl font-semibold tracking-tight text-foreground md:text-5xl">
          Documentos<span className="text-primary">.</span>
        </h1>
        <p className="text-sm text-muted-foreground">
          Informe seu CPF para visualizar suas propostas e enviar documentos pendentes.
        </p>
      </div>
      <CpfForm />
    </section>
  )
}
```

- [ ] **Step 3: Rodar dev e validar visualmente**

```bash
pnpm --filter store dev
```
Abrir `http://<tenant-slug>.localhost:3002/meus-documentos`. Esperado: form renderiza, máscara funciona, botão "Continuar" desabilita quando CPF está incompleto.

- [ ] **Step 4: Commit**

```bash
git add apps/store/src/app/\(store\)/meus-documentos/page.tsx apps/store/src/app/\(store\)/meus-documentos/_components/cpf-form.tsx
git commit -m "feat(store): adiciona pagina de entrada do portal de documentos"
```

---

## Task 13 — Página `/meus-documentos/propostas` (lista) + componentes

**Files:**
- Create: `apps/store/src/app/(store)/meus-documentos/propostas/page.tsx`
- Create: `apps/store/src/app/(store)/meus-documentos/_components/client-header.tsx`
- Create: `apps/store/src/app/(store)/meus-documentos/_components/proposal-card.tsx`

- [ ] **Step 1: Criar `client-header.tsx`**

```tsx
'use client'

import { useTransition } from 'react'
import { LogOut } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { logoutClientAction } from '@/app/(store)/meus-documentos/actions'

export function ClientHeader({ title }: { title: string }) {
  const [pending, startTransition] = useTransition()
  return (
    <div className="flex items-center justify-between gap-4">
      <p className="text-xs uppercase tracking-widest text-muted-foreground">{title}</p>
      <Button
        variant="ghost"
        size="sm"
        onClick={() => startTransition(() => logoutClientAction())}
        disabled={pending}
      >
        <LogOut className="size-4" />
        Sair
      </Button>
    </div>
  )
}
```

- [ ] **Step 2: Criar `proposal-card.tsx`**

```tsx
import Link from 'next/link'
import { ArrowRight, CheckCircle2, Clock } from 'lucide-react'

import { getStatusLabel } from '@vello/proposals-shared/status-config'

interface Props {
  id: string
  status: string
  productName: string
  pendingCount: number
}

export function ProposalCard({ id, status, productName, pendingCount }: Props) {
  const allSent = pendingCount === 0
  return (
    <Link
      href={`/meus-documentos/propostas/${id}`}
      className="group flex flex-col gap-3 rounded-xl border border-border bg-card p-5 transition hover:border-primary/40"
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex flex-col gap-1">
          <p className="text-xs uppercase tracking-widest text-muted-foreground">
            PROP-{id.slice(0, 4).toUpperCase()}
          </p>
          <h3 className="text-lg font-semibold text-foreground">{productName}</h3>
        </div>
        <ArrowRight className="size-4 text-muted-foreground transition group-hover:translate-x-0.5 group-hover:text-primary" />
      </div>

      <div className="flex items-center gap-2">
        <span className="inline-flex items-center gap-1.5 rounded-md border border-border bg-muted/40 px-2.5 py-1 text-xs font-medium text-foreground">
          {getStatusLabel(status)}
        </span>

        {allSent ? (
          <span className="inline-flex items-center gap-1.5 rounded-md border border-success/30 bg-success/10 px-2.5 py-1 text-xs font-medium text-success">
            <CheckCircle2 className="size-3" />
            Tudo enviado
          </span>
        ) : (
          <span className="inline-flex items-center gap-1.5 rounded-md border border-warning/30 bg-warning/10 px-2.5 py-1 text-xs font-medium text-warning">
            <Clock className="size-3" />
            {pendingCount} pendente{pendingCount > 1 ? 's' : ''}
          </span>
        )}
      </div>
    </Link>
  )
}
```

- [ ] **Step 3: Criar `propostas/page.tsx`**

```tsx
import { headers } from 'next/headers'
import { redirect } from 'next/navigation'
import Link from 'next/link'

import { Button } from '@/components/ui/button'
import { readClientSession } from '@/app/(store)/meus-documentos/_lib/session'
import { hashIp, hashUserAgent } from '@/app/(store)/meus-documentos/_lib/cpf-hash'
import { logAccess } from '@/app/(store)/meus-documentos/_lib/audit'
import { listClientProposals } from '@/app/(store)/meus-documentos/queries'
import { ClientHeader } from '@/app/(store)/meus-documentos/_components/client-header'
import { ProposalCard } from '@/app/(store)/meus-documentos/_components/proposal-card'

export const dynamic = 'force-dynamic'

export default async function PropostasPage() {
  const h = await headers()
  const tenantId = h.get('x-tenant-id') ?? ''
  if (!tenantId) redirect('/meus-documentos')

  const session = await readClientSession(tenantId)
  if (!session) redirect('/meus-documentos')

  const proposals = await listClientProposals(tenantId, session.cpf_hash)

  // Log: viewed_list — uma entrada por sessão é o suficiente. Aqui registramos a primeira proposta
  // como proxy para "viu a lista"; se não houver proposta, ainda registramos com proposal_id NULL?
  // O schema exige proposal_id NOT NULL, então só logamos quando houver pelo menos uma.
  if (proposals[0]) {
    await logAccess({
      tenantId,
      proposalId: proposals[0].id,
      action: 'viewed_list',
      ipHash: hashIp(h.get('x-forwarded-for')?.split(',')[0]?.trim() ?? '0.0.0.0'),
      userAgentHash: hashUserAgent(h.get('user-agent') ?? ''),
    })
  }

  return (
    <section className="mx-auto flex w-full max-w-2xl flex-col gap-8 px-4 py-10 md:py-16">
      <ClientHeader title="Portal do cliente" />
      <div className="flex flex-col gap-2">
        <h1 className="text-4xl font-semibold tracking-tight text-foreground md:text-5xl">
          Suas propostas<span className="text-primary">.</span>
        </h1>
        <p className="text-sm text-muted-foreground">
          Clique em uma proposta para enviar documentos pendentes.
        </p>
      </div>

      {proposals.length === 0 ? (
        <div className="flex flex-col items-start gap-4 rounded-xl border border-dashed border-border bg-card/60 p-6">
          <p className="text-sm text-muted-foreground">
            Nenhuma proposta encontrada para este CPF nesta loja.
          </p>
          <Button asChild variant="outline" size="sm">
            <Link href="/simulador">Ir para o simulador</Link>
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-3">
          {proposals.map((p) => (
            <ProposalCard
              key={p.id}
              id={p.id}
              status={p.status}
              productName={p.productName}
              pendingCount={p.pendingCount}
            />
          ))}
        </div>
      )}
    </section>
  )
}
```

- [ ] **Step 4: Validar visualmente**

Com tenant válido + proposta no banco com `client_cpf_hash` preenchido, fluxo: enviar CPF → lista renderiza com a proposta correta + contador.

- [ ] **Step 5: Commit**

```bash
git add apps/store/src/app/\(store\)/meus-documentos
git commit -m "feat(store): adiciona pagina de lista de propostas do cliente"
```

---

## Task 14 — Página `/meus-documentos/propostas/[proposalId]` (upload)

**Files:**
- Create: `apps/store/src/app/(store)/meus-documentos/propostas/[proposalId]/page.tsx`
- Create: `apps/store/src/app/(store)/meus-documentos/_components/document-uploader.tsx`

- [ ] **Step 1: Criar `document-uploader.tsx`**

```tsx
'use client'

import { useRef, useState, useTransition } from 'react'
import { CheckCircle2, FileUp, Loader2 } from 'lucide-react'
import { toast } from 'sonner'

import { Button } from '@/components/ui/button'
import { uploadDocumentAction } from '@/app/(store)/meus-documentos/actions'

interface Props {
  proposalId: string
  documentType: string
  label: string
  sent: boolean
}

export function DocumentUploader({ proposalId, documentType, label, sent }: Props) {
  const [pending, startTransition] = useTransition()
  const [done, setDone] = useState(sent)
  const inputRef = useRef<HTMLInputElement | null>(null)

  function handleFile(file: File) {
    const fd = new FormData()
    fd.set('proposalId', proposalId)
    fd.set('documentType', documentType)
    fd.set('file', file)
    startTransition(async () => {
      const result = await uploadDocumentAction(fd)
      if (result?.error) toast.error(result.error)
      else { setDone(true); toast.success('Documento enviado.') }
    })
  }

  if (done) {
    return (
      <div className="flex items-center justify-between gap-3 rounded-lg border border-success/30 bg-success/8 px-4 py-3">
        <div className="flex items-center gap-3">
          <CheckCircle2 className="size-5 text-success" />
          <p className="text-sm font-medium text-foreground">{label}</p>
        </div>
        <span className="text-xs font-medium text-success">Enviado</span>
      </div>
    )
  }

  return (
    <div className="flex items-center justify-between gap-3 rounded-lg border border-warning/30 bg-warning/8 px-4 py-3">
      <div className="flex items-center gap-3">
        <FileUp className="size-5 text-warning" />
        <p className="text-sm font-medium text-foreground">{label}</p>
      </div>
      <Button
        size="sm"
        variant="outline"
        disabled={pending}
        onClick={() => inputRef.current?.click()}
      >
        {pending ? <Loader2 className="size-4 animate-spin" /> : 'Selecionar arquivo'}
      </Button>
      <input
        ref={inputRef}
        type="file"
        accept="application/pdf,image/jpeg,image/png,image/webp,image/heic"
        hidden
        onChange={(e) => {
          const file = e.currentTarget.files?.[0]
          if (file) handleFile(file)
          e.currentTarget.value = ''
        }}
      />
    </div>
  )
}
```

- [ ] **Step 2: Criar `[proposalId]/page.tsx`**

```tsx
import { headers } from 'next/headers'
import { notFound, redirect } from 'next/navigation'
import Link from 'next/link'
import { CheckCircle2, ChevronLeft } from 'lucide-react'

import { getRequiredDocs } from '@vello/proposals-shared/required-documents'
import { getStatusLabel } from '@vello/proposals-shared/status-config'

import { readClientSession } from '@/app/(store)/meus-documentos/_lib/session'
import { hashIp, hashUserAgent } from '@/app/(store)/meus-documentos/_lib/cpf-hash'
import { logAccess } from '@/app/(store)/meus-documentos/_lib/audit'
import { getClientProposal } from '@/app/(store)/meus-documentos/queries'
import { ClientHeader } from '@/app/(store)/meus-documentos/_components/client-header'
import { DocumentUploader } from '@/app/(store)/meus-documentos/_components/document-uploader'

export const dynamic = 'force-dynamic'

interface PageProps {
  params: Promise<{ proposalId: string }>
}

export default async function ProposalDocumentsPage({ params }: PageProps) {
  const { proposalId } = await params
  const h = await headers()
  const tenantId = h.get('x-tenant-id') ?? ''
  if (!tenantId) redirect('/meus-documentos')

  const session = await readClientSession(tenantId)
  if (!session) redirect('/meus-documentos')

  const proposal = await getClientProposal(proposalId, tenantId, session.cpf_hash)
  if (!proposal) notFound()

  await logAccess({
    tenantId,
    proposalId,
    action: 'viewed_proposal',
    ipHash: hashIp(h.get('x-forwarded-for')?.split(',')[0]?.trim() ?? '0.0.0.0'),
    userAgentHash: hashUserAgent(h.get('user-agent') ?? ''),
  })

  const required = getRequiredDocs(proposal.product_type_slug)
  const uploadedDocs = Array.isArray(proposal.proposal_documents) ? proposal.proposal_documents : []
  const uploadedTypes = new Set(uploadedDocs.map((d) => d.document_type))
  const allSent = required.every((r) => uploadedTypes.has(r.type))

  return (
    <section className="mx-auto flex w-full max-w-2xl flex-col gap-8 px-4 py-10 md:py-16">
      <ClientHeader title="Portal do cliente" />
      <div className="flex flex-col gap-3">
        <Link
          href="/meus-documentos/propostas"
          className="inline-flex items-center gap-1 text-xs uppercase tracking-widest text-muted-foreground transition hover:text-foreground"
        >
          <ChevronLeft className="size-3" />
          Voltar para propostas
        </Link>
        <h1 className="text-4xl font-semibold tracking-tight text-foreground md:text-5xl">
          Documentos<span className="text-primary">.</span>
        </h1>
        <div className="flex flex-wrap items-center gap-2">
          <span className="inline-flex items-center gap-1.5 rounded-md border border-border bg-muted/40 px-2.5 py-1 text-xs font-medium text-foreground">
            PROP-{proposal.id.slice(0, 4).toUpperCase()}
          </span>
          <span className="inline-flex items-center gap-1.5 rounded-md border border-border bg-muted/40 px-2.5 py-1 text-xs font-medium text-foreground">
            {getStatusLabel(proposal.status)}
          </span>
        </div>
      </div>

      {allSent ? (
        <div className="flex items-center gap-3 rounded-xl border border-success/30 bg-success/8 px-5 py-4">
          <CheckCircle2 className="size-5 text-success" />
          <p className="text-sm font-medium text-foreground">
            Tudo certo. Aguarde a análise da equipe.
          </p>
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          {required.map((doc) => (
            <DocumentUploader
              key={doc.type}
              proposalId={proposal.id}
              documentType={doc.type}
              label={doc.label}
              sent={uploadedTypes.has(doc.type)}
            />
          ))}
        </div>
      )}
    </section>
  )
}
```

- [ ] **Step 3: Validar visualmente**

Fluxo: CPF → lista → entrar na proposta → enviar um PDF e um PNG → cada um aparece como "Enviado". Tentar arquivo > 10MB ou .svg → toast genérico.

- [ ] **Step 4: Commit**

```bash
git add apps/store/src/app/\(store\)/meus-documentos
git commit -m "feat(store): adiciona pagina de upload por documento pendente"
```

---

## Task 15 — Headers de segurança para `/meus-documentos/*`

**Files:**
- Modify: `apps/store/src/proxy.ts`

- [ ] **Step 1: Adicionar headers de cache e robots ao final do handler**

O `proxy.ts` atual termina com:

```ts
const { response } = await updateSession(request, tenant)
return response
```

Substituir esse trecho final por:

```ts
const { response } = await updateSession(request, tenant)

if (pathname.startsWith('/meus-documentos')) {
  response.headers.set('Cache-Control', 'no-store')
  response.headers.set('X-Robots-Tag', 'noindex, nofollow')
}

return response
```

(`pathname` já está disponível no escopo — extraído em `const { pathname } = request.nextUrl` no topo do handler.)

- [ ] **Step 3: Validar headers**

```bash
curl -I http://<tenant-slug>.localhost:3002/meus-documentos | grep -iE 'cache-control|x-robots'
```
Esperado: `Cache-Control: no-store`, `X-Robots-Tag: noindex, nofollow`.

- [ ] **Step 4: Commit**

```bash
git add apps/store/proxy.ts
git commit -m "feat(store): aplica headers de seguranca em /meus-documentos"
```

---

## Task 16 — Console: helper `getPortalUrl`

**Files:**
- Create: `apps/console/src/lib/tenant/portal-url.ts`

- [ ] **Step 1: Criar `portal-url.ts`**

```ts
import { env } from '@vello/env/console'
import { createServiceClient } from '@/lib/supabase/service'

export async function getPortalUrl(tenantId: string): Promise<string> {
  const supabase = createServiceClient()
  const { data } = await supabase
    .from('tenants')
    .select('slug, custom_domain')
    .eq('id', tenantId)
    .single()
  if (!data) return ''

  const host = data.custom_domain && data.custom_domain.length > 0
    ? data.custom_domain
    : `${data.slug}.${env.STORE_BASE_DOMAIN}`

  return `https://${host}/meus-documentos`
}
```

- [ ] **Step 2: Typecheck**

```bash
pnpm --filter console typecheck
```

- [ ] **Step 3: Commit**

```bash
git add apps/console/src/lib/tenant
git commit -m "feat(console): adiciona helper getPortalUrl para link do cliente"
```

---

## Task 17 — Console: componente `ClientShareCard`

**Files:**
- Create: `apps/console/src/app/(private)/proposals/[id]/_components/client-share-card.tsx`

- [ ] **Step 1: Criar `client-share-card.tsx`**

```tsx
'use client'

import { useState } from 'react'
import { Copy, MessageCircle, Send } from 'lucide-react'
import { toast } from 'sonner'

import { Button } from '@/components/ui/button'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'

interface Props {
  portalUrl: string
  pendingCount: number
  clientName: string | null
  clientPhone: string | null
}

function buildWhatsappUrl(phone: string, message: string): string {
  const digits = phone.replace(/\D/g, '')
  return `https://wa.me/${digits}?text=${encodeURIComponent(message)}`
}

export function ClientShareCard({ portalUrl, pendingCount, clientName, clientPhone }: Props) {
  const [copied, setCopied] = useState(false)
  const greeting = clientName ? `Olá ${clientName}!` : 'Olá!'
  const message = `${greeting} Você tem ${pendingCount} documento${pendingCount > 1 ? 's' : ''} pendente${pendingCount > 1 ? 's' : ''} em sua proposta. Acesse: ${portalUrl}`

  async function copy() {
    await navigator.clipboard.writeText(portalUrl)
    setCopied(true)
    toast.success('Link copiado.')
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div className="mb-4 flex flex-col gap-3 rounded-xl border border-primary/25 bg-primary/5 p-4">
      <div className="flex items-start gap-3">
        <div className="grid size-9 shrink-0 place-items-center rounded-lg bg-primary/10 text-primary">
          <Send className="size-4" />
        </div>
        <div className="flex flex-col gap-1">
          <p className="text-sm font-medium text-foreground">Enviar link ao cliente</p>
          <p className="text-xs text-muted-foreground">
            O cliente acessa esta página com o CPF dele e envia os {pendingCount} documentos pendentes diretamente.
          </p>
        </div>
      </div>

      <div className="flex items-center gap-2 rounded-md border border-border bg-card px-3 py-2">
        <p className="flex-1 truncate text-xs font-mono text-muted-foreground">{portalUrl}</p>
      </div>

      <div className="flex items-center gap-2">
        <Button variant="outline" size="sm" onClick={copy}>
          <Copy className="size-3.5" />
          {copied ? 'Copiado' : 'Copiar link'}
        </Button>

        {clientPhone ? (
          <Button asChild variant="outline" size="sm">
            <a
              href={buildWhatsappUrl(clientPhone, message)}
              target="_blank"
              rel="noopener noreferrer"
            >
              <MessageCircle className="size-3.5" />
              Enviar via WhatsApp
            </a>
          </Button>
        ) : (
          <Tooltip>
            <TooltipTrigger asChild>
              <span>
                <Button variant="outline" size="sm" disabled>
                  <MessageCircle className="size-3.5" />
                  Enviar via WhatsApp
                </Button>
              </span>
            </TooltipTrigger>
            <TooltipContent>Telefone do cliente não cadastrado</TooltipContent>
          </Tooltip>
        )}
      </div>
    </div>
  )
}
```

- [ ] **Step 2: Commit**

```bash
git add apps/console/src/app/\(private\)/proposals/\[id\]/_components/client-share-card.tsx
git commit -m "feat(console): adiciona card de compartilhamento de link do portal"
```

---

## Task 18 — Console: integrar `ClientShareCard` na `DocumentsTab`

**Files:**
- Modify: `apps/console/src/app/(private)/proposals/queries.ts`
- Modify: `apps/console/src/app/(private)/proposals/[id]/_components/documents-tab.tsx`
- Modify: `apps/console/src/app/(private)/proposals/[id]/_components/proposal-tabs.tsx`
- Modify: `apps/console/src/app/(private)/proposals/[id]/page.tsx`

- [ ] **Step 1: Adicionar `tenant_id` ao SELECT de `getProposal`**

Em `apps/console/src/app/(private)/proposals/queries.ts`, no `select` da função `getProposal`, adicionar `tenant_id` na lista de colunas selecionadas da `proposals`:

```ts
.select(`
  id,
  tenant_id,
  status,
  product_type_slug,
  ...
`)
```

(Isso é seguro porque a query usa `createClient()` que respeita RLS — o usuário só consegue ler propostas do próprio tenant.)

- [ ] **Step 2: Estender props da `DocumentsTab`**

Em `documents-tab.tsx`, mudar a interface:

```tsx
interface DocumentsTabProps {
  proposal: ProposalDetail
  portalUrl: string
}
```

E na assinatura:
```tsx
export function DocumentsTab({ proposal, portalUrl }: DocumentsTabProps) {
```

- [ ] **Step 3: Renderizar o card quando há pendentes**

Logo após a abertura do JSX `return (`, antes do `{/* Resumo */}`, adicionar:

```tsx
{pendingCount > 0 && (
  <ClientShareCard
    portalUrl={portalUrl}
    pendingCount={pendingCount}
    clientName={proposal.client_name}
    clientPhone={proposal.client_phone}
  />
)}
```

Adicionar o import:
```tsx
import { ClientShareCard } from './client-share-card'
```

- [ ] **Step 4: Passar `portalUrl` em `page.tsx`**

Em `apps/console/src/app/(private)/proposals/[id]/page.tsx`, importar:
```tsx
import { getPortalUrl } from '@/lib/tenant/portal-url'
```

Após o `Promise.all` que carrega proposal + tenantName, calcular o URL:

```tsx
const portalUrl = await getPortalUrl(proposal.tenant_id)
```

E passar para `ProposalTabs`:
```tsx
<ProposalTabs proposal={proposal} portalUrl={portalUrl} />
```

- [ ] **Step 5: Encadear prop `portalUrl` em `ProposalTabs`**

Em `apps/console/src/app/(private)/proposals/[id]/_components/proposal-tabs.tsx`, adicionar `portalUrl: string` na interface de props e repassar:

```tsx
<DocumentsTab proposal={proposal} portalUrl={portalUrl} />
```

- [ ] **Step 6: Typecheck**

```bash
pnpm --filter console typecheck
```

- [ ] **Step 7: Validar visualmente no console**

Abrir uma proposta com docs pendentes. Esperado: card aparece no topo da aba Documentos; link correto; copiar funciona; WhatsApp abre quando há telefone.

- [ ] **Step 8: Commit**

```bash
git add apps/console/src/app/\(private\)/proposals
git commit -m "feat(console): exibe card de link do portal na aba documentos"
```

---

## Task 19 — Documentação da feature

**Files:**
- Create: `docs/features/store/client-document-portal.md`

- [ ] **Step 1: Criar doc**

```markdown
# Portal de documentos do cliente

Portal público da Store onde o cliente final envia documentos pendentes de propostas autenticando-se apenas com CPF.

## Como funciona

1. Cliente acessa `https://<tenant>/meus-documentos`
2. Informa CPF — passamos por rate limit e hash; nunca consultamos por CPF cleartext
3. Recebe cookie JWT (httpOnly, 30 min) scoped à rota
4. Vê suas propostas naquele tenant (filtradas por `client_cpf_hash`)
5. Entra em uma proposta e envia documentos pendentes (PDF/JPG/PNG/WEBP/HEIC, ≤10MB)

## Segurança

- **Hash de CPF** (sha256 com pepper namespace-separado para CPF/IP/UA)
- **Rate limit** 5/15min por IP, 10/h por CPF
- **JWT assinado** (HS256, 30min, cookie httpOnly + secure + sameSite=strict, path `/meus-documentos`)
- **Validação rígida** de arquivos: Zod + sniff de magic bytes via `file-type`; rename para UUID; storage path `{tenant_id}/{proposal_id}/{document_type}/{uuid}.{ext}`
- **Audit log** em `proposal_document_access_log`
- **Mensagens genéricas** — nunca confirmamos se um CPF tem propostas
- **Verificação cross-tenant** — JWT.tenant_id deve bater com `x-tenant-id` em cada request

## Onde tocar

- Migration: `supabase/migrations/20260613120000_client_document_portal.sql`
- Helpers: `apps/store/src/app/(store)/meus-documentos/_lib/`
- Server Actions: `apps/store/src/app/(store)/meus-documentos/actions.ts`
- Páginas: `apps/store/src/app/(store)/meus-documentos/`
- Card no console: `apps/console/src/app/(private)/proposals/[id]/_components/client-share-card.tsx`

## Variáveis de ambiente

- `SUPABASE_CPF_PEPPER` — usado pelo store e por backfill
- `CLIENT_SESSION_SECRET` — assinatura do JWT do cliente
- `STORE_BASE_DOMAIN` — também no console, para montar o link

## Futuro: Passwordless

Substituir validação por CPF apenas por OTP (SMS/email) ou senha. Quando implementarmos:
- Manter rate-limit, audit log, estrutura de sessão e cookie
- Adicionar tabela `clients` (ou usar `auth.users` com role `client`)
- Trocar `validateCpfAction` por `requestOtpAction` + `verifyOtpAction`
- Estender TTL de sessão (24h+ com refresh)
- Manter `client_cpf_hash` como chave entre identidade autenticada e propostas
```

- [ ] **Step 2: Commit**

```bash
git add docs/features/store/client-document-portal.md
git commit -m "docs(store): adiciona documentacao do portal de documentos do cliente"
```

---

## Task 20 — Smoke test manual end-to-end

Nenhum arquivo criado. Roteiro de validação:

- [ ] **Cenário 1: CPF inválido**
  - Acessar `/meus-documentos` em tenant válido
  - Digitar `111.111.111-11` (CPF inválido por dígito)
  - Esperado: toast genérico, sem revelar se existe ou não

- [ ] **Cenário 2: CPF válido sem propostas**
  - Digitar CPF válido sem propostas naquele tenant
  - Esperado: lista vazia com mensagem "Nenhuma proposta encontrada..."

- [ ] **Cenário 3: CPF válido com propostas**
  - CPF de uma proposta de teste existente
  - Esperado: lista carrega; status correto; contador de pendentes correto

- [ ] **Cenário 4: Upload válido**
  - Entrar em uma proposta com pendentes
  - Subir um PDF e um PNG (cada um < 10MB)
  - Esperado: cada um vira "Enviado" sem reload; aparece no console como recebido

- [ ] **Cenário 5: Upload bloqueado**
  - Tentar enviar um `.svg`, `.html`, ou um `.png` adulterado (renomear `.html` para `.png`)
  - Esperado: toast genérico "Arquivo inválido"
  - Tentar enviar arquivo > 10MB
  - Esperado: toast genérico "Máximo 10MB"

- [ ] **Cenário 6: Acesso cross-tenant**
  - Logar em tenant A com CPF X
  - Manualmente alterar o host para tenant B (mesmo cookie)
  - Esperado: redirect para `/meus-documentos` (cookie inválido para B)

- [ ] **Cenário 7: Acesso cross-proposal**
  - Após logar em tenant A com CPF X (que tem proposta P1)
  - Tentar acessar `/meus-documentos/propostas/<id-de-proposta-de-outro-cpf-em-A>`
  - Esperado: `notFound` (404 — sem vazar existência)

- [ ] **Cenário 8: Rate limit**
  - Fazer 6 tentativas rápidas com CPFs diferentes a partir do mesmo IP
  - Esperado: 6ª tentativa bloqueada com mensagem genérica
  - Verificar contador em `client_access_attempts`

- [ ] **Cenário 9: Sessão expirada**
  - Logar; manualmente apagar/expirar o cookie via DevTools
  - Recarregar `/meus-documentos/propostas`
  - Esperado: redirect para `/meus-documentos`

- [ ] **Cenário 10: Card de compartilhamento no console**
  - Abrir proposta com pendentes no console
  - Esperado: card visível com URL correta
  - Copiar link → cola corretamente
  - Clicar "Enviar via WhatsApp" → abre `wa.me` em nova aba com texto preenchido
  - Repetir com proposta sem `client_phone` → botão WhatsApp desabilitado com tooltip

- [ ] **Cenário 11: Audit log**
  - Após cenários 3, 4 e 7, verificar tabela `proposal_document_access_log`:
  ```bash
  psql $SUPABASE_DB_URL -c "select action, count(*) from proposal_document_access_log group by action;"
  ```
  - Esperado: linhas com `viewed_list`, `viewed_proposal`, `uploaded`

- [ ] **Cenário 12: Headers**
  ```bash
  curl -I http://<tenant-slug>.localhost:3002/meus-documentos | grep -iE 'cache-control|x-robots'
  ```
  - Esperado: ambos presentes

---

## Critérios de aceitação finais

- [ ] Build verde nos 3 apps (`pnpm build`)
- [ ] Lint verde (`pnpm lint`)
- [ ] Testes unitários verdes (`pnpm --filter store test`)
- [ ] Migration aplicada em dev e backfill executado
- [ ] Vercel: env vars `SUPABASE_CPF_PEPPER`, `CLIENT_SESSION_SECRET` e `STORE_BASE_DOMAIN` (no projeto console) adicionadas em todos os ambientes (dev/staging/prod)
- [ ] Smoke test manual cobrindo os 12 cenários acima passa em ambiente de staging com tenant de teste
