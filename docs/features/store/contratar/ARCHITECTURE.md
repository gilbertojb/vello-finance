# Architecture — Contracting Flow (`/contratar/`)

**Date:** 2026-05-17
**App:** `apps/store`
**Status:** Approved

---

## Overview

The contracting flow is a multi-step wizard that persists data to Supabase at each step. Each product has a specific flow, but they share the same route infrastructure, database, and components.

The flow is divided into:
- **Step 1:** client data collection (public, no authentication)
- **Step 2:** submission of bank details and documents (accessed via link after pre-approval by the consultant)

---

## Link to Products

The link to the product registry uses **`product_type_slug`** — the pipeline slug (e.g. `home_equity`, `auto_equity`) — to determine which flow to render.

The `product_id` (UUID) is passed as an initial parameter and stored on the proposal to reference the tenant's specific product.

```
/contratar/[productTypeSlug]?productId={uuid}&simulationId={uuid}
```

Slug examples per product:
| Product | `product_type_slug` |
|---|---|
| CGI Individual | `home_equity` |
| CGI Business | `home_equity_pj` |
| Auto Equity Individual | `auto_equity` |
| Auto Equity Business | `auto_equity_pj` |
| FGTS | `fgts` |
| Working Capital | `capital_giro` |
| Receivables Advance | `antecipacao_recebiveis` |
| Property Financing | `financiamento_imovel` |
| Vehicle Financing | `financiamento_veiculo` |
| Payroll Loan (CLT) | `consignado_privado` |

---

## Routing

```
/contratar/[productTypeSlug]?step={stepSlug}&proposalId={uuid}&productId={uuid}&simulationId={uuid}
```

- **`productTypeSlug`**: identifies which wizard to render
- **`step`**: current wizard step (friendly name, e.g. `operacao`, `dados-pessoais`)
- **`proposalId`**: created on the backend when the first step is saved; absent on the initial step
- **`productId`**: UUID of the tenant's product (passed from the simulator result screen)
- **`simulationId`**: optional, reference to the simulation that originated the proposal

For Step 2 (accessed via external link):
```
/proposta/[proposalId]/documentos?step={stepSlug}
/proposta/[proposalId]/finalizado
```

---

## Database

### `proposals` Table

```sql
CREATE TABLE proposals (
  id                 UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id          UUID NOT NULL REFERENCES tenants(id),
  product_id         UUID NOT NULL REFERENCES products(id),
  product_type_slug  TEXT NOT NULL,     -- 'home_equity', 'auto_equity', etc.
  simulation_id      UUID REFERENCES simulations(id),
  status             TEXT NOT NULL DEFAULT 'nova_proposta'
    CHECK (status IN (
      'nova_proposta',       -- client started but did not complete Step 1
      'proposta_criada',     -- client completed Step 1
      'pre_aprovada',        -- pre-approved by the consultant
      'necessita_detalhes',  -- consultant requested more information
      'reprovada',           -- proposal rejected
      'aprovada'             -- proposal approved
    )),
  current_step       TEXT NOT NULL DEFAULT 'operacao',  -- current step slug
  -- data pre-filled from the simulation (editable)
  client_name        TEXT,
  client_phone       TEXT,
  -- all data collected in the wizard, organized by step
  form_data          JSONB NOT NULL DEFAULT '{}',
  -- Step 2: submitted documents status
  documents_submitted BOOLEAN DEFAULT FALSE,
  created_at         TIMESTAMPTZ DEFAULT NOW(),
  updated_at         TIMESTAMPTZ DEFAULT NOW()
);

-- RLS: isolated by tenant_id, no client authentication (accessed via service role in Server Actions)
ALTER TABLE proposals ENABLE ROW LEVEL SECURITY;

CREATE POLICY "proposals_tenant_isolation"
  ON proposals FOR ALL
  USING (tenant_id = (auth.jwt() ->> 'tenant_id')::uuid);
```

### `proposal_documents` Table

```sql
CREATE TABLE proposal_documents (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  proposal_id   UUID NOT NULL REFERENCES proposals(id) ON DELETE CASCADE,
  document_type TEXT NOT NULL,   -- 'rg_cpf_frente', 'crlv', 'ir', etc.
  storage_path  TEXT NOT NULL,   -- path in Supabase Storage
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
Bucket: proposal-documents (private)
Path: {tenant_id}/{proposal_id}/{document_type}/{filename}
```

---

## Page Architecture

### Fat Server / Thin Client Pattern

```
apps/store/src/app/(store)/contratar/
└── [productTypeSlug]/
    ├── page.tsx                 ← Server Component: reads step and proposalId, renders the correct step
    └── _components/
        ├── wizard-container.tsx ← Client Component: step indicator, layout
        ├── steps/               ← One Client Component per step
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
            ├── address-form.tsx      ← reusable postal-code (CEP) lookup
            ├── document-upload.tsx   ← upload with checklist
            └── socio-fields.tsx      ← dynamic partner/shareholder fields

apps/store/src/app/(store)/proposta/
└── [proposalId]/
    ├── documentos/
    │   └── page.tsx             ← Step 2: bank details + documents
    └── finalizado/
        └── page.tsx             ← Completion page

apps/store/src/app/(store)/simulador/
└── actions.ts                   ← EXISTING: add createProposal
```

### `page.tsx` — rendering logic

```tsx
// apps/store/src/app/(store)/contratar/[productTypeSlug]/page.tsx
// Server Component

export default async function ContratarPage({ params, searchParams }) {
  const { productTypeSlug } = params
  const { step = 'operacao', proposalId, productId, simulationId } = searchParams

  // Look up product by productId (validates it belongs to the tenant)
  const product = await getTenantProduct(productId)
  if (!product) redirect('/simulador')

  // If proposalId is present, fetch the proposal (pre-fills form_data)
  const proposal = proposalId ? await getProposal(proposalId) : null

  // Renders the correct wizard based on productTypeSlug
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

// Creates the proposal on the first step
export async function createProposal(input: CreateProposalInput): Promise<ProposalResult>

// Advances the step: saves form_data for the current step, updates current_step
export async function saveStep(proposalId: string, stepSlug: string, data: Record<string, unknown>): Promise<StepResult>

// Finalizes Step 1: changes status to 'proposta_criada'
export async function finalizeEtapa1(proposalId: string): Promise<void>

// Saves a document: uploads to Storage and inserts into proposal_documents
export async function uploadDocument(proposalId: string, documentType: string, file: File): Promise<DocumentResult>

// Finalizes Step 2: sets documents_submitted = true
export async function finalizeEtapa2(proposalId: string): Promise<void>
```

---

## Document Upload Component

```
DocumentUploadChecklist
├── DocumentItem (per document)
│   ├── Label + description (e.g. "ID and CPF front and back")
│   ├── Upload button (PDF or JPEG)
│   ├── Preview of the uploaded file
│   ├── Status: pending / uploaded ✓ / error
│   └── Examples of how the file should look (tooltip/modal)
└── "Finish Submission" button (enabled only after all documents are uploaded)
```

---

## Postal Code (CEP) Lookup

API already exists at `/api/cep/[cep]`. The `AddressForm` component fetches when it detects 8 digits in the CEP field and auto-fills street, neighborhood, city, and state, allowing edits.

---

## Step Indicator

Progress bar with step numbering. Shows only the Step 1 steps. In Step 2, shows only the document steps.

---

## Global Business Rules

- In Step 1, if the client stops on any page: status `nova_proposta`
- After completing Step 1: status `proposta_criada`
- Simulation data is pre-filled but editable
- All required fields: cannot advance without a response
- Documents: accepted formats PDF and JPEG, preview, interactive checklist
- Monetary value fields: automatic R$ formatting, numbers only
- Full name: minimum 2 words
- WhatsApp: fixed Brazil country code (+55), area code + number
- Date of birth: block if age > 70 years
- Registration number: numbers only

---

## Fields Pre-filled from the Simulation

The following fields are pre-filled from the simulation and are editable:
- `client_name` → Full name
- `client_phone` → WhatsApp
