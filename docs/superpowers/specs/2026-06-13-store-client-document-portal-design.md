# Store — Portal de documentos do cliente

**Data:** 2026-06-13
**Apps afetados:** `apps/store`, `apps/console`
**Packages afetados:** `packages/proposals-shared` (novo), `packages/env`

## Contexto e problema

Hoje, quando um cliente final cria uma proposta na Store, o consultor (Console) precisa de um canal para coletar documentos pendentes (RG, comprovante de endereço, contracheque, etc.). O fluxo atual exige que o cliente seja levado por dentro da Store logo após criar a proposta — mas se ele sair antes de concluir, não há forma segura de retornar e enviar os documentos depois.

Esta spec descreve um **portal público da Store, autenticado por CPF**, onde o cliente acessa suas propostas naquele tenant e envia os documentos pendentes. O link do portal é exibido na aba Documentos da proposta no Console para que o consultor possa enviá-lo via WhatsApp ou copiar/colar.

## Premissas e não-objetivos

**Premissas:**
- CPF é suficiente como fator único de identificação nesta versão. O CPF do cliente já é coletado em todas as propostas e fica em `proposals.form_data->>'cpf'`.
- Segurança crítica: rate limit, hash do CPF para lookup, sessão curta assinada, validação rígida de arquivos.
- Toda comunicação com banco/storage acontece no servidor (Fat Server, Thin Client).

**Não-objetivos desta spec:**
- Área logada completa do cliente (perfil, histórico, contratos) — fica para spec futura
- Login passwordless (OTP/magic link) — fica para spec futura; ponto de evolução documentado no código
- Download pelo cliente de arquivos já enviados — só visualização "Enviado"
- Notificação por email/WhatsApp automatizada — só o link manual no console
- Suporte ao admin para visualizar logs de acesso — tabela existe mas não há UI ainda

## Arquitetura

### Rotas (loja)

Todas resolvem o tenant pelo header `x-tenant-id` injetado pelo proxy existente.

```
/meus-documentos
├── page.tsx                                    Form CPF (Server Component)
├── actions.ts                                  Server Actions
├── _lib/                                       Helpers privados da rota
└── /propostas
    ├── page.tsx                                Lista propostas do CPF (Server Component)
    └── /[proposalId]
        └── page.tsx                            Upload por documento pendente (Server Component)
```

### Server Actions

- `validateCpfAction(formData)` — rate-limit → valida CPF → hashea → busca propostas do CPF naquele tenant → assina JWT → seta cookie → `redirect('/meus-documentos/propostas')`. Resposta de erro sempre genérica.
- `logoutClientAction()` — apaga cookie → `redirect('/meus-documentos')`
- `uploadDocumentAction(proposalId, documentType, file)` — verifica JWT → valida arquivo (Zod + magic bytes) → upload bucket → insert `proposal_documents` → log audit → `revalidatePath`

### Console (mínima alteração)

- Novo componente `_components/client-share-card.tsx` em `apps/console/src/app/(private)/proposals/[id]/_components/`
- Renderizado no topo da aba Documentos (`documents-tab.tsx`) quando `pendingCount > 0`
- Exibe link `https://{tenant-host}/meus-documentos`, botão "Copiar link" e botão "Enviar via WhatsApp" (`wa.me/{phone}?text=...`)
- Quando `client_phone` ausente, "Enviar via WhatsApp" fica desabilitado com tooltip explicativo

### Pacote compartilhado

`packages/proposals-shared/` (novo) recebe:
- `required-documents.ts` (movido de `apps/console/src/app/(private)/proposals/`)
- `status-config.ts` (movido — apenas a parte sem JSX; cores e ícones específicos do console permanecem lá)

Tanto Console quanto Store importam de `@vello/proposals-shared`.

## Modelo de dados

### Migration única

Arquivo: `supabase/migrations/20260613120000_client_document_portal.sql`

**1. Coluna `client_cpf_hash` em `proposals`**

```sql
ALTER TABLE proposals
  ADD COLUMN client_cpf_hash TEXT;

CREATE INDEX idx_proposals_tenant_cpf_hash
  ON proposals(tenant_id, client_cpf_hash)
  WHERE client_cpf_hash IS NOT NULL;
```

- `client_cpf_hash` = `sha256(cpf_digits + SUPABASE_CPF_PEPPER)`, hex
- Pepper vive em env server-only; não é reversível
- O CPF cleartext permanece em `form_data` (necessário para emissão de contrato)
- Hash é populado no servidor a cada novo insert (Server Action de criação de proposta)

**2. Tabela `client_access_attempts` (rate limit)**

```sql
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
```

- `ip_hash` = `sha256(ip + SUPABASE_CPF_PEPPER)` (reaproveita o mesmo pepper)
- Limpeza manual ou via cron futuro (fora do escopo)

**3. Tabela `proposal_document_access_log` (auditoria)**

```sql
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

### Backfill — `scripts/backfill-cpf-hash.ts`

Script Node idempotente executado uma vez após o deploy da migration:

- Lê `SUPABASE_CPF_PEPPER` do env
- Itera `proposals WHERE client_cpf_hash IS NULL`
- Extrai `form_data->>'cpf'`, sanitiza (digits-only), valida (`validateCPF`)
- Calcula hash e atualiza linha
- Pula propostas sem CPF válido (não erra)
- Loga sumário no final: total processadas, atualizadas, puladas

### RLS — políticas existentes

- `proposals`, `proposal_documents` e bucket `proposal-documents`: **sem alteração**
- O portal do cliente usa exclusivamente `service_role` no servidor com checagens explícitas em código. Coerente com a arquitetura "Fat Server, Thin Client" do projeto.

### Regeneração de types

Após `supabase db push`, rodar `pnpm db:types` para atualizar `packages/database/src/types.ts`.

## Segurança

### Hash do CPF

```ts
// _lib/cpf-hash.ts
import { createHash } from 'crypto'

export function hashCpf(cpf: string): string {
  const digits = cpf.replace(/\D/g, '')
  const pepper = process.env.SUPABASE_CPF_PEPPER
  if (!pepper) throw new Error('SUPABASE_CPF_PEPPER missing')
  return createHash('sha256').update(digits + pepper).digest('hex')
}
```

Mesma função para `hashIp(ip)` e `hashUserAgent(ua)` — receberá o ip/ua + pepper.

### Rate limit

```ts
// _lib/rate-limit.ts
// Limites:
//   - 5 tentativas por IP nos últimos 15 minutos
//   - 10 tentativas por CPF na última 1 hora
// Bloqueio: erro genérico "Muitas tentativas, tente novamente em alguns minutos"
```

Após `validateCpfAction`, sempre inserir uma linha em `client_access_attempts` (sucesso ou falha) para alimentar o contador.

### Sessão (JWT em cookie)

```ts
// _lib/session.ts
const token = await sign(
  {
    cpf_hash,
    tenant_id,
    iat: now,
    exp: now + 30 * 60,
    jti: randomUUID(),
  },
  process.env.CLIENT_SESSION_SECRET,
  { algorithm: 'HS256' }
)

cookies().set('vello_client_session', token, {
  httpOnly: true,
  secure: true,
  sameSite: 'strict',
  path: '/meus-documentos',
  maxAge: 60 * 30,
})
```

- A cada Server Action e Server Component sob `/meus-documentos`, função `requireClientSession()` verifica:
  - Assinatura válida
  - `exp` não expirado
  - `tenant_id` do token **igual** ao header `x-tenant-id` (impede roubo cross-tenant)
- Se falhar: `redirect('/meus-documentos')`
- Em `/[proposalId]`: além disso, verifica `proposal.client_cpf_hash === jwt.cpf_hash` AND `proposal.tenant_id === jwt.tenant_id`. Se não bater, `notFound()` (não vaza existência).

### Validação de arquivos

```ts
// _lib/file-validation.ts
const ALLOWED_MIME = [
  'application/pdf',
  'image/jpeg',
  'image/png',
  'image/webp',
  'image/heic',
]
const ALLOWED_EXT_MAP: Record<string, string> = {
  'application/pdf': 'pdf',
  'image/jpeg': 'jpg',
  'image/png': 'png',
  'image/webp': 'webp',
  'image/heic': 'heic',
}
const MAX_SIZE = 10 * 1024 * 1024 // 10MB

const fileSchema = z.instanceof(File)
  .refine(f => f.size > 0, 'Arquivo vazio')
  .refine(f => f.size <= MAX_SIZE, 'Máximo 10MB')
  .refine(f => ALLOWED_MIME.includes(f.type), 'Tipo não permitido')

// no servidor:
const buf = Buffer.from(await file.arrayBuffer())
const detected = await fileTypeFromBuffer(buf) // lib `file-type`
if (!detected || !ALLOWED_MIME.includes(detected.mime)) {
  throw new Error('Arquivo inválido')
}
const ext = ALLOWED_EXT_MAP[detected.mime]
const storagePath = `${tenantId}/${proposalId}/${documentType}/${randomUUID()}.${ext}`
```

- Cliente nunca define nome ou caminho final
- Nome original do cliente é descartado
- Tipos permitidos: PDF, JPG, PNG, WEBP, HEIC
- Sem SVG, sem ZIP, sem doc/docx, sem HTML
- Validação MIME + extensão + magic bytes (todas precisam concordar)
- `UNIQUE (proposal_id, document_type)` no schema já impede duplicatas — upload substitui via `upsert`

### Auditoria

A cada acesso bem-sucedido, `logAccess(action, ...)` insere em `proposal_document_access_log`:
- `viewed_list` — após validar CPF e listar propostas
- `viewed_proposal` — quando entra em `/[proposalId]`
- `uploaded` — sucesso de upload (inclui `document_type`)
- `downloaded` — fora do escopo desta versão (apenas reservado no enum)

### Headers de segurança específicos da rota

Aplicar em `middleware.ts` ou via metadata, para `/meus-documentos/*`:

```
Cache-Control: no-store
X-Robots-Tag: noindex, nofollow
```

CSP existente da Store é mantida (já restritiva).

### Variáveis de ambiente (novas)

Adicionar em `packages/env/src/shared.ts`:

- `SUPABASE_CPF_PEPPER` — string aleatória ≥ 32 chars, usada para hashear CPF, IP e User-Agent
- `CLIENT_SESSION_SECRET` — string aleatória ≥ 32 chars, usada para assinar JWT da sessão do cliente

Documentar em `.env.example`. Adicionar nos projetos Vercel da store e do console.

### TODO documentado para futuro

Em comentário no topo de `_lib/session.ts` e em `docs/features/store/client-document-portal.md`:

> **Futuro: Passwordless** — substituir a validação por CPF apenas por OTP via SMS/email (link mágico) ou senha. Quando implementarmos, manter rate-limit, audit log e estrutura de sessão; trocar apenas o "fator". A coluna `client_cpf_hash` continua útil como chave de associação entre identidade autenticada e propostas existentes.

## UX e componentes

### Tela 1 — `/meus-documentos` (form CPF)

Reaproveita `StoreLayout` (header com logo + footer do tenant — branding automático via CSS vars).

- Heading: `Documentos.` (estilo minimalista, mesma família visual da `Proposta.`)
- Subtítulo: "Informe seu CPF para visualizar suas propostas e enviar documentos pendentes."
- shadcn `Input` com máscara CPF (`cpf-form.tsx` — client component)
- shadcn `Button` primário "Continuar"
- Texto pequeno: "Suas informações são protegidas."
- Em erro de rate-limit ou CPF inválido: toast genérico "Não foi possível validar. Tente novamente em alguns minutos."

### Tela 2 — `/meus-documentos/propostas` (lista)

- Mesmo header + botão "Sair" (chama `logoutClientAction`)
- Heading: `Suas propostas.`
- Lista de `<ProposalCard>` por proposta:
  - Nome do produto + código `PROP-XXXX`
  - Badge de status (vem de `@vello/proposals-shared/status-config`)
  - Contador: `3 documentos pendentes` ou `Tudo enviado`
  - CTA "Enviar documentos" → `/[proposalId]`
- Estado vazio: "Nenhuma proposta encontrada para este CPF nesta loja." + botão "Ir para simulador"

### Tela 3 — `/meus-documentos/propostas/[proposalId]` (upload)

- Header igual + breadcrumb "Propostas → PROP-XXXX"
- Heading: `Documentos.`
- Badge de status atual da proposta
- Lista de pendentes com `<DocumentUploader>` por documento:
  - Ícone + label (de `@vello/proposals-shared/required-documents`)
  - Estado: `Pendente` / `Enviando…` / `Enviado`
  - Área de drag-drop + botão "Selecionar arquivo"
  - Após sucesso: marca `Enviado` + filename truncado (vindo do registro, sanitizado)
- Seção "Já enviados" abaixo dos pendentes — só leitura, sem download nesta versão
- Quando todos pendentes preenchidos: banner verde "Tudo certo! Aguarde a análise."

### Tematização

- `StoreLayout` injeta branding via `getTenantBranding(tenantId)` (já implementado)
- `generate-theme.ts` gera CSS vars (`--primary`, `--accent`, etc.); componentes shadcn herdam automaticamente
- Proibido valores arbitrários no Tailwind — somente tokens (`bg-primary`, `text-foreground`, `border-border`)
- Layout mobile-first, breakpoints Tailwind padrão; cliente acessa majoritariamente via celular
- Mobile: cards full-width, 1 coluna. `md:` (≥768px): max-width 640px centralizado

### Console — `client-share-card.tsx`

Renderizado no topo de `documents-tab.tsx` quando `pendingCount > 0`:

```
┌───────────────────────────────────────────────────────────────┐
│  📤  Enviar link ao cliente                                    │
│                                                                │
│  O cliente acessa esta página com o CPF dele e envia          │
│  os {pendingCount} documentos pendentes diretamente.          │
│                                                                │
│  https://{tenant-host}/meus-documentos                        │
│                                                                │
│  [ Copiar link ]    [ 📱 Enviar via WhatsApp ]                │
└───────────────────────────────────────────────────────────────┘
```

- Props: `portalUrl: string`, `pendingCount: number`, `clientPhone: string | null`, `clientName: string | null`
- "Copiar link" usa `navigator.clipboard.writeText` + toast "Link copiado"
- "Enviar via WhatsApp" abre `https://wa.me/{phone}?text={mensagem}` em nova aba:
  > "Olá {clientName}! Você tem documentos pendentes em sua proposta. Acesse: {portalUrl}"
- `clientPhone` ausente → botão desabilitado com tooltip "Telefone do cliente não cadastrado"
- A `portalUrl` é construída no Server Component pai via `getTenantPrimaryHost(tenantId)` → fallback `${slug}.vellofinance.com.br`

## Fluxo de dados (resumo)

```
Cliente entra em https://{tenant}/meus-documentos
  → digita CPF, submit
  → Server Action: rate-limit → valida CPF → hash → busca proposals(tenant_id, cpf_hash)
    → grava attempt (success=true)
    → assina JWT, seta cookie
    → redirect /propostas

Cliente vê lista (Server Component)
  → requireClientSession() decodifica cookie
  → busca proposals(tenant_id, cpf_hash) + contador pendente por proposta
  → logAccess('viewed_list')
  → renderiza

Cliente entra em /[proposalId]
  → requireClientSession() + checa tenant_id e cpf_hash batem com proposal
  → busca proposta + documentos enviados + lista de required
  → logAccess('viewed_proposal')
  → renderiza form de upload

Cliente envia arquivo
  → Server Action: requireClientSession() + valida ownership
  → Zod schema valida tipo/tamanho
  → file-type lib valida magic bytes
  → rename para UUID, path = {tenant_id}/{proposal_id}/{document_type}/{uuid}.{ext}
  → upload bucket via service role
  → upsert proposal_documents (UNIQUE proposal_id, document_type)
  → logAccess('uploaded', document_type)
  → revalidatePath
```

## Checklist de implementação

1. Criar `packages/proposals-shared/` movendo `required-documents.ts` e `status-config.ts` (parte sem JSX). Atualizar imports do console.
2. Adicionar `SUPABASE_CPF_PEPPER` e `CLIENT_SESSION_SECRET` em `packages/env/src/shared.ts` + `.env.example`.
3. Migration `20260613120000_client_document_portal.sql`: coluna + 2 tabelas + policies.
4. Script `scripts/backfill-cpf-hash.ts` + executar uma vez contra ambiente de staging primeiro, depois prod.
5. Regenerar types: `pnpm db:types`.
6. Hook: na Server Action de criação de proposta na store, preencher `client_cpf_hash` no insert (já temos o CPF na hora da criação).
7. Helpers `_lib/`: `cpf-hash.ts`, `session.ts`, `rate-limit.ts`, `file-validation.ts`, `audit.ts`.
8. Server Actions em `apps/store/src/app/(store)/meus-documentos/actions.ts`.
9. Rota `/meus-documentos` (form CPF) + `cpf-form.tsx`.
10. Rota `/meus-documentos/propostas` (lista) + `proposal-card.tsx`.
11. Rota `/meus-documentos/propostas/[proposalId]` (upload) + `document-uploader.tsx`.
12. Headers de segurança via middleware ou metadata para `/meus-documentos/*`.
13. `getTenantPrimaryHost(tenantId)` no console (reaproveitar lógica de `resolve-tenant` ou tabela `tenant_domains`).
14. Componente `client-share-card.tsx` no console + integração na `documents-tab.tsx`.
15. Doc em `docs/features/store/client-document-portal.md` com nota "Futuro: Passwordless".
16. Smoke test manual end-to-end com tenant de teste:
    - CPF inválido → erro genérico
    - CPF válido sem propostas → mensagem vazia
    - CPF válido com propostas → lista correta
    - Upload de cada tipo aceito → sucesso
    - Upload de tipo não aceito (svg, html) → bloqueado
    - Upload > 10MB → bloqueado
    - Tentar acessar `/[proposalId]` de outra proposta com cookie diferente → notFound
    - Rate-limit: 6ª tentativa em 15min → bloqueio genérico
    - Cookie expirado → redirect para form de CPF
    - Trocar tenant (host) com mesmo cookie → invalidado

## Critérios de aceitação

- Cliente acessa o portal pelo link do tenant, valida CPF e vê só propostas suas naquele tenant.
- Cliente envia documentos pendentes que aparecem imediatamente no console como "Enviado".
- Console exibe card com link + WhatsApp quando há pendentes; some quando não há.
- Nenhum CPF cleartext indexado no banco; nenhum upload com extensão/MIME falsificado passa; nenhum acesso cross-tenant possível.
- Sessão expira em 30min; rate-limit funciona; audit log registra ações.
- UI tematizada com branding do tenant; responsiva mobile-first; sem valores arbitrários no Tailwind.
- Build verde nos 3 apps; types regenerados.

## Riscos e mitigações

| Risco | Mitigação |
|---|---|
| CPF de cliente legítimo sendo alvo de brute-force | Rate limit por IP **e** por CPF; mensagens genéricas; futura migração para OTP |
| Cookie roubado e usado em outro tenant | Verificação `jwt.tenant_id === header.tenant_id` em todo handler |
| Upload de arquivo malicioso (HTML/SVG/script) | Lista branca de MIME + magic bytes; rename para UUID; sem download via URL pública |
| Pepper vazado | Token de longa rotação, mantido em Vercel encrypted env; rotação invalida hashes — manter como segredo de alta sensibilidade |
| Backfill não cobre propostas antigas sem CPF | Backfill é idempotente; propostas sem CPF simplesmente não retornam no portal — usuário pode atualizar a proposta no console e o hash é populado dali em diante |
| Tabela `client_access_attempts` cresce indefinidamente | Cleanup manual ou cron futuro fora deste escopo; tamanho é baixo por design |

## Referências

- `docs/architecture/fat-server-thin-client.md`
- `docs/architecture/conventions.md`
- `docs/architecture/store-templates.md`
- `apps/console/src/app/(private)/proposals/required-documents.ts`
- `apps/console/src/app/(private)/proposals/[id]/_components/documents-tab.tsx`
- `apps/store/src/lib/utils/cpf.ts`
- `supabase/migrations/20260517000000_create_proposals_tables.sql`
