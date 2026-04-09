# Feature Spec: Configuração de Pipeline por Tipo de Produto

**Status:** ✅ **PRONTO PARA IMPLEMENTAÇÃO**  
**Dependências:** product_types (já existe), tenants (SPEC.md file:423)  

**App:** `apps/admin` — Vello Admin
**Módulo:** Admin / Product Types
**Terminologia UI:** "Etapas da Esteira"
**Status:** `ready-for-dev`
**Prioridade:** Alta


***

## 🎯 **Objetivo**
Permitir configuração **flexível de pipeline de propostas** por tipo de produto com **triggers para automações n8n**.

```
FGTS → [Proposta Iniciada → Ag. Docs → Aprovada] + triggers
INSS → [Simulação → Análise → Contrato] + triggers diferentes
```

***

## 🗄️ **MODELOS SUPABASE (Migrations)**

### **Migration 001: product_types_pipeline.sql**
```sql
-- Atualizar product_types existente
ALTER TABLE product_types 
ADD COLUMN active BOOLEAN DEFAULT true;

CREATE INDEX idx_product_types_tenant_active 
ON product_types(tenant_id, active);
```

### **Migration 002: proposal_stages.sql**
```sql
CREATE TABLE proposal_stages (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_type_id UUID NOT NULL REFERENCES product_types(id) ON DELETE CASCADE,
  name            VARCHAR(100) NOT NULL,
  order_num       INTEGER NOT NULL,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (product_type_id, order_num)
);

CREATE INDEX idx_proposal_stages_product_order
  ON proposal_stages(product_type_id, order_num);
```

> **Nota:** Timeout foi movido para `stage_triggers` — configurado por trigger, não por etapa.

### **Migration 003: stage_triggers.sql**
```sql
CREATE TABLE stage_triggers (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  stage_id         UUID NOT NULL REFERENCES proposal_stages(id) ON DELETE CASCADE,
  event_type       VARCHAR(20) NOT NULL CHECK (event_type IN ('on_enter', 'on_exit', 'on_timeout')),
  webhook_url      TEXT NOT NULL,
  payload_template JSONB,
  timeout_unit     VARCHAR(10) CHECK (timeout_unit IN ('minutes', 'hours', 'days')),
  timeout_value    INTEGER CHECK (timeout_value IS NULL OR timeout_value > 0),
  created_at       TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_stage_triggers_stage_event ON stage_triggers(stage_id, event_type);
```

> **Nota:** `timeout_unit` e `timeout_value` são relevantes apenas para triggers `on_timeout`.
> Ficam em `stage_triggers` para permitir múltiplos timeouts com ações diferentes por etapa.

### **Migration 004: proposals_timeline.sql** (futuro)
```sql
-- Preparar para timeline (implementar depois)
ALTER TABLE proposals 
ADD COLUMN current_stage UUID REFERENCES proposal_stages(id);

ALTER TABLE proposals 
ADD COLUMN stage_timeline JSONB[] DEFAULT '{}';
```

### **RLS Policies**
```sql
-- proposal_stages: backoffice gerencia; tenants leem apenas etapas de tipos ativos
CREATE POLICY "backoffice_full_access" ON proposal_stages
  FOR ALL USING (
    (auth.jwt() ->> 'user_role') = ANY(ARRAY['super_admin', 'admin', 'financial', 'support'])
  );

CREATE POLICY "tenant_read_active_pipeline" ON proposal_stages
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM product_types pt
      WHERE pt.id = product_type_id
        AND pt.is_active = true
    )
    AND (auth.jwt() ->> 'tenant_id') IS NOT NULL
  );

-- stage_triggers: backoffice apenas — triggers são automações internas
CREATE POLICY "backoffice_full_access" ON stage_triggers
  FOR ALL USING (
    (auth.jwt() ->> 'user_role') = ANY(ARRAY['super_admin', 'admin', 'financial', 'support'])
  );
```

> **Importante:** Usar sempre `auth.jwt() ->> 'user_role'` (nunca `current_setting()`).
> O claim `user_role` é injetado no JWT pelo Auth Hook do Supabase.

***

## 🔌 **SUPABASE EDGE FUNCTIONS (Fastify)**

```
POST   /api/admin/product-types/:id/stages/batch-duplicate
GET    /api/admin/product-types/:id/stages?include_triggers=true
POST   /api/admin/product-types/:id/stages
PATCH  /api/admin/product-types/:id/stages/reorder
PATCH  /api/admin/product-types/:id/stages/:stageId
DELETE /api/admin/product-types/:id/stages/:stageId

POST   /api/admin/stages/:stageId/triggers
DELETE /api/admin/stages/:stageId/triggers/:triggerId
```

### **Exemplo: Duplicate (etapas vazias)**
```ts
POST /api/admin/product-types/fgts-uuid/stages/batch-duplicate
{
  "source_product_type_id": "inss-uuid"
}
// Response: stages criadas sem triggers
```

### **Exemplo: Reorder (dndkit)**
```ts
PATCH /api/admin/product-types/fgts-uuid/stages/reorder
{
  "order": ["stage1-uuid", "stage3-uuid", "stage2-uuid"]
}
```

***

## 🎨 **UI ADMIN (estrutura + componentes)**

### **Rota:** `/admin/product-types/[id]/pipeline`

```
📋 Product Type: FGTS                  [✏️ Editar] [⏸️ Inativo]
──────────────────────────────────────────────

🔄 Etapas do Pipeline (Arraste para reordenar)

┌─────────────────────────────────────────┐
│ 1️⃣ Proposta Iniciada                   │  ← dndkit Draggable
│    ⏰ Timeout: 3 dias ▼                 │
│    📡 Triggers:                         │
│       ├─ on_enter: n8n.com/w/123 [✏️] [🗑️]
│       └─ [+] Novo trigger               │
│                                         │
│ 2️⃣ Aguardando Documentos               │
│    ⏰ Sem timeout                       │
│    📡 Sem triggers                      │
│                                         │
│ [+] ➕ Nova Etapa                       │
└─────────────────────────────────────────┘

🔄 [Duplicar de: INSS ▼]    [💾 Salvar Tudo]
```

### **Componentes (shadcn + dndkit):**
```
ProductPipelinePage.tsx
├── ProductTypeHeader.tsx
├── PipelineStagesList.tsx          (DndContext)
│   ├── SortableStageCard.tsx       (@dnd-kit/sortable)
│   │   ├── StageTimeoutSelect.tsx
│   │   └── StageTriggersList.tsx
│   └── AddStageButton.tsx
├── DuplicateStagesDropdown.tsx
└── SavePipelineButton.tsx
```

### **dndkit Reorder Handler:**
```tsx
const handleDragEnd = async (event: DragEndEvent) => {
  const { active, over } = event
  if (over && active.id !== over.id) {
    const newOrder = arrayMove(stages, stages.findIndex(s => s.id === active.id), over.data.current.index)
    await reorderStages(productTypeId, newOrder.map(s => s.id))
  }
}
```

***

## ⚙️ **Validações & UX**

| **Campo** | **Validação** | **UX** |
|-----------|---------------|--------|
| Nome Etapa | 1-100 chars | InputDebounced |
| Order | Único por produto | Auto-increment |
| Timeout | minutes/hours/days + 1-99 | Select + NumberInput |
| Webhook | URL válida | TestButton |
| Payload | JSON válido | MonacoEditor (mini) |

**Timeout Options:** `Sem timeout`, `30 min`, `2h`, `1 dia`, `3 dias`, `7 dias`, `Custom`

***

## 🔄 **Fluxo Completo**

```
1. Admin → Product Types → FGTS → Pipeline
2. "Duplicar de INSS" → 3 etapas vazias criadas
3. Drag&drop reordena: Docs → Iniciada → Aprovada
4. Stage "Iniciada": timeout 3 dias + n8n trigger
5. Salvar → Disponível para todos tenants
6. Tenant ativa FGTS → propostas seguem pipeline
```

***

## 📱 **Integração n8n (futuro)**

**Payload padrão enviado:**
```json
{
  "event": "on_enter",
  "proposal_id": "uuid",
  "product_type": "FGTS",
  "stage": "Proposta Iniciada",
  "tenant_id": "uuid",
  "tenant_slug": "tenant1",
  "proposal_data": {...},
  "custom_payload": {...} // do trigger
}
```

***

## 🚀 **CHECKLIST IMPLEMENTAÇÃO**

```
✅ [ ] Migrations (4 SQL files)
✅ [ ] RLS Policies  
✅ [ ] Edge Functions (8 endpoints)
✅ [ ] Admin Page (/admin/product-types/[id]/pipeline)
✅ [ ] dndkit + shadcn Components (6)
✅ [ ] Duplicate/Reorder Logic
✅ [ ] Timeout Select + Trigger Form
✅ [ ] Playwright Tests (E2E CRUD)
✅ [ ] Supabase Studio Validation
```

### **Dependências instalar:**
```bash
pnpm add @dnd-kit/core @dnd-kit/sortable @dnd-kit/utilities
pnpm add @radix-ui/react-slot lucide-react
```
