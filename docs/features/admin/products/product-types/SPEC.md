# Feature Spec: Pipeline Configuration by Product Type

**Status:** ✅ **READY FOR IMPLEMENTATION**  
**Dependencies:** product_types (already exists), tenants (SPEC.md file:423)  

**App:** `apps/admin` — Vello Admin
**Module:** Admin / Product Types
**UI Terminology:** "Etapas da Esteira"
**Status:** `ready-for-dev`
**Priority:** High


***

## 🎯 **Objective**
Enable **flexible proposal pipeline configuration** by product type with **triggers for n8n automations**.

```
FGTS → [Proposta Iniciada → Ag. Docs → Aprovada] + triggers
INSS → [Simulação → Análise → Contrato] + different triggers
```

***

## 🗄️ **SUPABASE MODELS (Migrations)**

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

> **Note:** Timeout was moved to `stage_triggers` — configured per trigger, not per stage.

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

> **Note:** `timeout_unit` and `timeout_value` are relevant only for `on_timeout` triggers.
> They live in `stage_triggers` to allow multiple timeouts with different actions per stage.

### **Migration 004: proposals_timeline.sql** (future)
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

> **Important:** Always use `auth.jwt() ->> 'user_role'` (never `current_setting()`).
> The `user_role` claim is injected into the JWT by the Supabase Auth Hook.

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

### **Example: Duplicate (empty stages)**
```ts
POST /api/admin/product-types/fgts-uuid/stages/batch-duplicate
{
  "source_product_type_id": "inss-uuid"
}
// Response: stages criadas sem triggers
```

### **Example: Reorder (dndkit)**
```ts
PATCH /api/admin/product-types/fgts-uuid/stages/reorder
{
  "order": ["stage1-uuid", "stage3-uuid", "stage2-uuid"]
}
```

***

## 🎨 **ADMIN UI (structure + components)**

### **Route:** `/admin/product-types/[id]/pipeline`

```
📋 Product Type: FGTS                  [✏️ Edit] [⏸️ Inactive]
──────────────────────────────────────────────

🔄 Pipeline Stages (Drag to reorder)

┌─────────────────────────────────────────┐
│ 1️⃣ Proposta Iniciada                   │  ← dndkit Draggable
│    ⏰ Timeout: 3 days ▼                 │
│    📡 Triggers:                         │
│       ├─ on_enter: n8n.com/w/123 [✏️] [🗑️]
│       └─ [+] New trigger                │
│                                         │
│ 2️⃣ Aguardando Documentos               │
│    ⏰ No timeout                        │
│    📡 No triggers                       │
│                                         │
│ [+] ➕ New Stage                        │
└─────────────────────────────────────────┘

🔄 [Duplicate from: INSS ▼]    [💾 Save All]
```

### **Components (shadcn + dndkit):**
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

## ⚙️ **Validations & UX**

| **Field** | **Validation** | **UX** |
|-----------|---------------|--------|
| Stage Name | 1-100 chars | InputDebounced |
| Order | Unique per product | Auto-increment |
| Timeout | minutes/hours/days + 1-99 | Select + NumberInput |
| Webhook | Valid URL | TestButton |
| Payload | Valid JSON | MonacoEditor (mini) |

**Timeout Options:** `No timeout`, `30 min`, `2h`, `1 day`, `3 days`, `7 days`, `Custom`

***

## 🔄 **Full Flow**

```
1. Admin → Product Types → FGTS → Pipeline
2. "Duplicate from INSS" → 3 empty stages created
3. Drag & drop reorders: Docs → Iniciada → Aprovada
4. Stage "Iniciada": 3-day timeout + n8n trigger
5. Save → Available to all tenants
6. Tenant activates FGTS → proposals follow pipeline
```

***

## 📱 **n8n Integration (future)**

**Standard payload sent:**
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

## 🚀 **IMPLEMENTATION CHECKLIST**

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

### **Dependencies to install:**
```bash
pnpm add @dnd-kit/core @dnd-kit/sortable @dnd-kit/utilities
pnpm add @radix-ui/react-slot lucide-react
```
