# Feature Spec — Produtos de Crédito

**App:** `apps/admin` — Vello Admin
**Módulo:** Admin / Produtos
**Status:** `ready-for-dev`
**Prioridade:** Alta
**Depende de:** `financial_partners` cadastrados

---

## F0 — Instituições Financeiras · `/financial-partners`

CRUD com campos: Nome · Tipo (`qi_tech`, `bancly`, `zip`, `other`) · URL da API · Chave de API (masked) · Webhook Secret (masked) · Ativo

> Chave de API e Webhook Secret visíveis apenas para `super_admin`.

---

## F1 — Listagem · `/products`

Tabela: Nome · Tipo · Instituições Financeiras (lista) · Retenção Vello (por IF) · Disponível Tenant · Status · Ações

Filtros: Tipo · Instituição Financeira · Status

---

## F2 — Criar · `/products/new`

**Seção 1 — Identificação**

| Campo | Obrigatório | Validação |
|---|---|---|
| Nome | Sim | 3–100 chars |
| Tipo | Sim | `fgts` / `consignado_publico` / `consignado_privado` / `home_equity` / `auto_equity` / `outros` |
| Descrição Pública | Não | Máx 500 chars (rich text) |
| Descrição Interna | Não | Rich text |

**Seção 2 — Parâmetros de Crédito**

Valor Mínimo/Máximo (R$) · Prazo Mínimo/Máximo (meses) · Taxa Mínima/Máxima ao Mês (%)

**Seção 3 — Instituições Financeiras**

Lista de checkboxes com todas as IFs ativas. Para cada IF marcada, dois campos inline:

| Campo | Obrigatório | Validação |
|---|---|---|
| IF paga à Vello (%) | Sim (se IF marcada) | 0,01–100 |
| Retenção Vello (%) | Sim (se IF marcada) | ≤ IF paga à Vello |

> A comissão disponível ao tenant = IF paga à Vello − Retenção Vello, e varia por IF.

**Aceite:**
- [ ] Campos de comissão aparecem apenas para IFs marcadas
- [ ] Erro se Retenção Vello > IF paga à Vello em qualquer IF selecionada
- [ ] Produto pode ser salvo sem nenhuma IF vinculada

---

## F3 — Editar · `/products/[id]/edit`
- Todos os campos editáveis, exceto Tipo (read-only)
- IFs podem ser adicionadas ou removidas; comissões podem ser editadas por IF
- Aviso: *"Alterações nos percentuais não afetam propostas já criadas (snapshots imutáveis)"*

---

## F4 — Desativar / Reativar
- Modal exibe quantos tenants têm o produto ativo
- Desativar não remove automaticamente dos tenants existentes

---

## F5 — Detalhes · `/products/[id]`
- Dados completos
- Tabela de IFs vinculadas com os respectivos percentuais de comissão
- Lista de tenants com o produto habilitado (e comissões individuais de cada um)

---

## Componente Compartilhado: `<CommissionCascade />`

Utilizado na página de **detalhes do produto** (por IF) e no gerenciador de produtos do tenant. Não é mais exibido no formulário de criação/edição.

```tsx
// apps/admin/src/components/commissions/commission-cascade.tsx
type Props = {
  ifPct: number            // renomeado de bankPct
  velloPct: number
  tenantPct?: number       // opcional — exibido na camada do tenant
  velloSpreadPct?: number  // opcional
}
```

---

## Arquivos a Criar / Alterar

```
apps/admin/src/app/(private)/
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
        ├── product-table.tsx
        ├── product-form.tsx
        ├── product-type-badge.tsx
        └── commission-cascade.tsx

supabase/migrations/
├── YYYYMMDDHHMMSS_create_product_financial_partners.sql
└── YYYYMMDDHHMMSS_alter_products_remove_commission_columns.sql
```

## Restrições de Implementação

- `page.tsx` é Server Component — busca dados diretamente no Supabase server client
- `_components/product-table.tsx` é Client Component — recebe `products` via props, sem acesso ao banco
- `actions.ts` usa `'use server'` — único ponto de mutação, nunca exportar para o cliente
- `queries.ts` é importado apenas por Server Components e Actions — nunca por Client Components
