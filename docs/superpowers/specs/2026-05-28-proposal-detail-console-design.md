# Spec — Tela de Detalhes de Proposta (Console)

**Data:** 2026-05-28
**App:** `apps/console`
**Status:** Aprovado

---

## Contexto

O console já possui a listagem de propostas em `/proposals`. Esta spec define a tela de **detalhes somente leitura** de uma proposta individual, acessível a partir de cada card da lista.

A tela é exclusivamente para o consultor (tenant) acompanhar o andamento de uma proposta que já entrou no processo de contratação. **Simulações não aparecem aqui** — apenas propostas com status `em_analise`, `pre_aprovada`, `necessita_detalhes`, `reprovada` ou `aprovada`.

Não há nenhuma ação de edição, exclusão ou criação nesta tela. É somente leitura.

---

## 1. Modelo de Dados

### 1.1 Novas tabelas (migrations)

#### `proposal_events` — log de transições de status (alimenta a timeline)

```sql
CREATE TABLE proposal_events (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  proposal_id UUID NOT NULL REFERENCES proposals(id) ON DELETE CASCADE,
  tenant_id   UUID NOT NULL REFERENCES tenants(id),
  from_status TEXT,        -- NULL na criação da proposta
  to_status   TEXT NOT NULL,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_proposal_events_proposal ON proposal_events(proposal_id, created_at ASC);

ALTER TABLE proposal_events ENABLE ROW LEVEL SECURITY;

-- Service role: acesso total (Admin e Store gravam eventos)
CREATE POLICY "proposal_events_service_role" ON proposal_events
  FOR ALL TO service_role USING (true) WITH CHECK (true);

-- Tenant: lê apenas eventos das suas próprias propostas
CREATE POLICY "proposal_events_tenant_select" ON proposal_events
  FOR SELECT USING (
    tenant_id = (auth.jwt() ->> 'tenant_id')::uuid
  );

-- Backoffice: lê tudo
CREATE POLICY "proposal_events_backoffice_select" ON proposal_events
  FOR SELECT USING (
    (auth.jwt() ->> 'user_role') = ANY(
      ARRAY['super_admin','admin','financial','support']
    )
  );
```

#### `proposal_comments` — comentários internos do time operacional

```sql
CREATE TABLE proposal_comments (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  proposal_id UUID NOT NULL REFERENCES proposals(id) ON DELETE CASCADE,
  tenant_id   UUID NOT NULL REFERENCES tenants(id),
  author_name TEXT NOT NULL,   -- nome do operador (ex: "Maria Alves")
  body        TEXT NOT NULL,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_proposal_comments_proposal ON proposal_comments(proposal_id, created_at ASC);

ALTER TABLE proposal_comments ENABLE ROW LEVEL SECURITY;

-- Service role: acesso total (Admin cria/edita comentários)
CREATE POLICY "proposal_comments_service_role" ON proposal_comments
  FOR ALL TO service_role USING (true) WITH CHECK (true);

-- Tenant: somente leitura das suas propostas
CREATE POLICY "proposal_comments_tenant_select" ON proposal_comments
  FOR SELECT USING (
    tenant_id = (auth.jwt() ->> 'tenant_id')::uuid
  );

-- Backoffice: lê e escreve via service_role, não via JWT
```

### 1.2 Tabelas existentes utilizadas

| Tabela | Uso |
|---|---|
| `proposals` | Dados base: status, product_type_slug, form_data, client_name, client_phone, created_at |
| `proposal_documents` | Lista de documentos enviados (storage_path, document_type, file_name) |
| `simulations` | Dados financeiros: desired_amount, desired_term_months, estimated_rate, estimated_payment |
| `products` | Nome do produto |
| `tenants` | Nome da loja (origin card) |

### 1.3 Documentos pendentes

A lista de tipos de documentos esperados por `product_type_slug` é definida em código (arquivo `required-documents.ts`) e comparada com os `document_type` presentes em `proposal_documents`. A diferença constitui os documentos **pendentes**.

```typescript
// apps/console/src/app/(private)/proposals/required-documents.ts
export const REQUIRED_DOCUMENTS: Record<string, { type: string; label: string }[]> = {
  auto_equity: [
    { type: 'rg_cnh',            label: 'RG ou CNH (frente e verso)' },
    { type: 'comprovante_estado_civil', label: 'Comprovante de estado civil' },
    { type: 'comprovante_endereco',    label: 'Comprovante de endereço' },
    { type: 'crlv',              label: 'CRLV do veículo' },
    { type: 'foto_traseira',     label: 'Foto traseira do veículo' },
    { type: 'foto_placa',        label: 'Foto da placa traseira' },
    { type: 'foto_chassi',       label: 'Foto do chassi' },
  ],
  fgts: [],  // FGTS não tem etapa 2 de documentos
  consignado_privado: [
    { type: 'rg_cnh',            label: 'RG ou CNH (frente e verso)' },
    { type: 'comprovante_endereco',    label: 'Comprovante de endereço' },
    { type: 'contracheque',      label: 'Contracheque (últimos 3 meses)' },
  ],
  // demais slugs seguem o mesmo padrão conforme specs em docs/features/store/contratar/
}
```

---

## 2. Arquitetura de Componentes

### 2.1 Estrutura de arquivos

```
apps/console/src/app/(private)/proposals/
├── [id]/
│   ├── page.tsx                          ← Server Component — orquestra todos os dados
│   └── _components/
│       ├── proposal-detail-header.tsx    ← Card com avatar, nome, ID, status badge
│       ├── proposal-tabs.tsx             ← Client Component — gerencia aba ativa
│       ├── client-data-tab.tsx           ← Aba "Dados do Cliente" (dados pessoais + operação)
│       ├── documents-tab.tsx             ← Aba "Documentos" (lista + ações)
│       ├── comments-tab.tsx              ← Aba "Comentários" (somente leitura)
│       ├── document-preview-modal.tsx    ← Sheet com PDF/imagem via URL assinada
│       ├── proposal-timeline.tsx         ← Sidebar: timeline vertical
│       └── proposal-origin.tsx           ← Sidebar: card de origem e vendedor
├── [id].tsx                              ← (não criar — já seguimos convenção de pasta)
├── queries.ts                            ← adicionar getProposal(id) aqui
├── page.tsx                              ← (existente — adicionar link para [id])
└── _components/
    └── proposal-card.tsx                 ← (existente — adicionar href para /proposals/[id])
```

Também é necessário criar um Route Handler para gerar URLs assinadas de documentos:

```
apps/console/src/app/api/proposals/[id]/document-url/
└── route.ts    ← GET ?path=... → retorna signed URL via service role
```

### 2.2 Query principal — `getProposal(id)`

Adicionada em `proposals/queries.ts`. Fetch único com joins:

```typescript
export async function getProposal(id: string) {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('proposals')
    .select(`
      id, status, product_type_slug, form_data,
      client_name, client_phone, created_at, updated_at,
      products ( name ),
      simulations (
        desired_amount, desired_term_months,
        estimated_rate, estimated_payment
      ),
      proposal_documents ( id, document_type, file_name, storage_path, created_at ),
      proposal_events    ( id, from_status, to_status, created_at ),
      proposal_comments  ( id, author_name, body, created_at )
    `)
    .eq('id', id)
    .single()

  if (error) throw error
  return data
}

export type ProposalDetail = Awaited<ReturnType<typeof getProposal>>
```

RLS garante que o tenant só consegue buscar propostas próprias. Se `id` não pertencer ao tenant autenticado, o Supabase retorna erro 406 (row not found) — `page.tsx` trata com `notFound()`.

### 2.3 Route Handler — URLs assinadas de documentos

```
GET /api/proposals/[id]/document-url?path=<storage_path>
```

- Usa `createServiceClient()` (nunca expõe `SUPABASE_SERVICE_ROLE_KEY` ao browser)
- Valida que a `proposal_id` pertence ao tenant autenticado antes de gerar a URL
- Retorna `{ url: string }` com TTL de 60 segundos
- Usado pelo `document-preview-modal.tsx` e pelo botão "Baixar"

---

## 3. Layout e UX

### 3.1 Layout geral

A tela vive dentro do layout `(private)/layout.tsx` já existente (sidebar + header). Não cria novo layout.

```
[SidebarProvider > Sidebar > SidebarInset]
  ├── Header (breadcrumb: Propostas / João Silva)
  └── page content (padding: p-8, max-w-screen-xl)
        ├── Eyebrow: "Originação · Pipeline"
        ├── Título: "Proposta."  (padrão da página de listagem)
        ├── ProposalDetailHeader  (Card — 1 coluna, full-width)
        └── grid 2 colunas (1fr 256px)
              ├── ProposalTabs (Card com abas)
              └── sidebar
                    ├── ProposalTimeline (Card)
                    └── ProposalOrigin   (Card)
```

Em mobile (`< md`), o grid colapsa para coluna única — sidebar aparece abaixo das abas.

### 3.2 ProposalDetailHeader

- Avatar com iniciais do cliente (mesma lógica de cor de `proposal-card.tsx`)
- Nome completo + produto + ID monospace + data de criação
- Badge de status (reutiliza `STATUS_CFG` de `status-config.ts`)

### 3.3 Abas

| Aba | Conteúdo | Badge |
|---|---|---|
| Dados do Cliente | Campos pessoais (form_data) + resumo da operação | — |
| Documentos | Lista de docs enviados + pendentes | `N pendente(s)` em amarelo se houver |
| Comentários | Lista de comentários do time operacional | contagem total |

**Dados do Cliente:** exibe campos de `form_data` JSONB mapeados para labels legíveis, organizados em grid de 2 colunas com o componente `field-item` (espelho do `Field` de `components/ui/field.tsx`). Seção "Dados Pessoais" + separador + seção "Operação".

**Documentos:**
- Chips de resumo no topo: "✓ N enviados" e "⏳ N pendente(s)"
- Itens enviados: fundo verde claro, botões "Visualizar" (abre modal) e "Baixar"
- Itens pendentes: fundo amarelo claro, badge "Pendente", sem botões de ação
- Ao clicar em "Visualizar": abre `DocumentPreviewModal` (Sheet lateral) com PDF embutido (`<iframe>`) ou `<img>` para imagens; botão "Baixar" dentro do modal

**Comentários:**
- Aviso de somente leitura no topo: `🔒 Comentários adicionados pelo time operacional via Admin.`
- Lista cronológica: avatar com iniciais do autor, nome, cargo "Operacional · Vello Finance", data/hora, corpo do comentário
- Estado vazio: "Nenhum comentário registrado ainda."

### 3.4 ProposalTimeline (sidebar)

Timeline vertical com 3 estados visuais:

| Estado | Visual |
|---|---|
| Concluído | Dot verde sólido, linha verde tracejada, label normal, data/hora |
| Atual | Dot azul (cor `primary`) com ring, label em `text-primary`, badge "Etapa atual" |
| Próximo | Dot cinza vazio, label em `text-muted-foreground`, sem data |

Passos fixos da timeline (ordem):
1. Proposta criada
2. Documentos enviados *(omitido se produto não tiver etapa 2, ex: FGTS)*
3. Em análise
4. Pré-aprovada *(omitido se reprovada)*
5. Aprovada **ou** Reprovada

A data/hora de cada etapa concluída vem da tabela `proposal_events`. Etapas futuras não têm data.

### 3.5 ProposalOrigin (sidebar)

- Ícone com iniciais do tenant + nome da loja + "Canal: Web · Store"
- Separador
- Seção "Vendedor": placeholder dashed com "Disponível em breve" (campo reservado para feature futura)

---

## 4. Navegação

- Card `proposal-card.tsx` existente: o botão `<Eye>` (ou o card inteiro) passa a ser um `<Link href={/proposals/${proposal.id}}>` (Server Component — sem `onClick`)
- Botão voltar no header: `<Link href="/proposals">← Propostas</Link>` no breadcrumb
- `notFound()` se a proposta não existir ou não pertencer ao tenant autenticado

---

## 5. Tratamento de Erros

| Situação | Comportamento |
|---|---|
| Proposta não encontrada / de outro tenant | `notFound()` → página 404 do console |
| Erro de query | `throw error` → Next.js error boundary |
| Documento sem URL assinada | Botões "Visualizar" e "Baixar" desabilitados com tooltip "Arquivo indisponível" |
| Sem documentos enviados | Exibe apenas os itens pendentes (todos amarelos) |
| Sem comentários | Estado vazio com mensagem neutra |
| Sem eventos de timeline | Exibe apenas o passo "Proposta criada" com `created_at` da tabela `proposals` |

---

## 6. Convenções e Regras

- **Fat Server, Thin Client:** `page.tsx` é Server Component e faz todos os fetches. Apenas `proposal-tabs.tsx` e `document-preview-modal.tsx` são Client Components (`'use client'`)
- **Imports:** sempre alias `@/` — nunca caminhos relativos `../../`
- **Tailwind:** somente classes/tokens padrão — sem valores arbitrários `[...]`
- **Responsive:** grid 2 colunas em `md:grid-cols-[1fr_256px]`, colapsa para 1 coluna em mobile
- **RLS:** todas as queries usam `createClient()` (respeita RLS) — nunca `createServiceClient()` nas queries de página. Service role apenas no Route Handler de URLs assinadas
- **Signed URLs:** TTL de 60s, geradas sob demanda (não pré-geradas na query principal)
- **Commits:** `feat(console): tela de detalhes da proposta`

---

## 7. Fora de Escopo

- Ações de edição, exclusão ou mudança de status (console é somente leitura)
- Campo "Vendedor" (placeholder reservado — feature futura)
- Criação de comentários pelo console (somente Admin cria)
- Notificações em tempo real de novos comentários ou mudança de status (Realtime — feature futura)
- Paginação de comentários e documentos (volume pequeno por proposta)
