# Proposal Detail Console — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use `superpowers:subagent-driven-development` (recommended) or `superpowers:executing-plans` to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Criar a tela de detalhes somente leitura de uma proposta no console (`/proposals/[id]`), com abas de dados do cliente, documentos e comentários, sidebar com timeline vertical e card de origem.

**Architecture:** Server Component central (`page.tsx`) faz um único fetch com todos os joins. Apenas dois Client Components (`proposal-tabs.tsx` para gerenciar aba ativa, `document-preview-modal.tsx` para o Sheet). Documentos são visualizados via URL assinada gerada por Route Handler (service role). Duas novas tabelas no Supabase: `proposal_events` (timeline) e `proposal_comments` (leitura apenas no console).

**Tech Stack:** Next.js 16 App Router, TypeScript, shadcn/ui (Card, Badge, Button, Sheet, Separator, Tabs, Avatar, Tooltip), Tailwind CSS, Supabase (PostgreSQL + RLS + Storage), date-fns, lucide-react.

---

## Mapa de arquivos

| Ação | Arquivo |
|---|---|
| **Criar** | `supabase/migrations/20260528120000_create_proposal_events_comments.sql` |
| **Criar** | `apps/console/src/app/(private)/proposals/required-documents.ts` |
| **Modificar** | `apps/console/src/app/(private)/proposals/queries.ts` |
| **Criar** | `apps/console/src/app/api/proposals/[id]/document-url/route.ts` |
| **Criar** | `apps/console/src/app/(private)/proposals/[id]/page.tsx` |
| **Criar** | `apps/console/src/app/(private)/proposals/[id]/_components/proposal-detail-header.tsx` |
| **Criar** | `apps/console/src/app/(private)/proposals/[id]/_components/proposal-tabs.tsx` |
| **Criar** | `apps/console/src/app/(private)/proposals/[id]/_components/client-data-tab.tsx` |
| **Criar** | `apps/console/src/app/(private)/proposals/[id]/_components/document-preview-modal.tsx` |
| **Criar** | `apps/console/src/app/(private)/proposals/[id]/_components/documents-tab.tsx` |
| **Criar** | `apps/console/src/app/(private)/proposals/[id]/_components/comments-tab.tsx` |
| **Criar** | `apps/console/src/app/(private)/proposals/[id]/_components/proposal-timeline.tsx` |
| **Criar** | `apps/console/src/app/(private)/proposals/[id]/_components/proposal-origin.tsx` |
| **Modificar** | `apps/console/src/app/(private)/proposals/_components/proposal-card.tsx` |

---

## Task 1: Migrations — `proposal_events` e `proposal_comments`

**Files:**
- Create: `supabase/migrations/20260528120000_create_proposal_events_comments.sql`

- [ ] **Step 1: Criar o arquivo de migration**

```sql
-- supabase/migrations/20260528120000_create_proposal_events_comments.sql

-- ============================================================
-- proposal_events — log append-only de transições de status
-- ============================================================
CREATE TABLE proposal_events (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  proposal_id UUID NOT NULL REFERENCES proposals(id) ON DELETE CASCADE,
  tenant_id   UUID NOT NULL REFERENCES tenants(id),
  from_status TEXT,
  to_status   TEXT NOT NULL,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_proposal_events_proposal
  ON proposal_events(proposal_id, created_at ASC);

ALTER TABLE proposal_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "proposal_events_service_role" ON proposal_events
  FOR ALL TO service_role USING (true) WITH CHECK (true);

CREATE POLICY "proposal_events_tenant_select" ON proposal_events
  FOR SELECT USING (
    tenant_id = (auth.jwt() ->> 'tenant_id')::uuid
  );

CREATE POLICY "proposal_events_backoffice_select" ON proposal_events
  FOR SELECT USING (
    (auth.jwt() ->> 'user_role') = ANY(
      ARRAY['super_admin','admin','financial','support']
    )
  );

-- ============================================================
-- proposal_comments — comentários do time operacional
-- ============================================================
CREATE TABLE proposal_comments (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  proposal_id UUID NOT NULL REFERENCES proposals(id) ON DELETE CASCADE,
  tenant_id   UUID NOT NULL REFERENCES tenants(id),
  author_name TEXT NOT NULL,
  body        TEXT NOT NULL,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_proposal_comments_proposal
  ON proposal_comments(proposal_id, created_at ASC);

ALTER TABLE proposal_comments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "proposal_comments_service_role" ON proposal_comments
  FOR ALL TO service_role USING (true) WITH CHECK (true);

CREATE POLICY "proposal_comments_tenant_select" ON proposal_comments
  FOR SELECT USING (
    tenant_id = (auth.jwt() ->> 'tenant_id')::uuid
  );

-- ============================================================
-- Seed: backfill proposal_events para propostas existentes
-- Cria um evento "proposta_criada" para cada proposta que
-- ainda não tem nenhum evento registrado.
-- ============================================================
INSERT INTO proposal_events (proposal_id, tenant_id, from_status, to_status, created_at)
SELECT
  p.id,
  p.tenant_id,
  NULL,
  'nova_proposta',
  p.created_at
FROM proposals p
WHERE NOT EXISTS (
  SELECT 1 FROM proposal_events e WHERE e.proposal_id = p.id
);

-- Seed: backfill evento "em_analise" para propostas que já estão nesse status
INSERT INTO proposal_events (proposal_id, tenant_id, from_status, to_status, created_at)
SELECT
  p.id,
  p.tenant_id,
  'nova_proposta',
  p.status,
  p.updated_at
FROM proposals p
WHERE p.status IN ('em_analise','pre_aprovada','necessita_detalhes','reprovada','aprovada')
  AND NOT EXISTS (
    SELECT 1 FROM proposal_events e
    WHERE e.proposal_id = p.id AND e.to_status = p.status
  );

-- Seed: comentários de teste para validação visual (remover em produção)
DO $$
DECLARE
  v_proposal_id UUID;
  v_tenant_id   UUID;
BEGIN
  SELECT p.id, p.tenant_id INTO v_proposal_id, v_tenant_id
  FROM proposals p
  WHERE p.status = 'em_analise'
  LIMIT 1;

  IF v_proposal_id IS NOT NULL THEN
    INSERT INTO proposal_comments (proposal_id, tenant_id, author_name, body, created_at)
    VALUES
      (v_proposal_id, v_tenant_id, 'Maria Alves',
       'Proposta recebida. Aguardando envio do CRLV pelo cliente.',
       now() - interval '2 days'),
      (v_proposal_id, v_tenant_id, 'Carlos Ramos',
       'Análise de crédito iniciada. Aguardando retorno da IF parceira.',
       now() - interval '1 day');
  END IF;
END $$;
```

- [ ] **Step 2: Aplicar a migration**

```bash
cd /path/to/vello-finance
pnpm supabase db push
```

Esperado: sem erros. As tabelas `proposal_events` e `proposal_comments` devem existir no banco.

- [ ] **Step 3: Regenerar os types do Supabase**

```bash
pnpm db:types
```

Esperado: `packages/database/src/types.ts` atualizado com `proposal_events` e `proposal_comments`.

- [ ] **Step 4: Verificar TypeScript**

```bash
cd apps/console && pnpm tsc --noEmit
```

Esperado: sem erros.

- [ ] **Step 5: Commit**

```bash
git add supabase/migrations/20260528120000_create_proposal_events_comments.sql packages/database/src/types.ts
git commit -m "feat(console): migrations proposal_events e proposal_comments"
```

---

## Task 2: `required-documents.ts` — mapa de documentos esperados por produto

**Files:**
- Create: `apps/console/src/app/(private)/proposals/required-documents.ts`

- [ ] **Step 1: Criar o arquivo**

```typescript
// apps/console/src/app/(private)/proposals/required-documents.ts

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

- [ ] **Step 2: Verificar TypeScript**

```bash
cd apps/console && pnpm tsc --noEmit
```

Esperado: sem erros.

- [ ] **Step 3: Commit**

```bash
git add apps/console/src/app/\(private\)/proposals/required-documents.ts
git commit -m "feat(console): mapa de documentos requeridos por produto"
```

---

## Task 3: `getProposal` query — adicionar em `queries.ts`

**Files:**
- Modify: `apps/console/src/app/(private)/proposals/queries.ts`

- [ ] **Step 1: Adicionar `getProposal` e `ProposalDetail` ao final do arquivo existente**

Abrir `apps/console/src/app/(private)/proposals/queries.ts` e **adicionar** ao final (não alterar o `listProposals` existente):

```typescript
export async function getProposal(id: string) {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('proposals')
    .select(`
      id,
      status,
      product_type_slug,
      form_data,
      client_name,
      client_phone,
      created_at,
      updated_at,
      products ( name ),
      simulations (
        desired_amount,
        desired_term_months,
        estimated_rate,
        estimated_payment
      ),
      proposal_documents (
        id,
        document_type,
        file_name,
        storage_path,
        created_at
      ),
      proposal_events (
        id,
        from_status,
        to_status,
        created_at
      ),
      proposal_comments (
        id,
        author_name,
        body,
        created_at
      )
    `)
    .eq('id', id)
    .order('created_at', { referencedTable: 'proposal_events', ascending: true })
    .order('created_at', { referencedTable: 'proposal_comments', ascending: true })
    .single()

  if (error) throw error
  return data
}

export type ProposalDetail = Awaited<ReturnType<typeof getProposal>>
```

- [ ] **Step 2: Verificar TypeScript**

```bash
cd apps/console && pnpm tsc --noEmit
```

Esperado: sem erros.

- [ ] **Step 3: Commit**

```bash
git add apps/console/src/app/\(private\)/proposals/queries.ts
git commit -m "feat(console): query getProposal com joins de events, comments e documents"
```

---

## Task 4: Route Handler — URL assinada de documentos

**Files:**
- Create: `apps/console/src/app/api/proposals/[id]/document-url/route.ts`

- [ ] **Step 1: Criar o diretório e o arquivo**

```typescript
// apps/console/src/app/api/proposals/[id]/document-url/route.ts
import { type NextRequest, NextResponse } from 'next/server'

import { createClient } from '@/lib/supabase/server'
import { createServiceClient } from '@/lib/supabase/service'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id: proposalId } = await params
  const storagePath = request.nextUrl.searchParams.get('path')

  if (!storagePath) {
    return NextResponse.json({ error: 'path obrigatório' }, { status: 400 })
  }

  // Verificar que a proposta pertence ao tenant autenticado (respeita RLS)
  const supabase = await createClient()
  const { data: proposal, error: proposalError } = await supabase
    .from('proposals')
    .select('id')
    .eq('id', proposalId)
    .single()

  if (proposalError || !proposal) {
    return NextResponse.json({ error: 'Proposta não encontrada' }, { status: 404 })
  }

  // Gerar URL assinada via service role (acesso ao bucket privado)
  const service = createServiceClient()
  const { data, error } = await service.storage
    .from('proposal-documents')
    .createSignedUrl(storagePath, 60) // TTL: 60 segundos

  if (error || !data?.signedUrl) {
    return NextResponse.json({ error: 'Arquivo indisponível' }, { status: 500 })
  }

  return NextResponse.json({ url: data.signedUrl })
}
```

- [ ] **Step 2: Verificar TypeScript**

```bash
cd apps/console && pnpm tsc --noEmit
```

Esperado: sem erros.

- [ ] **Step 3: Commit**

```bash
git add apps/console/src/app/api/proposals/
git commit -m "feat(console): route handler para signed URL de documentos"
```

---

## Task 5: `proposal-detail-header.tsx`

**Files:**
- Create: `apps/console/src/app/(private)/proposals/[id]/_components/proposal-detail-header.tsx`

- [ ] **Step 1: Criar o componente**

```typescript
// apps/console/src/app/(private)/proposals/[id]/_components/proposal-detail-header.tsx
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'

import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import { cn } from '@/lib/utils'
import { STATUS_CFG } from '../../status-config'
import type { ProposalDetail } from '../../queries'

function getInitials(name: string): string {
  const parts = name.trim().split(' ').filter(Boolean)
  if (parts.length >= 2) return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase()
  return name.slice(0, 2).toUpperCase()
}

function avatarColor(name: string): string {
  const palettes = [
    'bg-chart-1/20 text-chart-1',
    'bg-chart-2/20 text-chart-2',
    'bg-chart-3/20 text-chart-3',
    'bg-chart-4/20 text-chart-4',
    'bg-chart-5/20 text-chart-5',
  ]
  let h = 0
  for (const c of name) h = ((h << 5) - h + c.charCodeAt(0)) | 0
  return palettes[Math.abs(h) % palettes.length]
}

interface ProposalDetailHeaderProps {
  proposal: ProposalDetail
}

export function ProposalDetailHeader({ proposal }: ProposalDetailHeaderProps) {
  const product = Array.isArray(proposal.products) ? proposal.products[0] : proposal.products
  const clientName = proposal.client_name ?? 'Cliente'
  const initials = getInitials(clientName)
  const avColor = avatarColor(clientName)
  const shortId = `PROP-${proposal.id.replace(/-/g, '').slice(0, 5).toUpperCase()}`
  const createdAt = format(new Date(proposal.created_at), "d 'de' MMMM 'de' yyyy", { locale: ptBR })
  const statusCfg = STATUS_CFG[proposal.status]

  return (
    <Card className="mb-4">
      <CardContent className="flex flex-wrap items-center justify-between gap-4 py-4">
        <div className="flex items-center gap-3">
          <Avatar className="size-11 rounded-xl">
            <AvatarFallback className={cn('rounded-xl text-sm font-bold', avColor)}>
              {initials}
            </AvatarFallback>
          </Avatar>
          <div>
            <p className="text-lg font-semibold leading-tight">{clientName}</p>
            <div className="mt-1 flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
              {product?.name && <span>{product.name}</span>}
              {product?.name && <span className="text-border">·</span>}
              <span className="font-mono bg-muted px-1.5 py-0.5 rounded text-[10px]">
                {shortId}
              </span>
              <span className="text-border">·</span>
              <span>Criada em {createdAt}</span>
            </div>
          </div>
        </div>

        {statusCfg && (
          <Badge variant={statusCfg.variant} className={statusCfg.className}>
            {statusCfg.label}
          </Badge>
        )}
      </CardContent>
    </Card>
  )
}
```

- [ ] **Step 2: Verificar TypeScript**

```bash
cd apps/console && pnpm tsc --noEmit
```

Esperado: sem erros.

- [ ] **Step 3: Commit**

```bash
git add apps/console/src/app/\(private\)/proposals/\[id\]/
git commit -m "feat(console): ProposalDetailHeader"
```

---

## Task 6: `client-data-tab.tsx`

**Files:**
- Create: `apps/console/src/app/(private)/proposals/[id]/_components/client-data-tab.tsx`

- [ ] **Step 1: Criar o componente**

```typescript
// apps/console/src/app/(private)/proposals/[id]/_components/client-data-tab.tsx
import { Separator } from '@/components/ui/separator'
import { cn } from '@/lib/utils'
import type { ProposalDetail } from '../../queries'

function brlFull(value: number): string {
  return value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
}

function formatLabel(key: string): string {
  const LABELS: Record<string, string> = {
    nome_completo:        'Nome completo',
    cpf:                  'CPF',
    rg:                   'RG',
    data_nascimento:      'Data de nascimento',
    email:                'E-mail',
    whatsapp:             'WhatsApp',
    nome_mae:             'Nome da mãe',
    tipo_ocupacao:        'Tipo de ocupação',
    renda_mensal:         'Renda mensal',
    tempo_ocupacao:       'Tempo na ocupação',
    tipo_veiculo:         'Tipo de veículo',
    placa:                'Placa',
    ano_fabricacao:       'Ano de fabricação',
    motivo_credito:       'Motivo do crédito',
    banco:                'Banco',
    agencia:              'Agência',
    conta:                'Conta-corrente',
    pix:                  'Chave PIX',
    financiado:           'Veículo financiado?',
  }
  return LABELS[key] ?? key.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase())
}

interface FieldItemProps {
  label: string
  value: string
  full?: boolean
}

function FieldItem({ label, value, full }: FieldItemProps) {
  return (
    <div className={cn(
      'rounded-md border border-border/60 bg-muted/50 px-3 py-2',
      full && 'col-span-2',
    )}>
      <p className="mb-0.5 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
        {label}
      </p>
      <p className="text-sm font-medium">{value || '—'}</p>
    </div>
  )
}

interface ClientDataTabProps {
  proposal: ProposalDetail
}

export function ClientDataTab({ proposal }: ClientDataTabProps) {
  const simulation = Array.isArray(proposal.simulations)
    ? proposal.simulations[0]
    : proposal.simulations

  const formData = (proposal.form_data ?? {}) as Record<string, unknown>

  const personalKeys = ['nome_completo','cpf','rg','data_nascimento','email','whatsapp','nome_mae']
  const personalEntries = personalKeys
    .filter((k) => formData[k] != null)
    .map((k) => ({ key: k, label: formatLabel(k), value: String(formData[k]) }))

  // Demais campos de form_data que não são pessoais nem bancários
  const excludedKeys = new Set([
    ...personalKeys,
    'banco','agencia','conta','pix','confirmacao_titularidade',
  ])
  const operationEntries = Object.entries(formData)
    .filter(([k]) => !excludedKeys.has(k))
    .map(([k, v]) => ({ key: k, label: formatLabel(k), value: String(v ?? '') }))

  return (
    <div className="space-y-5">
      {/* Dados pessoais */}
      {personalEntries.length > 0 && (
        <section>
          <p className="mb-3 text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
            Dados Pessoais
          </p>
          <div className="grid grid-cols-2 gap-2">
            {personalEntries.map(({ key, label, value }) => (
              <FieldItem
                key={key}
                label={label}
                value={value}
                full={key === 'email' || key === 'nome_completo'}
              />
            ))}
          </div>
        </section>
      )}

      {(personalEntries.length > 0 || operationEntries.length > 0) && simulation && (
        <Separator />
      )}

      {/* Dados da operação (form_data não pessoal + dados da simulação) */}
      {(operationEntries.length > 0 || simulation) && (
        <section>
          <p className="mb-3 text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
            Operação
          </p>
          <div className="grid grid-cols-2 gap-2">
            {simulation && (
              <>
                <FieldItem
                  label="Valor solicitado"
                  value={brlFull(Number(simulation.desired_amount))}
                />
                <FieldItem
                  label="Prazo"
                  value={`${simulation.desired_term_months} meses`}
                />
                {simulation.estimated_payment && (
                  <FieldItem
                    label="Parcela estimada"
                    value={brlFull(Number(simulation.estimated_payment))}
                  />
                )}
                {simulation.estimated_rate && (
                  <FieldItem
                    label="Taxa estimada"
                    value={`${Number(simulation.estimated_rate).toFixed(2)}% a.m.`}
                  />
                )}
              </>
            )}
            {operationEntries.map(({ key, label, value }) => (
              <FieldItem key={key} label={label} value={value} />
            ))}
          </div>
        </section>
      )}

      {personalEntries.length === 0 && operationEntries.length === 0 && !simulation && (
        <p className="text-sm text-muted-foreground">Dados não disponíveis.</p>
      )}
    </div>
  )
}
```

- [ ] **Step 2: Verificar TypeScript**

```bash
cd apps/console && pnpm tsc --noEmit
```

Esperado: sem erros.

- [ ] **Step 3: Commit**

```bash
git add apps/console/src/app/\(private\)/proposals/\[id\]/
git commit -m "feat(console): ClientDataTab com dados pessoais e operação"
```

---

## Task 7: `document-preview-modal.tsx`

**Files:**
- Create: `apps/console/src/app/(private)/proposals/[id]/_components/document-preview-modal.tsx`

- [ ] **Step 1: Criar o componente**

```typescript
// apps/console/src/app/(private)/proposals/[id]/_components/document-preview-modal.tsx
'use client'

import { useState, useCallback } from 'react'
import { Download, Loader2, X } from 'lucide-react'

import { Button } from '@/components/ui/button'
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet'

interface DocumentPreviewModalProps {
  proposalId: string
  documentId: string
  fileName: string | null
  storagePath: string
  open: boolean
  onOpenChange: (open: boolean) => void
}

const IMAGE_EXTENSIONS = ['.jpg', '.jpeg', '.png', '.gif', '.webp']

function isImage(path: string): boolean {
  const lower = path.toLowerCase()
  return IMAGE_EXTENSIONS.some((ext) => lower.endsWith(ext))
}

export function DocumentPreviewModal({
  proposalId,
  fileName,
  storagePath,
  open,
  onOpenChange,
}: DocumentPreviewModalProps) {
  const [signedUrl, setSignedUrl] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(false)

  const fetchUrl = useCallback(async () => {
    if (signedUrl) return
    setLoading(true)
    setError(false)
    try {
      const res = await fetch(
        `/api/proposals/${proposalId}/document-url?path=${encodeURIComponent(storagePath)}`,
      )
      if (!res.ok) throw new Error()
      const json = await res.json() as { url: string }
      setSignedUrl(json.url)
    } catch {
      setError(true)
    } finally {
      setLoading(false)
    }
  }, [proposalId, storagePath, signedUrl])

  function handleOpenChange(value: boolean) {
    if (value) fetchUrl()
    else setSignedUrl(null)
    onOpenChange(value)
  }

  const displayName = fileName ?? storagePath.split('/').pop() ?? 'Documento'

  return (
    <Sheet open={open} onOpenChange={handleOpenChange}>
      <SheetContent side="right" className="flex w-full max-w-2xl flex-col p-0 sm:max-w-2xl">
        <SheetHeader className="flex-row items-center justify-between border-b px-4 py-3">
          <SheetTitle className="truncate text-sm font-medium">{displayName}</SheetTitle>
          <div className="flex items-center gap-2">
            {signedUrl && (
              <Button variant="outline" size="sm" asChild>
                <a href={signedUrl} download={displayName} target="_blank" rel="noreferrer">
                  <Download className="mr-1.5 size-3.5" />
                  Baixar
                </a>
              </Button>
            )}
          </div>
        </SheetHeader>

        <div className="flex flex-1 items-center justify-center bg-muted/30 overflow-hidden">
          {loading && (
            <div className="flex flex-col items-center gap-2 text-muted-foreground">
              <Loader2 className="size-6 animate-spin" />
              <span className="text-sm">Carregando...</span>
            </div>
          )}

          {error && (
            <div className="flex flex-col items-center gap-2 text-muted-foreground">
              <X className="size-6" />
              <span className="text-sm">Arquivo indisponível</span>
            </div>
          )}

          {signedUrl && !loading && !error && (
            isImage(storagePath) ? (
              // biome-ignore lint/performance/noImgElement: preview de documento do cliente
              <img
                src={signedUrl}
                alt={displayName}
                className="max-h-full max-w-full object-contain"
              />
            ) : (
              <iframe
                src={signedUrl}
                title={displayName}
                className="h-full w-full border-0"
              />
            )
          )}
        </div>
      </SheetContent>
    </Sheet>
  )
}
```

- [ ] **Step 2: Verificar TypeScript**

```bash
cd apps/console && pnpm tsc --noEmit
```

Esperado: sem erros.

- [ ] **Step 3: Commit**

```bash
git add apps/console/src/app/\(private\)/proposals/\[id\]/
git commit -m "feat(console): DocumentPreviewModal com Sheet e signed URL"
```

---

## Task 8: `documents-tab.tsx`

**Files:**
- Create: `apps/console/src/app/(private)/proposals/[id]/_components/documents-tab.tsx`

- [ ] **Step 1: Criar o componente**

```typescript
// apps/console/src/app/(private)/proposals/[id]/_components/documents-tab.tsx
'use client'

import { useState } from 'react'
import { Eye, FileText, Image } from 'lucide-react'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
import { cn } from '@/lib/utils'
import { getRequiredDocs } from '../../required-documents'
import { DocumentPreviewModal } from './document-preview-modal'
import type { ProposalDetail } from '../../queries'

type UploadedDoc = NonNullable<ProposalDetail['proposal_documents']>[number]

const IMAGE_EXTENSIONS = ['.jpg', '.jpeg', '.png', '.gif', '.webp']
function isImage(path: string): boolean {
  const lower = (path ?? '').toLowerCase()
  return IMAGE_EXTENSIONS.some((ext) => lower.endsWith(ext))
}

interface DocumentsTabProps {
  proposal: ProposalDetail
}

export function DocumentsTab({ proposal }: DocumentsTabProps) {
  const [preview, setPreview] = useState<{
    docId: string
    fileName: string | null
    storagePath: string
  } | null>(null)

  const uploaded: UploadedDoc[] = Array.isArray(proposal.proposal_documents)
    ? proposal.proposal_documents
    : proposal.proposal_documents ? [proposal.proposal_documents] : []

  const required = getRequiredDocs(proposal.product_type_slug)
  const uploadedTypes = new Set(uploaded.map((d) => d.document_type))

  const pendingDocs = required.filter((r) => !uploadedTypes.has(r.type))
  const sentCount = uploaded.length
  const pendingCount = pendingDocs.length

  return (
    <>
      {/* Resumo */}
      <div className="mb-4 flex gap-2">
        <span className="inline-flex items-center gap-1.5 rounded-md border border-success/30 bg-success/8 px-2.5 py-1 text-xs font-medium text-success">
          ✓ {sentCount} enviado{sentCount !== 1 ? 's' : ''}
        </span>
        {pendingCount > 0 && (
          <span className="inline-flex items-center gap-1.5 rounded-md border border-warning/30 bg-warning/8 px-2.5 py-1 text-xs font-medium text-warning">
            ⏳ {pendingCount} pendente{pendingCount !== 1 ? 's' : ''}
          </span>
        )}
      </div>

      <div className="space-y-2">
        {/* Documentos enviados */}
        {uploaded.map((doc) => {
          const icon = isImage(doc.storage_path)
            ? <Image className="size-4 text-success" />
            : <FileText className="size-4 text-success" />

          return (
            <div
              key={doc.id}
              className="flex items-center justify-between rounded-lg border border-success/25 bg-success/6 px-3 py-2.5"
            >
              <div className="flex items-center gap-2.5 min-w-0">
                <div className="grid size-8 shrink-0 place-items-center rounded-md bg-success/12">
                  {icon}
                </div>
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium">{doc.file_name ?? doc.document_type}</p>
                  <p className="text-xs text-muted-foreground">
                    Enviado {new Date(doc.created_at).toLocaleDateString('pt-BR')}
                  </p>
                </div>
              </div>
              <div className="ml-2 flex shrink-0 items-center gap-1.5">
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="outline"
                      size="sm"
                      className="h-7 gap-1.5 text-xs"
                      onClick={() =>
                        setPreview({
                          docId: doc.id,
                          fileName: doc.file_name,
                          storagePath: doc.storage_path,
                        })
                      }
                    >
                      <Eye className="size-3" />
                      Visualizar
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>Abrir pré-visualização</TooltipContent>
                </Tooltip>
              </div>
            </div>
          )
        })}

        {/* Documentos pendentes */}
        {pendingDocs.map((doc) => (
          <div
            key={doc.type}
            className="flex items-center justify-between rounded-lg border border-warning/30 bg-warning/6 px-3 py-2.5"
          >
            <div className="flex items-center gap-2.5">
              <div className="grid size-8 shrink-0 place-items-center rounded-md bg-warning/12">
                <FileText className="size-4 text-warning" />
              </div>
              <div>
                <p className="text-sm font-medium text-warning">{doc.label}</p>
                <p className="text-xs text-muted-foreground">Não enviado pelo cliente</p>
              </div>
            </div>
            <Badge variant="outline" className="border-warning/40 text-warning text-xs">
              Pendente
            </Badge>
          </div>
        ))}

        {/* Estado vazio */}
        {uploaded.length === 0 && required.length === 0 && (
          <p className="py-4 text-center text-sm text-muted-foreground">
            Este produto não requer envio de documentos.
          </p>
        )}
      </div>

      {/* Modal de preview */}
      {preview && (
        <DocumentPreviewModal
          proposalId={proposal.id}
          documentId={preview.docId}
          fileName={preview.fileName}
          storagePath={preview.storagePath}
          open={!!preview}
          onOpenChange={(open) => { if (!open) setPreview(null) }}
        />
      )}
    </>
  )
}
```

> **Nota:** `text-warning` e `bg-warning/8` requerem que `--warning` exista no `globals.css`. Se não existir, usar `text-amber-600` e `bg-amber-50` como fallback. Verificar `globals.css` antes de implementar.

- [ ] **Step 2: Verificar que `--warning` / `text-warning` existe no globals.css**

```bash
grep -n "warning" apps/console/src/app/globals.css
```

Se não encontrar resultado, substituir todas as ocorrências de `text-warning`, `bg-warning/...`, `border-warning/...` por `text-amber-600`, `bg-amber-50`, `border-amber-200` no arquivo.

- [ ] **Step 3: Verificar TypeScript**

```bash
cd apps/console && pnpm tsc --noEmit
```

Esperado: sem erros.

- [ ] **Step 4: Commit**

```bash
git add apps/console/src/app/\(private\)/proposals/\[id\]/
git commit -m "feat(console): DocumentsTab com lista de enviados e pendentes"
```

---

## Task 9: `comments-tab.tsx`

**Files:**
- Create: `apps/console/src/app/(private)/proposals/[id]/_components/comments-tab.tsx`

- [ ] **Step 1: Criar o componente**

```typescript
// apps/console/src/app/(private)/proposals/[id]/_components/comments-tab.tsx
import { Lock, MessageSquare } from 'lucide-react'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'

import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import type { ProposalDetail } from '../../queries'

function getInitials(name: string): string {
  const parts = name.trim().split(' ').filter(Boolean)
  if (parts.length >= 2) return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase()
  return name.slice(0, 2).toUpperCase()
}

function avatarColor(name: string): string {
  const palettes = [
    'bg-chart-1/20 text-chart-1',
    'bg-chart-2/20 text-chart-2',
    'bg-chart-3/20 text-chart-3',
    'bg-chart-4/20 text-chart-4',
    'bg-chart-5/20 text-chart-5',
  ]
  let h = 0
  for (const c of name) h = ((h << 5) - h + c.charCodeAt(0)) | 0
  return palettes[Math.abs(h) % palettes.length]
}

type Comment = NonNullable<ProposalDetail['proposal_comments']>[number]

interface CommentsTabProps {
  proposal: ProposalDetail
}

export function CommentsTab({ proposal }: CommentsTabProps) {
  const comments: Comment[] = Array.isArray(proposal.proposal_comments)
    ? proposal.proposal_comments
    : proposal.proposal_comments ? [proposal.proposal_comments] : []

  return (
    <div className="space-y-4">
      {/* Aviso somente leitura */}
      <div className="flex items-center gap-2 rounded-md border border-border bg-muted/50 px-3 py-2 text-xs text-muted-foreground">
        <Lock className="size-3.5 shrink-0" />
        Comentários adicionados pelo time operacional via Admin. Somente visualização.
      </div>

      {/* Lista de comentários */}
      {comments.length === 0 ? (
        <div className="flex flex-col items-center gap-2 py-8 text-center text-muted-foreground">
          <MessageSquare className="size-8 opacity-30" />
          <p className="text-sm">Nenhum comentário registrado ainda.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {comments.map((comment) => (
            <div
              key={comment.id}
              className="rounded-lg border border-border bg-muted/40 px-4 py-3"
            >
              <div className="mb-2 flex items-start justify-between gap-3">
                <div className="flex items-center gap-2.5">
                  <Avatar className="size-7">
                    <AvatarFallback className={`text-[10px] font-bold ${avatarColor(comment.author_name)}`}>
                      {getInitials(comment.author_name)}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="text-sm font-semibold leading-tight">{comment.author_name}</p>
                    <p className="text-[10px] text-muted-foreground">Operacional · Vello Finance</p>
                  </div>
                </div>
                <time className="shrink-0 text-xs text-muted-foreground">
                  {format(new Date(comment.created_at), "d MMM · HH:mm", { locale: ptBR })}
                </time>
              </div>
              <p className="text-sm leading-relaxed text-foreground/80">{comment.body}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
```

- [ ] **Step 2: Verificar TypeScript**

```bash
cd apps/console && pnpm tsc --noEmit
```

Esperado: sem erros.

- [ ] **Step 3: Commit**

```bash
git add apps/console/src/app/\(private\)/proposals/\[id\]/
git commit -m "feat(console): CommentsTab somente leitura"
```

---

## Task 10: `proposal-timeline.tsx`

**Files:**
- Create: `apps/console/src/app/(private)/proposals/[id]/_components/proposal-timeline.tsx`

- [ ] **Step 1: Criar o componente**

```typescript
// apps/console/src/app/(private)/proposals/[id]/_components/proposal-timeline.tsx
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'

import { Card, CardContent } from '@/components/ui/card'
import { cn } from '@/lib/utils'
import { getRequiredDocs } from '../../required-documents'
import type { ProposalDetail } from '../../queries'

type ProposalEvent = NonNullable<ProposalDetail['proposal_events']>[number]

interface TimelineStep {
  key: string
  label: string
  matchStatus: string
}

function buildSteps(productTypeSlug: string, currentStatus: string): TimelineStep[] {
  const hasDocsStep = getRequiredDocs(productTypeSlug).length > 0
  const isReprovada = currentStatus === 'reprovada'

  const steps: TimelineStep[] = [
    { key: 'nova_proposta',   label: 'Proposta criada',      matchStatus: 'nova_proposta' },
    ...(hasDocsStep
      ? [{ key: 'proposta_criada', label: 'Documentos enviados', matchStatus: 'proposta_criada' }]
      : []),
    { key: 'em_analise',       label: 'Em análise',           matchStatus: 'em_analise' },
    ...(isReprovada
      ? [{ key: 'reprovada', label: 'Reprovada', matchStatus: 'reprovada' }]
      : [
          { key: 'pre_aprovada', label: 'Pré-aprovada', matchStatus: 'pre_aprovada' },
          { key: 'aprovada',     label: 'Aprovada',     matchStatus: 'aprovada' },
        ]
    ),
  ]
  return steps
}

interface ProposalTimelineProps {
  proposal: ProposalDetail
}

export function ProposalTimeline({ proposal }: ProposalTimelineProps) {
  const events: ProposalEvent[] = Array.isArray(proposal.proposal_events)
    ? proposal.proposal_events
    : proposal.proposal_events ? [proposal.proposal_events] : []

  const eventMap = new Map(events.map((e) => [e.to_status, e]))

  // Fallback: se não há eventos, usa created_at da proposta como "proposta criada"
  if (!eventMap.has('nova_proposta')) {
    eventMap.set('nova_proposta', {
      id: 'fallback',
      from_status: null,
      to_status: 'nova_proposta',
      created_at: proposal.created_at,
    } as ProposalEvent)
  }

  const steps = buildSteps(proposal.product_type_slug, proposal.status)

  // Determinar qual é o último status concluído
  const completedStatuses = new Set(events.map((e) => e.to_status))
  completedStatuses.add('nova_proposta') // sempre concluído

  const currentStepIndex = steps.findIndex((s) => s.matchStatus === proposal.status)

  return (
    <Card>
      <CardContent className="py-4">
        <p className="mb-4 text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
          Timeline
        </p>

        <div className="flex flex-col">
          {steps.map((step, i) => {
            const event = eventMap.get(step.matchStatus)
            const isDone = completedStatuses.has(step.matchStatus) && i < currentStepIndex
            const isCurrent = step.matchStatus === proposal.status
            const isUpcoming = !isDone && !isCurrent
            const isLast = i === steps.length - 1

            return (
              <div key={step.key} className="flex gap-3">
                {/* Track */}
                <div className="flex flex-col items-center">
                  <div className={cn(
                    'mt-0.5 size-2.5 shrink-0 rounded-full',
                    isDone && 'bg-success',
                    isCurrent && 'bg-primary shadow-[0_0_0_3px_hsl(var(--primary)/0.2)]',
                    isUpcoming && 'border-2 border-border bg-background',
                  )} />
                  {!isLast && (
                    <div className={cn(
                      'w-px flex-1 my-1',
                      isDone ? 'bg-success/30' : 'bg-border',
                    )} style={{ minHeight: '20px' }} />
                  )}
                </div>

                {/* Content */}
                <div className={cn('pb-3', isLast && 'pb-0')}>
                  <p className={cn(
                    'text-sm font-semibold leading-tight',
                    isCurrent && 'text-primary',
                    isUpcoming && 'font-normal text-muted-foreground',
                  )}>
                    {step.label}
                  </p>
                  {event && (isDone || isCurrent) && (
                    <p className="mt-0.5 text-[10px] text-muted-foreground">
                      {format(new Date(event.created_at), "d MMM yyyy · HH:mm", { locale: ptBR })}
                    </p>
                  )}
                  {isCurrent && (
                    <span className="mt-1 inline-block rounded-full bg-primary/10 px-2 py-0.5 text-[9px] font-semibold text-primary">
                      Etapa atual
                    </span>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      </CardContent>
    </Card>
  )
}
```

- [ ] **Step 2: Verificar TypeScript**

```bash
cd apps/console && pnpm tsc --noEmit
```

Esperado: sem erros.

- [ ] **Step 3: Commit**

```bash
git add apps/console/src/app/\(private\)/proposals/\[id\]/
git commit -m "feat(console): ProposalTimeline vertical com estados done/current/upcoming"
```

---

## Task 11: `proposal-origin.tsx`

**Files:**
- Create: `apps/console/src/app/(private)/proposals/[id]/_components/proposal-origin.tsx`

- [ ] **Step 1: Criar o componente**

```typescript
// apps/console/src/app/(private)/proposals/[id]/_components/proposal-origin.tsx
import { Store, User } from 'lucide-react'

import { Card, CardContent } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'

interface ProposalOriginProps {
  tenantName: string
}

export function ProposalOrigin({ tenantName }: ProposalOriginProps) {
  const initials = tenantName
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0].toUpperCase())
    .join('')

  return (
    <Card>
      <CardContent className="py-4">
        <p className="mb-3 text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
          Origem
        </p>

        <div className="flex items-center gap-2.5">
          <div className="grid size-9 shrink-0 place-items-center rounded-lg bg-primary text-primary-foreground text-xs font-bold">
            {initials || <Store className="size-4" />}
          </div>
          <div>
            <p className="text-sm font-semibold">{tenantName}</p>
            <p className="text-xs text-muted-foreground">Canal: Web · Store</p>
          </div>
        </div>

        <Separator className="my-3" />

        <p className="mb-2 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
          Vendedor
        </p>
        <div className="flex items-center gap-2 rounded-md border border-dashed border-border bg-muted/40 px-2.5 py-2">
          <div className="grid size-6 shrink-0 place-items-center rounded-full bg-border">
            <User className="size-3 text-muted-foreground" />
          </div>
          <p className="text-xs italic text-muted-foreground">Disponível em breve</p>
        </div>
      </CardContent>
    </Card>
  )
}
```

- [ ] **Step 2: Verificar TypeScript**

```bash
cd apps/console && pnpm tsc --noEmit
```

Esperado: sem erros.

- [ ] **Step 3: Commit**

```bash
git add apps/console/src/app/\(private\)/proposals/\[id\]/
git commit -m "feat(console): ProposalOrigin com placeholder de vendedor"
```

---

## Task 12: `proposal-tabs.tsx` — Client Component central das abas

**Files:**
- Create: `apps/console/src/app/(private)/proposals/[id]/_components/proposal-tabs.tsx`

- [ ] **Step 1: Criar o componente**

```typescript
// apps/console/src/app/(private)/proposals/[id]/_components/proposal-tabs.tsx
'use client'

import { useState } from 'react'

import { Card } from '@/components/ui/card'
import { cn } from '@/lib/utils'
import type { ProposalDetail } from '../../queries'
import { getRequiredDocs } from '../../required-documents'
import { ClientDataTab } from './client-data-tab'
import { CommentsTab } from './comments-tab'
import { DocumentsTab } from './documents-tab'

type Tab = 'cliente' | 'documentos' | 'comentarios'

interface ProposalTabsProps {
  proposal: ProposalDetail
}

export function ProposalTabs({ proposal }: ProposalTabsProps) {
  const [activeTab, setActiveTab] = useState<Tab>('cliente')

  const uploaded = Array.isArray(proposal.proposal_documents)
    ? proposal.proposal_documents
    : proposal.proposal_documents ? [proposal.proposal_documents] : []

  const required = getRequiredDocs(proposal.product_type_slug)
  const pendingCount = required.filter(
    (r) => !uploaded.some((d) => d.document_type === r.type),
  ).length

  const comments = Array.isArray(proposal.proposal_comments)
    ? proposal.proposal_comments
    : proposal.proposal_comments ? [proposal.proposal_comments] : []

  const tabs: { id: Tab; label: string; badge?: { value: string; warn?: boolean } }[] = [
    { id: 'cliente', label: 'Dados do Cliente' },
    {
      id: 'documentos',
      label: 'Documentos',
      badge: pendingCount > 0
        ? { value: `${pendingCount} pendente${pendingCount !== 1 ? 's' : ''}`, warn: true }
        : undefined,
    },
    {
      id: 'comentarios',
      label: 'Comentários',
      badge: comments.length > 0 ? { value: String(comments.length) } : undefined,
    },
  ]

  return (
    <Card className="overflow-hidden">
      {/* Tab list */}
      <div className="flex border-b border-border px-1">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            type="button"
            onClick={() => setActiveTab(tab.id)}
            className={cn(
              'flex items-center gap-1.5 border-b-2 px-3.5 py-2.5 text-xs font-medium transition-colors',
              activeTab === tab.id
                ? 'border-primary text-foreground font-semibold'
                : 'border-transparent text-muted-foreground hover:text-foreground',
            )}
          >
            {tab.label}
            {tab.badge && (
              <span className={cn(
                'rounded-full px-1.5 py-px text-[10px] font-semibold',
                tab.badge.warn
                  ? 'bg-amber-100 text-amber-700'
                  : 'bg-muted text-muted-foreground',
              )}>
                {tab.badge.value}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Tab content */}
      <div className="p-4">
        {activeTab === 'cliente'     && <ClientDataTab proposal={proposal} />}
        {activeTab === 'documentos'  && <DocumentsTab proposal={proposal} />}
        {activeTab === 'comentarios' && <CommentsTab proposal={proposal} />}
      </div>
    </Card>
  )
}
```

- [ ] **Step 2: Verificar TypeScript**

```bash
cd apps/console && pnpm tsc --noEmit
```

Esperado: sem erros.

- [ ] **Step 3: Commit**

```bash
git add apps/console/src/app/\(private\)/proposals/\[id\]/
git commit -m "feat(console): ProposalTabs com gerenciamento de aba ativa e badges"
```

---

## Task 13: `[id]/page.tsx` — Server Component principal

**Files:**
- Create: `apps/console/src/app/(private)/proposals/[id]/page.tsx`

- [ ] **Step 1: Buscar o nome do tenant para o ProposalOrigin**

A query de `getProposal` não retorna o nome do tenant. Adicionar uma query auxiliar em `queries.ts`:

Abrir `apps/console/src/app/(private)/proposals/queries.ts` e adicionar ao final:

```typescript
export async function getTenantName(): Promise<string> {
  const supabase = await createClient()
  const { data } = await supabase
    .from('tenants')
    .select('name')
    .single()
  return data?.name ?? 'Loja'
}
```

- [ ] **Step 2: Criar o `page.tsx`**

```typescript
// apps/console/src/app/(private)/proposals/[id]/page.tsx
import { notFound } from 'next/navigation'
import type { Metadata } from 'next'

import { getProposal, getTenantName } from '../queries'
import { ProposalDetailHeader } from './_components/proposal-detail-header'
import { ProposalTabs } from './_components/proposal-tabs'
import { ProposalTimeline } from './_components/proposal-timeline'
import { ProposalOrigin } from './_components/proposal-origin'

interface PageProps {
  params: Promise<{ id: string }>
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { id } = await params
  try {
    const proposal = await getProposal(id)
    return { title: `Proposta · ${proposal.client_name ?? 'Cliente'}` }
  } catch {
    return { title: 'Proposta' }
  }
}

export default async function ProposalDetailPage({ params }: PageProps) {
  const { id } = await params

  // Fetches paralelos: getProposal e getTenantName são independentes (async-parallel)
  let proposal
  let tenantName: string
  try {
    ;[proposal, tenantName] = await Promise.all([getProposal(id), getTenantName()])
  } catch {
    notFound()
  }

  return (
    <div className="mx-auto w-full max-w-screen-xl p-8">
      {/* Eyebrow + título */}
      <span className="text-xs font-medium uppercase tracking-widest text-foreground/45">
        Originação · Pipeline
      </span>
      <h1 className="mb-6 mt-1 text-4xl font-semibold leading-none tracking-tight">
        Proposta<span className="text-primary">.</span>
      </h1>

      {/* Header card */}
      <ProposalDetailHeader proposal={proposal} />

      {/* Two-column layout */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-[1fr_256px]">
        {/* Coluna principal: abas */}
        <ProposalTabs proposal={proposal} />

        {/* Sidebar */}
        <div className="flex flex-col gap-4">
          <ProposalTimeline proposal={proposal} />
          <ProposalOrigin tenantName={tenantName} />
        </div>
      </div>
    </div>
  )
}
```

- [ ] **Step 3: Verificar TypeScript**

```bash
cd apps/console && pnpm tsc --noEmit
```

Esperado: sem erros.

- [ ] **Step 4: Commit**

```bash
git add apps/console/src/app/\(private\)/proposals/\[id\]/ apps/console/src/app/\(private\)/proposals/queries.ts
git commit -m "feat(console): page.tsx de detalhes de proposta"
```

---

## Task 14: Linkar `proposal-card.tsx` → página de detalhes

**Files:**
- Modify: `apps/console/src/app/(private)/proposals/_components/proposal-card.tsx`

- [ ] **Step 1: Substituir o botão `<Eye>` por um `<Link>`**

No `proposal-card.tsx`, localizar o `CardFooter` e substituir o bloco do botão Eye por um Link:

```typescript
// Adicionar import no topo do arquivo:
import Link from 'next/link'

// No CardFooter, substituir o bloco dos dois botões por:
<CardFooter className="flex items-center justify-between bg-transparent px-4">
  <span className="text-xs text-muted-foreground">{dateStr}</span>
  <Tooltip>
    <TooltipTrigger asChild>
      <Button variant="ghost" size="icon-sm" asChild>
        <Link href={`/proposals/${proposal.id}`}>
          <Eye />
        </Link>
      </Button>
    </TooltipTrigger>
    <TooltipContent>Ver detalhes</TooltipContent>
  </Tooltip>
</CardFooter>
```

> **Nota:** O botão `<MoreHorizontal>` pode ser removido ou mantido. Se mantido, deixar como `<Button variant="ghost" size="icon-sm" disabled>` por ora (sem ações disponíveis no console).

- [ ] **Step 2: Verificar TypeScript**

```bash
cd apps/console && pnpm tsc --noEmit
```

Esperado: sem erros.

- [ ] **Step 3: Commit**

```bash
git add apps/console/src/app/\(private\)/proposals/_components/proposal-card.tsx
git commit -m "feat(console): proposal-card linka para tela de detalhes"
```

---

## Task 15: Teste manual e ajustes finais

- [ ] **Step 1: Subir o servidor de desenvolvimento**

```bash
cd apps/console && pnpm dev
```

Abrir `http://localhost:3001` e navegar para a listagem de propostas.

- [ ] **Step 2: Checklist de validação**

| Item | Verificar |
|---|---|
| Listagem → Detalhes | Clicar no ícone Eye abre `/proposals/[id]` |
| Header | Nome, produto, ID e badge de status exibidos corretamente |
| Aba "Dados do Cliente" | Campos pessoais + operação exibidos em grid 2 colunas |
| Aba "Documentos" | Documentos enviados (verde) e pendentes (amarelo) distintos |
| Aba "Documentos" | Badge "N pendentes" aparece na tab |
| Botão "Visualizar" | Abre Sheet lateral com preview do arquivo |
| Aba "Comentários" | Lista comentários de teste do seed; estado vazio se sem comentários |
| Aviso somente leitura | Mensagem de Lock aparece no topo da aba Comentários |
| Timeline | Etapas concluídas (verde), atual (azul + badge), próximas (cinza) |
| Timeline | Datas exibidas para etapas concluídas |
| Card Origem | Nome do tenant + placeholder "Vendedor" |
| Responsividade mobile | Em tela < md, sidebar aparece abaixo das abas |
| Proposta inexistente | Acessar `/proposals/uuid-invalido` → página 404 |
| Breadcrumb | "Originação · Pipeline / Propostas / [Nome do cliente]" |

- [ ] **Step 3: Commit final**

```bash
git add .
git commit -m "feat(console): tela de detalhes da proposta — implementação completa"
```

---

## Self-review do plano

**Cobertura da spec:**
- ✅ Seção 1.1: migrations `proposal_events` + `proposal_comments` com RLS → Task 1
- ✅ Seção 1.3: `REQUIRED_DOCUMENTS` mapa → Task 2
- ✅ Seção 2.2: `getProposal` query → Task 3
- ✅ Seção 2.3: Route Handler signed URL → Task 4
- ✅ Seção 3.2: `ProposalDetailHeader` → Task 5
- ✅ Seção 3.3 Dados do Cliente: `ClientDataTab` → Task 6
- ✅ Seção 3.3 Documentos (modal): `DocumentPreviewModal` → Task 7
- ✅ Seção 3.3 Documentos (lista): `DocumentsTab` → Task 8
- ✅ Seção 3.3 Comentários: `CommentsTab` → Task 9
- ✅ Seção 3.4: `ProposalTimeline` → Task 10
- ✅ Seção 3.5: `ProposalOrigin` → Task 11
- ✅ Abas + badges: `ProposalTabs` → Task 12
- ✅ Seção 3.1 layout + Seção 4 navegação: `page.tsx` → Task 13
- ✅ Seção 4 link do card: `proposal-card.tsx` → Task 14
- ✅ Seção 5 tratamento de erros: `notFound()` em page.tsx + erros no modal → Tasks 13, 7
- ✅ Seção 6 Fat Server/Thin Client: apenas `proposal-tabs.tsx` e `document-preview-modal.tsx` são Client Components
- ✅ `getTenantName` → adicionada na Task 13 Step 1

**Tipos consistentes:** `ProposalDetail` definido na Task 3 e usado em Tasks 5–13. `RequiredDoc` definido na Task 2 e usado nas Tasks 8, 10, 12.
