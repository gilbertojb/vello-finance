# Design: Simulador de Crédito — Vello Store

**Data:** 2026-05-13
**App:** `apps/store`
**Status:** Aprovado — aguardando implementação

---

## Visão Geral

Implementação completa do simulador de crédito multiproduto na Vello Store. O simulador é um funil de 3 etapas (seleção de categoria → formulário do produto → resultado com cálculo), sem autenticação, acessível publicamente pelo cliente final.

Esta spec cobre 10 novos fluxos de produto, correção de segurança no fluxo `home-equity` existente, adição de utilitários compartilhados e migrations para os novos `product_types`.

---

## Arquitetura

### Passagem de dados entre form e resultado

**Padrão adotado: `sessionStorage`**

- A URL do resultado contém apenas `?productId={uuid}` — nenhum dado PII
- Ao submeter o formulário, o Client Component grava os dados em `sessionStorage['sim:{slug}']` (ex: `sim:auto-equity`)
- A página de resultado é um **Server Component** que busca o produto no banco pelo `productId` e passa como props para o Client Component de cálculo
- O Client Component lê `sessionStorage`, calcula e exibe. Se o storage estiver vazio (acesso direto à URL sem passar pelo form), redireciona para o formulário correspondente
- Dados PII (nome, whatsapp) ficam apenas em memória de sessão — não aparecem em URLs, logs de servidor ou analytics

**Correção:** o fluxo `home-equity` existente passa `nome` e `whatsapp` via URL searchParams. Será migrado para `sessionStorage` junto com os demais.

### Fat Server / Thin Client

- Pages de formulário: Server Components (buscam produto do banco via `getTenantProduct`)
- Forms: Client Components (`'use client'`) — calculam LTV em tempo real, gravam sessionStorage, navegam
- Pages de resultado: Server Components (buscam produto do banco, passam taxa como prop)
- Componentes de resultado: Client Components — leem sessionStorage, calculam PMT/SAC, exibem

### Compartilhamento de código (Abordagem B)

`HomeEquityForm` e `AutoEquityForm` aceitam `isPj?: boolean`:
- `isPj=false` (default): chip "Pessoa Física", sem campo de CNPJ no simulador
- `isPj=true`: chip "Pessoa Jurídica", sem campo de CNPJ no simulador (o CNPJ é coletado apenas no fluxo de contratação, fora do escopo desta spec)

Todos os outros produtos têm componentes independentes.

---

## Utilitários Compartilhados (`simulator.ts`)

### Adições ao arquivo existente

```ts
// Taxas mensais fixas por product_type slug
export const MONTHLY_RATES: Record<string, number> = {
  home_equity:             1.19,
  home_equity_pj:          1.19,
  auto_equity:             2.30,
  auto_equity_pj:          2.30,
  financiamento_imovel:    1.00,
  financiamento_veiculo:   2.30,
  capital_giro:            4.50,
  antecipacao_recebiveis:  4.50,
  emprestimo_pessoal:      3.50, // provisório — definir com time financeiro
  conta_luz:               3.00, // provisório — definir com time financeiro
  fgts:                    1.70, // apenas informativo, não entra em PMT
}

// SAC: retorna primeira e última parcela
export function calcSAC(
  principal: number,
  rateMonthly: number,
  nper: number,
): { first: number; last: number; amortization: number } {
  const r = rateMonthly / 100
  const amortization = principal / nper
  return {
    amortization,
    first: amortization + principal * r,
    last:  amortization + amortization * r,
  }
}
```

`calcPMT`, `formatCurrency`, `formatRate`, `calcCETAnual` e `generateTermOptions` permanecem sem alteração.

---

## Migrations

### `20260513120000_add_missing_product_types.sql`

Adiciona os 8 `product_types` que existem nas rotas mas não no banco:

```sql
INSERT INTO product_types (name, slug) VALUES
  ('Home Equity PJ',            'home_equity_pj'),
  ('Auto Equity PJ',            'auto_equity_pj'),
  ('Capital de Giro',           'capital_giro'),
  ('Antecipação de Recebíveis', 'antecipacao_recebiveis'),
  ('Financiamento Imobiliário', 'financiamento_imovel'),
  ('Financiamento de Veículo',  'financiamento_veiculo'),
  ('Empréstimo Pessoal',        'emprestimo_pessoal'),
  ('Crédito na Conta de Luz',   'conta_luz');
```

---

## Atualizações nos Seletores Existentes

### `pessoa-fisica/page.tsx`
- **Adicionar:** `emprestimo_pessoal` → `/simulador/pessoa-fisica/emprestimo-pessoal`
- **Adicionar:** `conta_luz` → `/simulador/pessoa-fisica/conta-luz`
- **Remover:** `consignado_privado` (fluxo completo incluindo contratação — fora do escopo)

### `pessoa-juridica/page.tsx`
Sem alterações — slugs e rotas já mapeados corretamente.

### `financiamentos/page.tsx`
Sem alterações — slugs e rotas já mapeados corretamente.

---

## Fluxos de Produto

### Convenção de rotas

```
/simulador/{categoria}/{slug}/              ← form (Server Component + Client Form)
/simulador/{categoria}/{slug}/resultado/    ← resultado (Server Component + Client Calc)
```

URL de resultado contém apenas `?productId={uuid}`.
Dados do form em `sessionStorage['sim:{slug}']`.

---

### PF — Auto Equity (`/simulador/pessoa-fisica/auto-equity`)

**Campos do formulário:**
| Campo | Tipo | Validação |
|---|---|---|
| Nome completo | text | ≥ 2 palavras |
| WhatsApp | tel | ≥ 10 dígitos |
| Valor do veículo (FIPE) | currency | ≥ R$ 10.000 |
| Valor do crédito | currency | ≤ 90% do veículo; ajuste automático com aviso |
| Parcelas | select | 15, 25, 35, 45, 60, 90 |

**sessionStorage key:** `sim:auto-equity`

**Resultado:**
- Modalidade: somente Price
- Taxa: 2,3% a.m.
- Exibe: parcela, LTV %, CET anual
- CTA: "Quero contratar este crédito" → `/solicitar/{productId}`

---

### PF — FGTS (`/simulador/pessoa-fisica/fgts`)

**Campos do formulário:**
| Campo | Tipo | Validação |
|---|---|---|
| Nome completo | text | ≥ 2 palavras |
| WhatsApp | tel | ≥ 10 dígitos |
| Saldo aproximado do FGTS | currency | > 0 |

**sessionStorage key:** `sim:fgts`

**Resultado especial (sem PMT):**
- Estimativa = 75% do saldo informado
- Taxa informativa: 1,7% a.m.
- Prazo máximo: 10 anos (120 meses)
- Exibe: valor estimado de antecipação, taxa e prazo informativo
- Aviso: "Valor estimado sujeito a análise e saldo verificado na CEF"
- CTA: "Quero contratar" → `/solicitar/{productId}`

---

### PF — Empréstimo Pessoal (`/simulador/pessoa-fisica/emprestimo-pessoal`)

**Campos do formulário:**
| Campo | Tipo | Validação |
|---|---|---|
| Nome completo | text | ≥ 2 palavras |
| WhatsApp | tel | ≥ 10 dígitos |
| Valor desejado | currency | > 0 e ≤ R$ 10.000 |
| Parcelas | select | 6, 12, 18, 24, 36, 48 |

**sessionStorage key:** `sim:emprestimo-pessoal`

**Resultado:**
- Modalidade: Price
- Taxa: 3,5% a.m. *(provisório)*
- CTA: "Quero contratar" → `/solicitar/{productId}`

---

### PF — Crédito na Conta de Luz (`/simulador/pessoa-fisica/conta-luz`)

**Campos do formulário:**
| Campo | Tipo | Validação |
|---|---|---|
| Nome completo | text | ≥ 2 palavras |
| WhatsApp | tel | ≥ 10 dígitos |
| Distribuidora | select | Enel, CPFL, Light, Cemig, Coelba, Energisa, Equatorial, Outras |
| Valor desejado | currency | > 0 e ≤ R$ 2.100 |
| Parcelas | select | 6, 12, 18, 24 |

**sessionStorage key:** `sim:conta-luz`

**Resultado:**
- Modalidade: Price
- Taxa: 3,0% a.m. *(provisório)*
- CTA: "Quero contratar" → `/solicitar/{productId}`

---

### PJ — Home Equity PJ (`/simulador/pessoa-juridica/home-equity-pj`)

Reutiliza `HomeEquityForm` com `isPj={true}`:
- Chip: "Pessoa Jurídica" (em vez de "Pessoa Física")
- Regras idênticas: LTV 50%, mín. R$ 150k, taxa 1,19%
- Resultado: SAC / Price igual ao PF

**sessionStorage key:** `sim:home-equity-pj`

---

### PJ — Auto Equity PJ (`/simulador/pessoa-juridica/auto-equity-pj`)

Reutiliza `AutoEquityForm` com `isPj={true}`:
- Chip: "Pessoa Jurídica"
- Regras idênticas: LTV 90%, mín. R$ 10k, taxa 2,3%
- Parcelas: 15, 25, 35, 45, 60, 90

**sessionStorage key:** `sim:auto-equity-pj`

---

### PJ — Antecipação de Recebíveis (`/simulador/pessoa-juridica/antecipacao-recebiveis`)

**Campos do formulário:**
| Campo | Tipo | Validação |
|---|---|---|
| Nome completo | text | ≥ 2 palavras |
| WhatsApp | tel | ≥ 10 dígitos |
| Valor total de recebíveis | currency | > 0 |
| Tipo de recebível | select | Cartão de Crédito, Boleto, NF-e, Contrato, Duplicata |
| Valor de crédito desejado | currency | ≤ 100% dos recebíveis; ajuste automático com aviso |
| Parcelas | select | 6, 12, 18, 24 |

**sessionStorage key:** `sim:antecipacao-recebiveis`

**Resultado:**
- Modalidade: Price
- Taxa: 4,5% a.m.
- CTA: "Quero contratar" → `/solicitar/{productId}`

---

### PJ — Capital de Giro (`/simulador/pessoa-juridica/capital-giro`)

**Campos do formulário:**
| Campo | Tipo | Validação |
|---|---|---|
| Nome completo | text | ≥ 2 palavras |
| WhatsApp | tel | ≥ 10 dígitos |
| Valor desejado | currency | > 0 |
| Parcelas | select | 12, 24, 36, 48 |

**sessionStorage key:** `sim:capital-giro`

**Resultado:**
- Modalidade: Price
- Taxa: 4,5% a.m.
- CTA: "Quero contratar" → `/solicitar/{productId}`

---

### Financiamento — Imóvel (`/simulador/financiamentos/imovel`)

**Campos do formulário:**
| Campo | Tipo | Validação |
|---|---|---|
| Nome completo | text | ≥ 2 palavras |
| WhatsApp | tel | ≥ 10 dígitos |
| Valor do imóvel | currency | ≥ R$ 150.000 |
| Valor de entrada | currency | ≥ 20% do imóvel; < valor do imóvel |
| Parcelas | select | 60, 120, 180, 240, 300, 360 |

Valor financiado = imóvel − entrada (exibido em tempo real).
Aviso se entrada < 20%: "Entrada mínima de 20% do valor do imóvel".

**sessionStorage key:** `sim:financiamento-imovel`

**Resultado:**
- Modalidade: Price
- Taxa: 1,0% a.m.
- Exibe: valor financiado, entrada, parcela, LTV %
- CTA: "Quero contratar" → `/solicitar/{productId}`

---

### Financiamento — Veículo (`/simulador/financiamentos/veiculo`)

**Campos do formulário:**
| Campo | Tipo | Validação |
|---|---|---|
| Nome completo | text | ≥ 2 palavras |
| WhatsApp | tel | ≥ 10 dígitos |
| Valor do veículo (FIPE) | currency | ≥ R$ 10.000 |
| Valor de entrada | currency | ≥ 30% do veículo; < valor do veículo |
| Parcelas | select | 12, 24, 36, 48, 60 |

Valor financiado = veículo − entrada (exibido em tempo real).
Aviso se entrada < 30%: "Entrada mínima de 30% do valor do veículo".

**sessionStorage key:** `sim:financiamento-veiculo`

**Resultado:**
- Modalidade: Price
- Taxa: 2,3% a.m.
- Exibe: valor financiado, entrada, parcela, LTV %
- CTA: "Quero contratar" → `/solicitar/{productId}`

---

## Correção do Home Equity Existente

O fluxo `home-equity` existente passa `nome` e `whatsapp` via URL. Será migrado para `sessionStorage['sim:home-equity']` na mesma entrega.

**Alterações necessárias:**
- `home-equity-form.tsx`: remover `nome` e `whatsapp` de `params`, gravar em sessionStorage antes de navegar
- `home-equity/resultado/page.tsx`: remover `nome` e `whatsapp` de `searchParams`
- `home-equity-resultado.tsx`: ler do sessionStorage em vez de receber via props

---

## Estrutura de Arquivos Completa

```
apps/store/src/app/(store)/simulador/
├── pessoa-fisica/
│   ├── page.tsx                                    ← atualizar labels/rotas
│   ├── home-equity/                                ← corrigir sessionStorage
│   │   ├── page.tsx
│   │   ├── _components/home-equity-form.tsx        ← add isPj prop, sessionStorage
│   │   └── resultado/
│   │       ├── page.tsx
│   │       └── _components/home-equity-resultado.tsx ← ler sessionStorage
│   ├── auto-equity/
│   │   ├── page.tsx
│   │   ├── _components/auto-equity-form.tsx        ← novo, isPj prop
│   │   └── resultado/
│   │       ├── page.tsx
│   │       └── _components/auto-equity-resultado.tsx
│   ├── fgts/
│   │   ├── page.tsx
│   │   ├── _components/fgts-form.tsx
│   │   └── resultado/
│   │       ├── page.tsx
│   │       └── _components/fgts-resultado.tsx
│   ├── emprestimo-pessoal/
│   │   ├── page.tsx
│   │   ├── _components/emprestimo-pessoal-form.tsx
│   │   └── resultado/
│   │       ├── page.tsx
│   │       └── _components/emprestimo-pessoal-resultado.tsx
│   └── conta-luz/
│       ├── page.tsx
│       ├── _components/conta-luz-form.tsx
│       └── resultado/
│           ├── page.tsx
│           └── _components/conta-luz-resultado.tsx
│
├── pessoa-juridica/
│   ├── page.tsx                                    ← sem alteração
│   ├── home-equity-pj/
│   │   ├── page.tsx
│   │   └── resultado/
│   │       ├── page.tsx
│   │       └── _components/home-equity-pj-resultado.tsx ← reutiliza HomeEquityResultado
│   ├── auto-equity-pj/
│   │   ├── page.tsx
│   │   └── resultado/
│   │       ├── page.tsx
│   │       └── _components/auto-equity-pj-resultado.tsx ← reutiliza AutoEquityResultado
│   ├── antecipacao-recebiveis/
│   │   ├── page.tsx
│   │   ├── _components/antecipacao-recebiveis-form.tsx
│   │   └── resultado/
│   │       ├── page.tsx
│   │       └── _components/antecipacao-recebiveis-resultado.tsx
│   └── capital-giro/
│       ├── page.tsx
│       ├── _components/capital-giro-form.tsx
│       └── resultado/
│           ├── page.tsx
│           └── _components/capital-giro-resultado.tsx
│
└── financiamentos/
    ├── page.tsx                                    ← sem alteração
    ├── imovel/
    │   ├── page.tsx
    │   ├── _components/financiamento-imovel-form.tsx
    │   └── resultado/
    │       ├── page.tsx
    │       └── _components/financiamento-imovel-resultado.tsx
    └── veiculo/
        ├── page.tsx
        ├── _components/financiamento-veiculo-form.tsx
        └── resultado/
            ├── page.tsx
            └── _components/financiamento-veiculo-resultado.tsx
```

Utilitários:
```
apps/store/src/lib/utils/simulator.ts   ← adicionar calcSAC + MONTHLY_RATES
```

Migrations:
```
supabase/migrations/20260513120000_add_missing_product_types.sql
```

---

## Regras de Negócio — Resumo

| Produto | LTV / Teto | Taxa | Modalidade |
|---|---|---|---|
| Home Equity PF/PJ | 50% do imóvel | 1,19% a.m. | SAC ou Price |
| Auto Equity PF/PJ | 90% do veículo | 2,30% a.m. | Price |
| FGTS | 75% do saldo | 1,70% a.m. (info) | Estimativa bruta |
| Empréstimo Pessoal | R$ 10.000 | 3,50% a.m. ¹ | Price |
| Conta de Luz | R$ 2.100 | 3,00% a.m. ¹ | Price |
| Recebíveis PJ | 100% dos recebíveis | 4,50% a.m. | Price |
| Capital de Giro PJ | — | 4,50% a.m. | Price |
| Fin. Imóvel | 80% (entrada mín. 20%) | 1,00% a.m. | Price |
| Fin. Veículo | 70% (entrada mín. 30%) | 2,30% a.m. | Price |

¹ Taxa provisória — sem referência na documentação técnica original. Confirmar com time financeiro antes de ir a produção.

---

## Fora de Escopo (esta entrega)

- Consignado CLT — implementar junto com fluxo de contratação
- Geração de PDF
- Registro de leads (Google Sheets / Supabase)
- Fluxo de contratação (`/solicitar/{id}`) — já existe separado
