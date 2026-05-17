# Arquitetura — Fluxo de Contratação (`/contratar/`)

**Data:** 2026-05-17
**App:** `apps/store`
**Status:** Aprovado

---

## Visão Geral

O fluxo de contratação é um wizard multi-step que persiste dados no Supabase a cada etapa. Cada produto tem um fluxo específico, mas compartilham a mesma infraestrutura de rotas, banco de dados e componentes.

O fluxo divide-se em:
- **Etapa 1:** coleta de dados do cliente (pública, sem autenticação)
- **Etapa 2:** envio de dados bancários e documentos (acessada via link após pré-aprovação pelo consultor)

---

## Vínculo com Produtos

O vínculo com o cadastro de produtos usa **`product_type_slug`** — o slug da esteira (ex: `home_equity`, `auto_equity`) — para determinar qual fluxo renderizar.

O `product_id` (UUID) é passado como parâmetro inicial e armazenado na proposta para referenciar o produto específico do tenant.

```
/contratar/[productTypeSlug]?productId={uuid}&simulationId={uuid}
```

Exemplos de slug por produto:
| Produto | `product_type_slug` |
|---|---|
| CGI Pessoa Física | `home_equity` |
| CGI Pessoa Jurídica | `home_equity_pj` |
| Auto Equity PF | `auto_equity` |
| Auto Equity PJ | `auto_equity_pj` |
| FGTS | `fgts` |
| Capital de Giro | `capital_giro` |
| Antecipação de Recebíveis | `antecipacao_recebiveis` |
| Financiamento Imóvel | `financiamento_imovel` |
| Financiamento Veículo | `financiamento_veiculo` |
| Consignado CLT | `consignado_privado` |

---

## Roteamento

```
/contratar/[productTypeSlug]?step={stepSlug}&proposalId={uuid}&productId={uuid}&simulationId={uuid}
```

- **`productTypeSlug`**: identifica qual wizard renderizar
- **`step`**: etapa atual do wizard (nome amigável, ex: `operacao`, `dados-pessoais`)
- **`proposalId`**: criado no backend ao salvar o primeiro step; ausente no step inicial
- **`productId`**: UUID do produto no tenant (passado da tela de resultado do simulador)
- **`simulationId`**: opcional, referência à simulação que originou a proposta

Para a Etapa 2 (acessada via link externo):
```
/proposta/[proposalId]/documentos?step={stepSlug}
/proposta/[proposalId]/finalizado
```

---

## Banco de Dados

### Tabela `proposals`

```sql
CREATE TABLE proposals (
  id                 UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id          UUID NOT NULL REFERENCES tenants(id),
  product_id         UUID NOT NULL REFERENCES products(id),
  product_type_slug  TEXT NOT NULL,     -- 'home_equity', 'auto_equity', etc.
  simulation_id      UUID REFERENCES simulations(id),
  status             TEXT NOT NULL DEFAULT 'nova_proposta'
    CHECK (status IN (
      'nova_proposta',       -- cliente iniciou mas não concluiu Etapa 1
      'proposta_criada',     -- cliente concluiu Etapa 1
      'pre_aprovada',        -- consultor pré-aprovou
      'necessita_detalhes',  -- consultor solicitou mais informações
      'reprovada',           -- proposta reprovada
      'aprovada'             -- proposta aprovada
    )),
  current_step       TEXT NOT NULL DEFAULT 'operacao',  -- slug do step atual
  -- dados pré-preenchidos da simulação (editáveis)
  client_name        TEXT,
  client_phone       TEXT,
  -- todos os dados coletados no wizard, organizados por step
  form_data          JSONB NOT NULL DEFAULT '{}',
  -- Etapa 2: status de documentos enviados
  documents_submitted BOOLEAN DEFAULT FALSE,
  created_at         TIMESTAMPTZ DEFAULT NOW(),
  updated_at         TIMESTAMPTZ DEFAULT NOW()
);

-- RLS: tenant_id isolado, sem autenticação do cliente (acesso via service role em Server Actions)
ALTER TABLE proposals ENABLE ROW LEVEL SECURITY;

CREATE POLICY "proposals_tenant_isolation"
  ON proposals FOR ALL
  USING (tenant_id = (auth.jwt() ->> 'tenant_id')::uuid);
```

### Tabela `proposal_documents`

```sql
CREATE TABLE proposal_documents (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  proposal_id   UUID NOT NULL REFERENCES proposals(id) ON DELETE CASCADE,
  document_type TEXT NOT NULL,   -- 'rg_cpf_frente', 'crlv', 'ir', etc.
  storage_path  TEXT NOT NULL,   -- caminho no Supabase Storage
  file_name     TEXT,
  created_at    TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE proposal_documents ENABLE ROW LEVEL SECURITY;

CREATE POLICY "proposal_documents_tenant_isolation"
  ON proposal_documents FOR ALL
  USING (
    proposal_id IN (
      SELECT id FROM proposals WHERE tenant_id = (auth.jwt() ->> 'tenant_id')::uuid
    )
  );
```

### Storage Bucket

```
Bucket: proposal-documents (privado)
Path: {tenant_id}/{proposal_id}/{document_type}/{filename}
```

---

## Arquitetura da Página

### Padrão Fat Server / Thin Client

```
apps/store/src/app/(store)/contratar/
└── [productTypeSlug]/
    ├── page.tsx                 ← Server Component: lê step e proposalId, renderiza step correto
    └── _components/
        ├── wizard-container.tsx ← Client Component: step indicator, layout
        ├── steps/               ← Um Client Component por step
        │   ├── operacao-step.tsx
        │   ├── dados-pessoais-step.tsx
        │   ├── endereco-step.tsx
        │   ├── renda-ocupacao-step.tsx
        │   ├── dados-empresa-step.tsx
        │   ├── atividade-faturamento-step.tsx
        │   ├── dados-socios-step.tsx
        │   ├── garantia-step.tsx
        │   ├── dados-bancarios-step.tsx
        │   ├── retorno-step.tsx
        │   └── bloqueio-step.tsx
        └── shared/
            ├── address-form.tsx      ← CEP lookup reutilizável
            ├── document-upload.tsx   ← Upload com checklist
            └── socio-fields.tsx      ← Campos de sócio dinâmicos

apps/store/src/app/(store)/proposta/
└── [proposalId]/
    ├── documentos/
    │   └── page.tsx             ← Etapa 2: dados bancários + documentos
    └── finalizado/
        └── page.tsx             ← Página de conclusão

apps/store/src/app/(store)/simulador/
└── actions.ts                   ← EXISTENTE: adicionar createProposal
```

### `page.tsx` — lógica de renderização

```tsx
// apps/store/src/app/(store)/contratar/[productTypeSlug]/page.tsx
// Server Component

export default async function ContratarPage({ params, searchParams }) {
  const { productTypeSlug } = params
  const { step = 'operacao', proposalId, productId, simulationId } = searchParams

  // Busca produto pelo productId (valida que pertence ao tenant)
  const product = await getTenantProduct(productId)
  if (!product) redirect('/simulador')

  // Se proposalId, busca proposta (pre-fills form_data)
  const proposal = proposalId ? await getProposal(proposalId) : null

  // Renderiza wizard correto baseado no productTypeSlug
  return (
    <WizardContainer
      productTypeSlug={productTypeSlug}
      currentStep={step}
      proposal={proposal}
      product={product}
    />
  )
}
```

---

## Server Actions

```typescript
// apps/store/src/app/(store)/contratar/actions.ts

// Cria proposta no primeiro step
export async function createProposal(input: CreateProposalInput): Promise<ProposalResult>

// Avança step: salva form_data do step atual, atualiza current_step
export async function saveStep(proposalId: string, stepSlug: string, data: Record<string, unknown>): Promise<StepResult>

// Finaliza Etapa 1: muda status para 'proposta_criada'
export async function finalizeEtapa1(proposalId: string): Promise<void>

// Salva documento: faz upload para Storage e insere em proposal_documents
export async function uploadDocument(proposalId: string, documentType: string, file: File): Promise<DocumentResult>

// Finaliza Etapa 2: muda documents_submitted = true
export async function finalizeEtapa2(proposalId: string): Promise<void>
```

---

## Componente de Upload de Documentos

```
DocumentUploadChecklist
├── DocumentItem (por documento)
│   ├── Label + descrição (ex: "RG e CPF frente e verso")
│   ├── Botão de upload (PDF ou JPEG)
│   ├── Preview do arquivo enviado
│   ├── Status: pendente / enviado ✓ / erro
│   └── Exemplos de como deve ser o arquivo (tooltip/modal)
└── Botão "Finalizar Envio" (habilitado somente após todos enviados)
```

---

## CEP Lookup

API já existente em `/api/cep/[cep]`. Componente `AddressForm` faz fetch ao detectar 8 dígitos no campo CEP e preenche rua, bairro, cidade, estado automaticamente, permitindo edição.

---

## Step Indicator

Barra de progresso com numeração das etapas. Exibe apenas as etapas da Etapa 1. Na Etapa 2, exibe apenas etapas de documentos.

---

## Regras de Negócio Globais

- Na Etapa 1, se o cliente parar em qualquer página: status `nova_proposta`
- Após concluir Etapa 1: status `proposta_criada`
- Dados da simulação são pré-preenchidos mas editáveis
- Todos os campos obrigatórios: não avança sem resposta
- Documentos: formatos aceitos PDF e JPEG, pré-visualização, checklist interativo
- Campos de valor monetário: R$ automático, apenas números
- Nome completo: mínimo 2 palavras
- WhatsApp: DDI Brasil fixo (+55), DDD + número
- Data de nascimento: bloquear se idade > 70 anos
- Matrícula: apenas números

---

## Campos Pré-preenchidos da Simulação

Os seguintes campos são pré-preenchidos a partir da simulação e editáveis:
- `client_name` → Nome completo
- `client_phone` → WhatsApp
