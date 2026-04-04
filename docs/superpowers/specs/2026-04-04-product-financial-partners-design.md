# Design — Produtos com N Instituições Financeiras

**Data:** 2026-04-04
**App:** `apps/admin` — Vello Admin
**Módulo:** Admin / Produtos + Instituições Financeiras
**Status:** `approved`

---

## Contexto

Originalmente um produto tinha exatamente uma instituição financeira (FK direto em `products`) e as regras de comissão (`bank_commission_pct`, `vello_commission_pct`) eram atributos do produto.

A nova regra de negócio determina que:
- Um produto pode ser operado por **N instituições financeiras**
- A comissão é negociada **por par produto + IF** — a mesma IF pode oferecer 3% no FGTS e 5% no Consignado

---

## Modelo de Dados

### Nova tabela `product_financial_partners`

```sql
CREATE TABLE product_financial_partners (
  id                   UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id           UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  financial_partner_id UUID NOT NULL REFERENCES financial_partners(id),
  if_commission_pct    NUMERIC(6,2) NOT NULL,  -- % que a IF paga à Vello
  vello_commission_pct NUMERIC(6,2) NOT NULL,  -- % que a Vello retém
  is_active            BOOLEAN NOT NULL DEFAULT true,
  created_at           TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at           TIMESTAMPTZ NOT NULL DEFAULT now(),

  UNIQUE(product_id, financial_partner_id),
  CONSTRAINT commission_valid CHECK (vello_commission_pct <= if_commission_pct)
);
```

### Alterações em `products`

Remover as colunas:
- `financial_partner_id` — substituída pela tabela de junção N:N
- `bank_commission_pct` — movida para `product_financial_partners.if_commission_pct`
- `vello_commission_pct` — movida para `product_financial_partners.vello_commission_pct`

### Terminologia

| Antes | Depois |
|---|---|
| `bank_commission_pct` | `if_commission_pct` |
| "Comissão do Banco" | "Comissão da IF" |
| "Parceiro Bancário" | "Instituição Financeira" |

### Impacto em `commission_snapshots`

A coluna `bank_commission_pct` é renomeada para `if_commission_pct`. O snapshot continua sendo append-only. A fonte dos valores passa a ser `product_financial_partners` (não mais `products`).

Uma proposta precisará referenciar qual IF específica foi utilizada para que o trigger consiga capturar os percentuais corretos.

---

## Formulário de Produto

### Removido
- Card **Comissionamento & Rentabilidade** (campos `bank_commission_pct` e `vello_commission_pct`)
- Campo select **Parceiro Bancário** (seleção única)
- Componente `<CommissionCascade />` no formulário de produto

### Adicionado
Card **Instituições Financeiras** com lista de checkboxes das IFs ativas. Para cada IF selecionada, dois campos simples são exibidos inline:

```
[ ] QI Tech
[x] Bancly
      IF paga à Vello (%): [ 10.00 ]
      Retenção Vello (%):  [  5.00 ]
[ ] Zip
```

**Validações:**
- Campos de comissão obrigatórios quando a IF está marcada
- `vello_commission_pct ≤ if_commission_pct` por IF
- Pelo menos uma IF pode ser deixada sem seleção (produto sem IF vinculada é permitido)

---

## Arquivos Impactados

### Migrations (novas)
```
supabase/migrations/
├── YYYYMMDDHHMMSS_create_product_financial_partners.sql
└── YYYYMMDDHHMMSS_alter_products_remove_commission_columns.sql
```

### Apps
```
apps/admin/src/app/(private)/products/
├── actions.ts         — schema Zod inclui parceiros[]; insert em product_financial_partners
├── queries.ts         — join com product_financial_partners; remove join direto com financial_partners
├── page.tsx           — passa lista de IFs para o formulário
└── _components/
    └── product-form.tsx — remove card de comissão; adiciona card de IFs com checkboxes
```

### Docs a atualizar
- `docs/features/admin/products/SPEC.md`
- `docs/features/admin/commissions/SPEC.md`
- `docs/architecture/database-schema.md`

---

## Restrições de Implementação

- `page.tsx` é Server Component — busca produtos e IFs diretamente no Supabase server client
- `product-form.tsx` é Client Component — recebe `partners` via props, sem acesso ao banco
- `actions.ts` usa `'use server'` — insere em `products` e em `product_financial_partners` na mesma operação (ou em sequência, sem transação explícita no MVP)
- `queries.ts` importado apenas por Server Components e Actions
