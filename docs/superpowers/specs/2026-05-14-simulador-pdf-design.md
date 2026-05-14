# Design: Simulador — Geração de PDF da Simulação

**Data:** 2026-05-14
**App:** `apps/store`
**Status:** Aprovado — aguardando implementação

---

## Visão Geral

Gerar um PDF elegante da simulação server-side via route handler, com identidade visual
do white-label (logo, cores do template) e dados completos do produto. O botão
"Baixar PDF" nos resultado components fica desabilitado até a simulação ser salva
no banco (quando `simulationId` fica disponível).

---

## 1. Arquitetura

### Route Handler

```
GET /api/simulations/[id]/pdf
```

Localização: `apps/store/src/app/api/simulations/[id]/pdf/route.ts`

Fluxo:
1. Lê `x-tenant-id` do header (injetado pelo middleware)
2. Chama `getSimulationForPdf(id, tenantId)` — busca simulação + branding em um único select
3. Lê o template de cores do tenant via `getTemplate(branding.template_id)`
4. Converte cores oklch → RGB via `oklchToRgb()`
5. Renderiza `<SimulationPdf />` com `@react-pdf/renderer` (`renderToBuffer`)
6. Retorna resposta com `Content-Type: application/pdf` e
   `Content-Disposition: inline; filename="simulacao-{slug}-{date}.pdf"`

Se a simulação não for encontrada ou `tenantId` não bater, retorna 404.

### Botão "Baixar PDF" nos resultado components

```tsx
<button
  onClick={() => {
    if (!simulationId) return
    window.open(`/api/simulations/${simulationId}/pdf`, '_blank')
  }}
  disabled={!simulationId}
  className="inline-flex items-center gap-2 text-xs font-medium text-surface-foreground/40
             transition-colors hover:text-surface-foreground disabled:opacity-30"
>
  <Download className="h-3.5 w-3.5" /> Baixar PDF
</button>
```

O botão ativa junto com o botão "Quero contratar" — ambos dependem de `simulationId !== null`.

---

## 2. Query

### Nova: `getSimulationForPdf`

```ts
getSimulationForPdf(simulationId: string, tenantId: string): Promise<SimulationForPdf | null>
```

Select com joins:

```ts
supabase
  .from('simulations')
  .select(`
    id,
    client_name,
    desired_amount,
    desired_term_months,
    estimated_rate,
    estimated_payment,
    simulation_data,
    created_at,
    products (
      name,
      product_type:product_types ( slug )
    ),
    tenants (
      tenant_branding (
        logo_url,
        company_display_name,
        template_id
      )
    )
  `)
  .eq('id', simulationId)
  .eq('tenant_id', tenantId)
  .single()
```

Tipo de retorno `SimulationForPdf`:

```ts
type SimulationForPdf = {
  id: string
  client_name: string
  desired_amount: number
  desired_term_months: number
  estimated_rate: number | null
  estimated_payment: number | null
  simulation_data: Record<string, unknown>
  created_at: string
  products: {
    name: string
    product_type: { slug: string }
  } | null
  tenants: {
    tenant_branding: {
      logo_url: string | null
      company_display_name: string | null
      template_id: string | null
    } | null
  } | null
}
```

---

## 3. Utilitários

### `oklch-to-rgb.ts`

Converte `{ l, c, h }` (oklch) para string hexadecimal `'#rrggbb'`, sem dependência externa.
Pipeline: oklch → oklab → linear sRGB → sRGB com clamp [0, 1].

```ts
export function oklchToHex(l: number, c: number, h: number): string
```

### `product-extras.ts`

Mapeamento de slug do produto para os campos extras extraídos de `simulation_data`.

```ts
type Extra = { label: string; value: string }

export function getProductExtras(
  slug: string,
  data: Record<string, unknown>,
): Extra[]
```

| Produto | Campos exibidos |
|---|---|
| `auto_equity` / `auto_equity_pj` | Marca/Ano, Valor FIPE, LTV, "Veículo permanece com você" |
| `home_equity` / `home_equity_pj` | Valor do imóvel, Valor do crédito, LTV |
| `fgts` | Saldo FGTS, Crédito (75% do saldo), Prazo fixo (120 meses) |
| `financiamento_imovel` | Valor do imóvel, Entrada, % de entrada |
| `financiamento_veiculo` | Valor do veículo, Entrada, % de entrada |
| `conta_luz` | Distribuidora, Conta mensal média |
| `emprestimo_pessoal` / `capital_giro` / `antecipacao_recebiveis` | Nenhum (dados padrão suficientes) |

Retorna array vazio para slugs sem mapeamento.

---

## 4. Componente PDF

### Estrutura de arquivos

```
apps/store/src/lib/pdf/
├── simulation-pdf.tsx   ← Document + Page + todos os blocos
├── product-extras.ts    ← getProductExtras()
└── oklch-to-rgb.ts      ← oklchToHex()
```

### Layout — `simulation-pdf.tsx`

Documento A4, fundo branco, margens de 36pt.
Usa `@react-pdf/renderer` com `StyleSheet.create`.

**Bloco 1 — Top accent bar**
Retângulo de 4pt de altura na cor primária do tenant (via `oklchToHex`). Gradiente não é
suportado no topo da página pelo renderer; usa a cor primária sólida.
Posicionamento absoluto no topo da página, largura total.

**Bloco 2 — Header**
Linha horizontal com logo do tenant (via URL) à esquerda e coluna de texto à direita
("Simulação de Crédito" + data formatada `DD de mês de YYYY`).
Logo: `<Image src={logoUrl} />` com dimensões fixas (altura 28pt, largura automática).
Fallback quando `logo_url` é null: texto com o `company_display_name` em negrito,
na cor primária.
Separado do body por uma linha de 1pt na cor `#f1f5f9`.

**Bloco 3 — Client + Product**
Linha com badge colorido (cor primária, texto branco) contendo o nome do produto,
seguido do nome do cliente em 18pt bold.

**Bloco 4 — Installment Card**
View com `backgroundColor` na cor primária. Parcela mensal em 28pt bold branco
à esquerda; total estimado em 11pt à direita. Subtexto "Sistema PRICE · Parcelas
fixas" abaixo da parcela em 8pt.
`estimatedPayment` é exibido como moeda BR. Se `estimated_payment` for null,
exibe "—".

**Bloco 5 — Metrics Grid**
3 colunas de largura igual: Crédito (`desired_amount`), Prazo (`desired_term_months` +
" meses"), Taxa ref. (`estimated_rate` + "% a.m."). Cada célula: fundo `#f8fafc`,
border `#f1f5f9`, label em 8pt cinza, valor em 13pt bold.

**Bloco 6 — Product Extras** *(condicional)*
Só renderiza se `getProductExtras(slug, simulation_data)` retornar array não vazio.
Cabeçalho com linhas horizontais e texto "Dados do Produto" (ou nome específico
conforme o mapeamento).
Grid de 2 colunas com os extras: label em 8pt cinza + valor em 11pt bold.

**Bloco 7 — Disclaimer**
Caixa com background `#fef9ec`, border `#fde68a`, texto em 8pt cor `#92400e`.
Texto fixo: "Esta é uma simulação referencial com base na taxa mínima de X% a.m.
As condições finais dependem da análise de crédito."

**Bloco 8 — Footer**
Linha divisória. Coluna esquerda: nome da empresa + ID da simulação (primeiros 8
caracteres do UUID). Coluna direita: "Gerado em {data e hora}" + "Válido por 30 dias".
Tudo em 8pt cor `#cbd5e1`.

---

## 5. Arquivos Afetados

### Criar

| Arquivo | Responsabilidade |
|---|---|
| `apps/store/src/app/api/simulations/[id]/pdf/route.ts` | Route handler GET, monta e retorna o PDF |
| `apps/store/src/lib/pdf/simulation-pdf.tsx` | Componente React PDF (`@react-pdf/renderer`) |
| `apps/store/src/lib/pdf/product-extras.ts` | `getProductExtras()` por slug |
| `apps/store/src/lib/pdf/oklch-to-rgb.ts` | `oklchToHex()` oklch → hex |

### Modificar

| Arquivo | Mudança |
|---|---|
| `apps/store/src/app/(store)/queries.ts` | Adicionar `getSimulationForPdf` |
| 9 resultado components (`*-resultado.tsx`) | Ativar botão "Baixar PDF" com `window.open` + `disabled={!simulationId}` |

---

## 6. Dependência

Adicionar ao `apps/store/package.json`:

```json
"@react-pdf/renderer": "^4.x"
```

---

## 7. Fora de Escopo (esta entrega)

- Tabela de amortização completa no PDF
- Envio do PDF por e-mail ou WhatsApp
- Download automático (sem abrir nova aba)
- Cache do PDF gerado
