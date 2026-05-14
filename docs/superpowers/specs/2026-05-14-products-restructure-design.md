# Design — Reestruturação de Produtos e Esteiras

**Data:** 2026-05-14
**App:** `apps/admin`
**Status:** Aprovado pelo usuário — pronto para plano de implementação

---

## Contexto

O módulo de produtos do admin possui duas entidades: `product_types` (tipos de produto) e `products` (instâncias com IF e comissões). A separação foi criada para permitir que múltiplos produtos compartilhem o mesmo pipeline, mas a nomenclatura "Tipos de Produto" gerou confusão conceitual: na prática, `product_types` é um agrupador de pipeline, não um conceito de negócio.

Esta spec reestrutura a UI e o banco para refletir o modelo mental correto:
- **Produtos** = entidade de negócio (ex: "FGTS – QI Tech")
- **Esteiras** = configuração de fluxo/pipeline (ex: "FGTS")

---

## Produtos cadastrados (escopo imediato)

### Pessoa Física
| # | Nome | Slug esteira |
|---|---|---|
| 01 | FGTS | `fgts` |
| 02 | Consignado CLT | `consignado_privado` |
| 03 | Auto Equity (Empréstimo com Veículo em Garantia) | `auto_equity` |
| 04 | CGI PF (Empréstimo com Imóvel em Garantia) | `home_equity` |

### Pessoa Jurídica
| # | Nome | Slug esteira |
|---|---|---|
| 05 | Capital de Giro | `capital_giro` |
| 06 | Antecipação de Recebíveis | `antecipacao_recebiveis` |
| 07 | CGI PJ (Empréstimo com Imóvel em Garantia) | `home_equity` |

> CGI PF e CGI PJ compartilham a mesma esteira (`home_equity`) pois o pipeline é idêntico. A distinção é feita pela categoria do produto.

### Financiamentos
| # | Nome | Slug esteira |
|---|---|---|
| 08 | Financiamento Imobiliário | `financiamento_imovel` |
| 09 | Financiamento de Veículos | `financiamento_veiculo` |

---

## Decisões de design

| Questão | Decisão |
|---|---|
| Pipeline por tipo ou por produto? | Por esteira (product_type) — pipeline é idêntico independente da IF |
| CGI PF e CGI PJ — esteiras separadas? | Não — mesma esteira, produtos distintos com categorias diferentes |
| Onde vive `category`? | Em `products` (migrada de `product_types`) |
| Nomenclatura UI | "Esteiras" (antes "Tipos de Produto") |
| URL | `/pipelines` (antes `/product-types`) — sem redirect |
| Campos extras por etapa | Fora do escopo desta spec — definir em spec futura |

---

## Banco de dados

### Migration: mover `category` de `product_types` para `products`

```sql
-- Adicionar category em products
ALTER TABLE products
  ADD COLUMN category TEXT CHECK (
    category IN ('pessoa_fisica', 'pessoa_juridica', 'financiamentos')
  ) NOT NULL DEFAULT 'pessoa_fisica';

-- Popular a partir da esteira vinculada
UPDATE products p
  SET category = pt.category
  FROM product_types pt
  WHERE p.product_type_id = pt.id
    AND pt.category IS NOT NULL;

-- Remover de product_types
ALTER TABLE product_types DROP COLUMN category;
```

### Esteiras órfãs após a migração

As esteiras `home_equity_pj` e `auto_equity_pj` existem hoje como product_types separados para variantes PJ. Com CGI PJ passando a usar a esteira `home_equity`, elas ficam sem produtos vinculados. Devem ser desativadas (não deletadas, para preservar histórico de proposals).

A remoção física dessas esteiras é opcional e pode ser feita manualmente no Supabase Studio após confirmar que não há `proposal_stages` em uso.

### Sem outras alterações no banco

`proposal_stages`, `stage_triggers`, `product_financial_partners` — sem alteração.

---

## Navegação (menu lateral do admin)

```
Produtos      → /products
Esteiras      → /pipelines
```

A rota `/product-types` é simplesmente renomeada para `/pipelines` no sistema de arquivos Next.js (`app/(private)/pipelines/`). Sem redirect — é um painel interno.

---

## Página `/products`

### Layout

Tabs no topo da página:

```
[ Pessoa Física ]  [ Pessoa Jurídica ]  [ Financiamentos ]
```

### Tabela (dentro de cada tab)

| Coluna | Descrição |
|---|---|
| Nome | Ex: "CGI – QI Tech" |
| Instituições Financeiras | Badges das IFs vinculadas |
| Esteira | Badge com nome da esteira, linkável para `/pipelines/[id]/pipeline` |
| Status | Ativo / Inativo |
| Ações | Editar · Desativar |

### Filtros

Busca por nome dentro de cada tab.

---

## Formulário de produto (`/products/new` e `/products/[id]/edit`)

### Seção 1 — Identificação

| Campo | Obrigatório | Observação |
|---|---|---|
| Nome | Sim | Ex: "FGTS – QI Tech" |
| Categoria | Sim | Select: Pessoa Física / Pessoa Jurídica / Financiamentos |
| Descrição Pública | Não | Máx 500 chars |
| Descrição Interna | Não | Rich text |

### Seção 2 — Parâmetros de Crédito

Sem alteração: Valor Mín/Máx · Prazo Mín/Máx · Taxa Mín/Máx.

### Seção 3 — Instituições Financeiras

Sem alteração: checkboxes com comissões por IF.

### Seção 4 — Esteira *(novo)*

- Select: "Qual modelo de pipeline este produto segue?"
- Lista apenas esteiras ativas
- Abaixo do select: preview das etapas da esteira selecionada (somente leitura)
- Link "Editar esta esteira →" abre `/pipelines/[id]/pipeline` em nova aba
- Campo obrigatório

---

## Página `/pipelines` (antes `/product-types`)

### Lista de esteiras

| Coluna | Descrição |
|---|---|
| Nome | Ex: "FGTS", "CGI", "Auto Equity" |
| Etapas | Número de etapas configuradas |
| Produtos | Quantos produtos usam esta esteira |
| Status | Ativo / Inativo |
| Ações | Editar pipeline · Duplicar · Desativar |

**Duplicar esteira:** cria uma nova esteira com as mesmas etapas (sem triggers) — funcionalidade existente, apenas renomeada.

### Sub-rota `/pipelines/[id]/pipeline`

Editor de pipeline — sem alteração funcional. Mesmos componentes dndkit, triggers n8n, reordenação.

---

## O que não muda

- Editor de pipeline e todos seus componentes (`pipeline-editor.tsx`, `sortable-stage-card.tsx`, etc.)
- `proposal_stages` e `stage_triggers` — tabelas e RLS intactos
- Comissões, IFs, parâmetros de crédito
- Lógica de isolamento de tenant para leitura de esteiras
- Campos extras por etapa — spec futura

---

## Arquivos a criar / renomear

```
apps/admin/src/app/(private)/
├── pipelines/                        ← renomeado de product-types/
│   ├── page.tsx                      ← atualizar labels e queries
│   ├── new/page.tsx
│   ├── [id]/
│   │   ├── edit/page.tsx
│   │   └── pipeline/                 ← sem alteração funcional
│   ├── actions.ts
│   └── queries.ts                    ← remover filtro por category
└── products/
    ├── page.tsx                      ← adicionar tabs por category
    ├── new/page.tsx                  ← adicionar campo category + seção esteira
    ├── [id]/edit/page.tsx            ← idem
    ├── queries.ts                    ← adicionar category no select
    └── _components/
        ├── product-table.tsx         ← receber tab ativa como prop
        └── product-form.tsx          ← seção 1 + seção 4 atualizadas

supabase/migrations/
└── YYYYMMDDHHMMSS_move_category_to_products.sql
```

---

## Restrições de implementação

- `page.tsx` é Server Component — tabs implementadas via `searchParams` (ex: `?tab=pessoa_juridica`), com `Pessoa Física` como padrão
- `category` no formulário é um campo controlado no Client Component
- A seção "Esteira" do formulário faz fetch das esteiras ativas via Server Component (passadas como prop)
- Queries de `product_types` que hoje filtram por `category` devem ser removidas ou ignoradas após a migration
