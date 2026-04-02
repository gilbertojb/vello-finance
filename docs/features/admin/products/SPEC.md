# Feature Spec — Produtos de Crédito

**App:** `apps/admin` — Vello Admin
**Módulo:** Admin / Produtos
**Status:** `ready-for-dev`
**Prioridade:** Alta
**Depende de:** `financial_partners` cadastrados

---

## F0 — Correspondentes Bancários · `/financial-partners`

CRUD com campos: Nome · Tipo (`qi_tech`, `bancly`, `zip`, `other`) · URL da API · Chave de API (masked) · Webhook Secret (masked) · Ativo

> Chave de API e Webhook Secret visíveis apenas para `super_admin`.

---

## F1 — Listagem · `/products`

Tabela: Nome · Tipo · Parceiro · Comissão Banco · Retenção Vello · Disponível Tenant · Status · Ações

Filtros: Tipo · Parceiro · Status

---

## F2 — Criar · `/products/new`

**Seção 1 — Identificação**

| Campo | Obrigatório | Validação |
|---|---|---|
| Nome | Sim | 3–100 chars |
| Tipo | Sim | `fgts` / `consignado_publico` / `consignado_privado` / `home_equity` / `auto_equity` / `outros` |
| Descrição | Não | Máx 500 chars |
| Parceiro Bancário | Não | Lista de parceiros ativos |

**Seção 2 — Parâmetros de Crédito**

Valor Mínimo/Máximo (R$) · Prazo Mínimo/Máximo (meses) · Taxa Mínima/Máxima ao Mês (%)

**Seção 3 — Comissionamento**

| Campo | Editável | Validação |
|---|---|---|
| Comissão do Banco (%) | Sim | 0,0001–100 |
| Retenção Vello (%) | Sim | ≤ Comissão do Banco |
| Disponível ao Tenant (%) | Não (calculado) | Banco − Vello |

Preview em tempo real da cascata:
```
Banco paga à Vello:       10,0000%
Vello retém:             −  5,0000%
─────────────────────────────────
Disponível ao Tenant:      5,0000%
```

**Aceite:**
- [ ] "Disponível ao Tenant" atualiza em tempo real
- [ ] Erro se Retenção Vello > Comissão Banco

---

## F3 — Editar · `/products/[id]/edit`
- Todos os campos editáveis, exceto Tipo (read-only)
- Aviso: *"Alterações nos percentuais não afetam propostas já criadas (snapshots imutáveis)"*

---

## F4 — Desativar / Reativar
- Modal exibe quantos tenants têm o produto ativo
- Desativar não remove automaticamente dos tenants existentes

---

## F5 — Detalhes · `/products/[id]`
- Dados completos + cascata de comissão visual
- Lista de tenants com o produto habilitado (e comissões individuais de cada um)

---

## Componente Compartilhado: `<CommissionCascade />`

Reutilizado em: formulário de produto · detalhes do produto · gerenciador de produtos do tenant.

```tsx
// apps/admin/components/commissions/CommissionCascade.tsx
type Props = {
  bankPct: number
  velloPct: number
  tenantPct?: number      // opcional — exibido na camada do tenant
  velloSpreadPct?: number // opcional
}
```

---

## Arquivos a Criar

```
apps/admin/app/(app)/
├── financial-partners/
│   ├── page.tsx
│   ├── new/page.tsx
│   ├── [id]/edit/page.tsx
│   ├── actions.ts
│   └── queries.ts
└── products/
    ├── page.tsx
    ├── new/page.tsx
    ├── [id]/
    │   ├── page.tsx
    │   └── edit/page.tsx
    ├── actions.ts
    ├── queries.ts
    └── _components/
        ├── ProductTable.tsx
        ├── ProductForm.tsx
        ├── ProductTypeBadge.tsx
        └── CommissionCascade.tsx

supabase/migrations/
├── 20260401100000_create_financial_partners.sql
└── 20260401110000_create_products.sql
```
## Restrições de implementação

- `page.tsx` é Server Component — busca dados diretamente no Supabase server client
- `_components/product-table.tsx` é Client Component — recebe `products` via props, sem acesso ao banco
- `actions.ts` usa `'use server'` — único ponto de mutação, nunca exportar para o cliente
- `queries.ts` é importado apenas por Server Components e Actions — nunca por Client Components