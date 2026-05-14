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
| 07 | CGI PJ (Empréstimo com Imóvel em Garantia) | `home_equity_pj` |

> CGI PF e CGI PJ usam esteiras separadas pois terão campos e documentos diferentes por etapa.

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
| CGI PF e CGI PJ — esteiras separadas? | Sim — esteiras distintas (`home_equity` e `home_equity_pj`) pois terão campos/documentos diferentes por etapa |
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

Lista única com todos os produtos. Filtros na parte superior:

| Filtro | Tipo | Valores |
|---|---|---|
| Categoria | Select | Todos · Pessoa Física · Pessoa Jurídica · Financiamentos |
| Status | Select | Todos · Ativo · Inativo |
| Busca | Text | Filtra por nome do produto |

Filtros implementados via `searchParams` — a página é um Server Component.

### Tabela

| Coluna | Descrição |
|---|---|
| Nome | Ex: "CGI PF – QI Tech" |
| Categoria | Badge: Pessoa Física / Pessoa Jurídica / Financiamentos |
| Instituições Financeiras | Badges das IFs vinculadas |
| Esteira | Badge com nome da esteira, linkável para `/pipelines/[id]/pipeline` |
| Status | Ativo / Inativo |
| Ações | Editar · Desativar |

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
    ├── page.tsx                      ← lista única com filtros por category/status
    ├── new/page.tsx                  ← adicionar campo category + seção esteira
    ├── [id]/edit/page.tsx            ← idem
    ├── queries.ts                    ← adicionar category no select
    └── _components/
        ├── product-table.tsx         ← receber filtros ativos como props
        └── product-form.tsx          ← seção 1 + seção 4 atualizadas

supabase/migrations/
└── YYYYMMDDHHMMSS_move_category_to_products.sql
```

---

## Restrições de implementação

- `page.tsx` é Server Component — filtros implementados via `searchParams` (ex: `?category=pessoa_juridica&status=active`)
- `category` no formulário é um campo controlado no Client Component
- A seção "Esteira" do formulário faz fetch das esteiras ativas via Server Component (passadas como prop)
- Queries de `product_types` que hoje filtram por `category` devem ser removidas ou ignoradas após a migration
