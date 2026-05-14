# Simulador — Geração de PDF da Simulação

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Gerar PDF elegante da simulação server-side via route handler, com logo e cores do white-label, e ativar o botão "Baixar PDF" nos 9 resultado components após a simulação ser salva.

**Architecture:** Route handler `GET /api/simulations/[id]/pdf` busca simulação + branding do tenant, converte cores oklch → hex, e renderiza um componente React com `@react-pdf/renderer`. O botão "Baixar PDF" chama `window.open` com o ID da simulação e fica desabilitado enquanto `simulationId` for null.

**Tech Stack:** Next.js 15 App Router, `@react-pdf/renderer`, TypeScript, Supabase.

---

## Mapa de Arquivos

| Operação | Arquivo |
|---|---|
| Criar | `apps/store/src/lib/pdf/oklch-to-rgb.ts` |
| Criar | `apps/store/src/lib/pdf/product-extras.ts` |
| Criar | `apps/store/src/lib/pdf/simulation-pdf.tsx` |
| Criar | `apps/store/src/app/api/simulations/[id]/pdf/route.ts` |
| Modificar | `apps/store/src/app/(store)/queries.ts` |
| Modificar | `apps/store/src/app/(store)/simulador/pessoa-fisica/fgts/resultado/_components/fgts-resultado.tsx` |
| Modificar | `apps/store/src/app/(store)/simulador/pessoa-fisica/emprestimo-pessoal/resultado/_components/emprestimo-pessoal-resultado.tsx` |
| Modificar | `apps/store/src/app/(store)/simulador/pessoa-fisica/conta-luz/resultado/_components/conta-luz-resultado.tsx` |
| Modificar | `apps/store/src/app/(store)/simulador/pessoa-fisica/home-equity/resultado/_components/home-equity-resultado.tsx` |
| Modificar | `apps/store/src/app/(store)/simulador/pessoa-fisica/auto-equity/resultado/_components/auto-equity-resultado.tsx` |
| Modificar | `apps/store/src/app/(store)/simulador/pessoa-juridica/antecipacao-recebiveis/resultado/_components/antecipacao-recebiveis-resultado.tsx` |
| Modificar | `apps/store/src/app/(store)/simulador/pessoa-juridica/capital-giro/resultado/_components/capital-giro-resultado.tsx` |
| Modificar | `apps/store/src/app/(store)/simulador/financiamentos/imovel/resultado/_components/financiamento-imovel-resultado.tsx` |
| Modificar | `apps/store/src/app/(store)/simulador/financiamentos/veiculo/resultado/_components/financiamento-veiculo-resultado.tsx` |

---

## Task 1: Instalar `@react-pdf/renderer`

**Files:**
- Modify: `apps/store/package.json`

- [ ] **Step 1.1: Instalar a dependência**

```bash
cd /Users/gilbertobueno/Projects/vello/vello-finance
pnpm --filter store add @react-pdf/renderer
```

Se houver conflito de peer dependency com React 19, rode:

```bash
pnpm --filter store add @react-pdf/renderer --legacy-peer-deps
```

- [ ] **Step 1.2: Verificar instalação**

```bash
cat apps/store/package.json | grep react-pdf
```

Esperado: linha com `"@react-pdf/renderer": "^4.x.x"` (ou versão instalada).

- [ ] **Step 1.3: Commit**

```bash
git add apps/store/package.json pnpm-lock.yaml
git commit -m "chore(store): adiciona @react-pdf/renderer"
```

---

## Task 2: Utilitário `oklch-to-rgb.ts`

**Files:**
- Create: `apps/store/src/lib/pdf/oklch-to-rgb.ts`

- [ ] **Step 2.1: Criar o arquivo**

`apps/store/src/lib/pdf/oklch-to-rgb.ts`:

```ts
function clamp(x: number): number {
  return Math.max(0, Math.min(1, x))
}

function linearToSrgb(x: number): number {
  const c = clamp(x)
  return c <= 0.0031308 ? 12.92 * c : 1.055 * Math.pow(c, 1 / 2.4) - 0.055
}

function toHex(x: number): string {
  return Math.round(clamp(x) * 255).toString(16).padStart(2, '0')
}

export function oklchToHex(l: number, c: number, h: number): string {
  const hRad = (h * Math.PI) / 180
  const a = c * Math.cos(hRad)
  const b = c * Math.sin(hRad)

  const l_ = l + 0.3963377774 * a + 0.2158037573 * b
  const m_ = l - 0.1055613458 * a - 0.0638541728 * b
  const s_ = l - 0.0894841775 * a - 1.2914855480 * b

  const L = l_ * l_ * l_
  const M = m_ * m_ * m_
  const S = s_ * s_ * s_

  const r = linearToSrgb(+4.0767416621 * L - 3.3077115913 * M + 0.2309699292 * S)
  const g = linearToSrgb(-1.2684380046 * L + 2.6097574011 * M - 0.3413193965 * S)
  const bC = linearToSrgb(-0.0041960863 * L - 0.7034186147 * M + 1.7076147010 * S)

  return `#${toHex(r)}${toHex(g)}${toHex(bC)}`
}
```

- [ ] **Step 2.2: Verificar TypeScript**

```bash
cd /Users/gilbertobueno/Projects/vello/vello-finance
pnpm --filter store exec tsc --noEmit 2>&1 | grep "oklch-to-rgb" | head -10
```

Esperado: sem saída (sem erros).

- [ ] **Step 2.3: Commit**

```bash
git add apps/store/src/lib/pdf/oklch-to-rgb.ts
git commit -m "feat(store): utilitario oklch para hex para PDF"
```

---

## Task 3: Utilitário `product-extras.ts`

**Files:**
- Create: `apps/store/src/lib/pdf/product-extras.ts`

- [ ] **Step 3.1: Antes de criar, confirmar campos salvos pelos formulários**

Leia rapidamente os seguintes arquivos para confirmar os nomes exatos dos campos em `simulation_data`:

- `apps/store/src/app/(store)/simulador/pessoa-fisica/conta-luz/_components/conta-luz-form.tsx` — confirmar se o campo se chama `distribuidora` e `valorDesejado`
- `apps/store/src/app/(store)/simulador/pessoa-fisica/home-equity/_components/home-equity-form.tsx` — confirmar se usa `valorImovel` e `valorCredito`
- `apps/store/src/app/(store)/simulador/financiamentos/imovel/_components/financiamento-imovel-form.tsx` — confirmar `valorImovel` e `entrada`

Ajuste os nomes de campo no passo 3.2 se forem diferentes.

- [ ] **Step 3.2: Criar o arquivo**

`apps/store/src/lib/pdf/product-extras.ts`:

```ts
export type PdfExtra = { label: string; value: string }

function brl(v: unknown): string {
  const n = Number(v)
  if (Number.isNaN(n)) return '—'
  return n.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
}

function pct(n: unknown): string {
  const v = Number(n)
  if (Number.isNaN(v)) return '—'
  return `${Math.round(v)}%`
}

const EXTRAS: Record<string, (d: Record<string, unknown>) => PdfExtra[]> = {
  auto_equity: (d) => [
    { label: 'Marca / Ano', value: `${String(d.marca ?? '—')} · ${String(d.ano ?? '—')}` },
    { label: 'Valor FIPE', value: brl(d.valorFipe) },
    { label: 'LTV', value: pct(Number(d.valorCredito) / Number(d.valorFipe) * 100) },
    { label: 'Uso do veículo', value: 'Permanece com você' },
  ],
  auto_equity_pj: (d) => EXTRAS.auto_equity!(d),
  home_equity: (d) => [
    { label: 'Valor do Imóvel', value: brl(d.valorImovel) },
    { label: 'Valor do Crédito', value: brl(d.valorCredito) },
    { label: 'LTV', value: pct(Number(d.valorCredito) / Number(d.valorImovel) * 100) },
  ],
  home_equity_pj: (d) => EXTRAS.home_equity!(d),
  fgts: (d) => [
    { label: 'Saldo FGTS', value: brl(d.saldoFgts) },
    { label: 'Crédito disponível', value: brl(Number(d.saldoFgts) * 0.75) },
    { label: 'Prazo', value: '120 meses' },
  ],
  financiamento_imovel: (d) => [
    { label: 'Valor do Imóvel', value: brl(d.valorImovel) },
    { label: 'Entrada', value: brl(d.entrada) },
    { label: '% de Entrada', value: pct(Number(d.entrada) / Number(d.valorImovel) * 100) },
  ],
  financiamento_veiculo: (d) => [
    { label: 'Valor do Veículo', value: brl(d.valorVeiculo) },
    { label: 'Entrada', value: brl(d.entrada) },
    { label: '% de Entrada', value: pct(Number(d.entrada) / Number(d.valorVeiculo) * 100) },
  ],
  conta_luz: (d) => [
    { label: 'Distribuidora', value: String(d.distribuidora ?? '—') },
    { label: 'Valor solicitado', value: brl(d.valorDesejado) },
  ],
}

export function getProductExtras(
  slug: string,
  data: Record<string, unknown>,
): PdfExtra[] {
  const fn = EXTRAS[slug]
  if (!fn) return []
  try {
    return fn(data)
  } catch {
    return []
  }
}
```

- [ ] **Step 3.3: Verificar TypeScript**

```bash
cd /Users/gilbertobueno/Projects/vello/vello-finance
pnpm --filter store exec tsc --noEmit 2>&1 | grep "product-extras" | head -10
```

Esperado: sem saída.

- [ ] **Step 3.4: Commit**

```bash
git add apps/store/src/lib/pdf/product-extras.ts
git commit -m "feat(store): mapeamento de dados extras por produto para PDF"
```

---

## Task 4: Queries — `getSimulationForPdf` + `getTenantBranding`

**Files:**
- Modify: `apps/store/src/app/(store)/queries.ts`

- [ ] **Step 4.1: Adicionar `getSimulationForPdf` após `getSimulation`**

Abra `apps/store/src/app/(store)/queries.ts` e adicione ao final:

```ts
export async function getSimulationForPdf(simulationId: string, tenantId: string) {
  const supabase = createServiceClient()
  const { data } = await supabase
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
      )
    `)
    .eq('id', simulationId)
    .eq('tenant_id', tenantId)
    .single()
  return data
}

export async function getTenantBranding(tenantId: string) {
  const supabase = createServiceClient()
  const { data } = await supabase
    .from('tenant_branding')
    .select('logo_url, company_display_name, template_id')
    .eq('tenant_id', tenantId)
    .single()
  return data
}
```

- [ ] **Step 4.2: Verificar TypeScript**

```bash
cd /Users/gilbertobueno/Projects/vello/vello-finance
pnpm --filter store exec tsc --noEmit 2>&1 | grep "queries" | head -10
```

Esperado: sem saída nos arquivos editados.

- [ ] **Step 4.3: Commit**

```bash
git add apps/store/src/app/\(store\)/queries.ts
git commit -m "feat(store): queries getSimulationForPdf e getTenantBranding"
```

---

## Task 5: Componente `SimulationPdf`

**Files:**
- Create: `apps/store/src/lib/pdf/simulation-pdf.tsx`

- [ ] **Step 5.1: Criar o componente**

`apps/store/src/lib/pdf/simulation-pdf.tsx`:

```tsx
import { Document, Page, View, Text, Image, StyleSheet } from '@react-pdf/renderer'
import { getProductExtras } from './product-extras'
import { oklchToHex } from './oklch-to-rgb'

type Extra = { label: string; value: string }

export type SimulationPdfProps = {
  simulationId: string
  clientName: string
  productName: string
  productSlug: string
  desiredAmount: number
  desiredTermMonths: number
  estimatedRate: number | null
  estimatedPayment: number | null
  simulationData: Record<string, unknown>
  createdAt: string
  companyName: string
  logoUrl: string | null
  primaryL: number
  primaryC: number
  primaryH: number
}

function brl(value: number): string {
  return value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
}

function formatDate(iso: string): string {
  const d = new Date(iso)
  const months = [
    'janeiro','fevereiro','março','abril','maio','junho',
    'julho','agosto','setembro','outubro','novembro','dezembro',
  ]
  return `${d.getDate()} de ${months[d.getMonth()]} de ${d.getFullYear()}`
}

export function SimulationPdf({
  simulationId,
  clientName,
  productName,
  productSlug,
  desiredAmount,
  desiredTermMonths,
  estimatedRate,
  estimatedPayment,
  simulationData,
  createdAt,
  companyName,
  logoUrl,
  primaryL,
  primaryC,
  primaryH,
}: SimulationPdfProps) {
  const primary = oklchToHex(primaryL, primaryC, primaryH)
  const extras: Extra[] = getProductExtras(productSlug, simulationData)
  const total = estimatedPayment != null ? estimatedPayment * desiredTermMonths : null
  const shortId = simulationId.slice(0, 8)
  const dateStr = formatDate(createdAt)
  const rateStr = estimatedRate != null
    ? `${estimatedRate.toFixed(2).replace('.', ',')}% a.m.`
    : '—'
  const paymentStr = estimatedPayment != null ? brl(estimatedPayment) : '—'
  const totalStr = total != null ? brl(total) : '—'

  const s = StyleSheet.create({
    page: { backgroundColor: '#ffffff', fontFamily: 'Helvetica' },
    accentBar: { height: 4, backgroundColor: primary },
    content: { paddingHorizontal: 36, paddingTop: 16, paddingBottom: 36 },
    header: {
      flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
      paddingBottom: 14, borderBottomWidth: 1, borderBottomColor: '#f1f5f9', marginBottom: 16,
    },
    logoImage: { height: 28, objectFit: 'contain' },
    logoFallback: { fontSize: 14, fontFamily: 'Helvetica-Bold', color: primary },
    headerRight: { alignItems: 'flex-end' },
    headerLabel: { fontSize: 8, color: '#9ca3af', letterSpacing: 0.8 },
    headerDate: { fontSize: 9, color: '#6b7280', marginTop: 2 },
    badge: {
      backgroundColor: primary, borderRadius: 4,
      paddingHorizontal: 8, paddingVertical: 3, alignSelf: 'flex-start', marginBottom: 6,
    },
    badgeText: { fontSize: 8, color: '#ffffff', fontFamily: 'Helvetica-Bold', letterSpacing: 1 },
    clientName: { fontSize: 18, fontFamily: 'Helvetica-Bold', color: '#0f172a', marginBottom: 14 },
    card: {
      backgroundColor: primary, borderRadius: 10, padding: 16,
      flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: 12,
    },
    cardLabel: { fontSize: 8, color: 'rgba(255,255,255,0.65)', letterSpacing: 1, marginBottom: 4 },
    cardAmount: { fontSize: 26, fontFamily: 'Helvetica-Bold', color: '#ffffff' },
    cardSub: { fontSize: 8, color: 'rgba(255,255,255,0.55)', marginTop: 4 },
    cardTotalLabel: { fontSize: 9, color: 'rgba(255,255,255,0.55)', marginBottom: 2, textAlign: 'right' },
    cardTotal: { fontSize: 13, fontFamily: 'Helvetica-Bold', color: 'rgba(255,255,255,0.85)', textAlign: 'right' },
    metricsRow: { flexDirection: 'row', marginBottom: 14 },
    metricCell: {
      flex: 1, backgroundColor: '#f8fafc', borderRadius: 6, padding: 10,
      borderWidth: 1, borderColor: '#f1f5f9', marginRight: 6,
    },
    metricCellLast: {
      flex: 1, backgroundColor: '#f8fafc', borderRadius: 6, padding: 10,
      borderWidth: 1, borderColor: '#f1f5f9',
    },
    metricLabel: { fontSize: 8, color: '#94a3b8', letterSpacing: 0.8, marginBottom: 3 },
    metricValue: { fontSize: 13, fontFamily: 'Helvetica-Bold', color: '#0f172a' },
    dividerRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 10 },
    dividerLine: { flex: 1, height: 1, backgroundColor: '#f1f5f9' },
    dividerText: {
      fontSize: 8, color: '#94a3b8', fontFamily: 'Helvetica-Bold',
      letterSpacing: 1, marginHorizontal: 8,
    },
    extrasGrid: { flexDirection: 'row', flexWrap: 'wrap', marginBottom: 14 },
    extraCell: {
      width: '48%', borderWidth: 1, borderColor: '#f1f5f9',
      borderRadius: 6, padding: 9, marginRight: '2%', marginBottom: 6,
    },
    extraLabel: { fontSize: 8, color: '#94a3b8', marginBottom: 2 },
    extraValue: { fontSize: 11, fontFamily: 'Helvetica-Bold', color: '#334155' },
    disclaimer: {
      backgroundColor: '#fef9ec', borderWidth: 1, borderColor: '#fde68a',
      borderRadius: 6, padding: 10, marginBottom: 14,
    },
    disclaimerText: { fontSize: 8, color: '#92400e', lineHeight: 1.5 },
    footer: {
      flexDirection: 'row', justifyContent: 'space-between',
      borderTopWidth: 1, borderTopColor: '#f1f5f9', paddingTop: 12,
    },
    footerText: { fontSize: 8, color: '#cbd5e1', marginBottom: 2 },
    footerRight: { alignItems: 'flex-end' },
  })

  const metrics = [
    { label: 'CRÉDITO', value: brl(desiredAmount), last: false },
    { label: 'PRAZO', value: `${desiredTermMonths} meses`, last: false },
    { label: 'TAXA REF.', value: rateStr, last: true },
  ]

  return (
    <Document>
      <Page size="A4" style={s.page}>
        <View style={s.accentBar} />

        <View style={s.content}>
          {/* Header */}
          <View style={s.header}>
            <View>
              {logoUrl ? (
                <Image src={logoUrl} style={s.logoImage} />
              ) : (
                <Text style={s.logoFallback}>{companyName}</Text>
              )}
            </View>
            <View style={s.headerRight}>
              <Text style={s.headerLabel}>SIMULAÇÃO DE CRÉDITO</Text>
              <Text style={s.headerDate}>{dateStr}</Text>
            </View>
          </View>

          {/* Client + product */}
          <View style={s.badge}>
            <Text style={s.badgeText}>{productName.toUpperCase()}</Text>
          </View>
          <Text style={s.clientName}>{clientName}</Text>

          {/* Installment card */}
          <View style={s.card}>
            <View>
              <Text style={s.cardLabel}>PARCELA MENSAL</Text>
              <Text style={s.cardAmount}>{paymentStr}</Text>
              <Text style={s.cardSub}>Sistema PRICE · Parcelas fixas</Text>
            </View>
            <View>
              <Text style={s.cardTotalLabel}>Total estimado</Text>
              <Text style={s.cardTotal}>{totalStr}</Text>
            </View>
          </View>

          {/* Metrics */}
          <View style={s.metricsRow}>
            {metrics.map((m) => (
              <View key={m.label} style={m.last ? s.metricCellLast : s.metricCell}>
                <Text style={s.metricLabel}>{m.label}</Text>
                <Text style={s.metricValue}>{m.value}</Text>
              </View>
            ))}
          </View>

          {/* Product extras */}
          {extras.length > 0 && (
            <>
              <View style={s.dividerRow}>
                <View style={s.dividerLine} />
                <Text style={s.dividerText}>DADOS DO PRODUTO</Text>
                <View style={s.dividerLine} />
              </View>
              <View style={s.extrasGrid}>
                {extras.map((e) => (
                  <View key={e.label} style={s.extraCell}>
                    <Text style={s.extraLabel}>{e.label}</Text>
                    <Text style={s.extraValue}>{e.value}</Text>
                  </View>
                ))}
              </View>
            </>
          )}

          {/* Disclaimer */}
          <View style={s.disclaimer}>
            <Text style={s.disclaimerText}>
              {`Esta é uma simulação referencial com base na taxa mínima de ${rateStr}. As condições finais dependem da análise de crédito e das políticas de concessão vigentes.`}
            </Text>
          </View>

          {/* Footer */}
          <View style={s.footer}>
            <View>
              <Text style={s.footerText}>{companyName}</Text>
              <Text style={s.footerText}>{`Simulação #${shortId}`}</Text>
            </View>
            <View style={s.footerRight}>
              <Text style={s.footerText}>{`Gerado em ${dateStr}`}</Text>
              <Text style={s.footerText}>Válido por 30 dias · Sujeito à análise</Text>
            </View>
          </View>
        </View>
      </Page>
    </Document>
  )
}
```

- [ ] **Step 5.2: Verificar TypeScript**

```bash
cd /Users/gilbertobueno/Projects/vello/vello-finance
pnpm --filter store exec tsc --noEmit 2>&1 | grep "simulation-pdf" | head -10
```

Esperado: sem saída.

- [ ] **Step 5.3: Commit**

```bash
git add apps/store/src/lib/pdf/simulation-pdf.tsx
git commit -m "feat(store): componente React PDF da simulacao"
```

---

## Task 6: Route Handler

**Files:**
- Create: `apps/store/src/app/api/simulations/[id]/pdf/route.ts`

- [ ] **Step 6.1: Criar o route handler**

`apps/store/src/app/api/simulations/[id]/pdf/route.ts`:

```ts
import { NextRequest } from 'next/server'
import { headers } from 'next/headers'
import { renderToBuffer } from '@react-pdf/renderer'
import { createElement } from 'react'
import { getSimulationForPdf, getTenantBranding } from '@/app/(store)/queries'
import { getTemplate } from '@/templates'
import { SimulationPdf } from '@/lib/pdf/simulation-pdf'

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params
  const tenantId = (await headers()).get('x-tenant-id') ?? ''

  const [simulation, branding] = await Promise.all([
    getSimulationForPdf(id, tenantId),
    getTenantBranding(tenantId),
  ])

  if (!simulation || !simulation.products) {
    return new Response('Not Found', { status: 404 })
  }

  const template = getTemplate(branding?.template_id)
  const { primary } = template.colors

  const productType = simulation.products.product_type as { slug: string } | null
  const slug = productType?.slug ?? ''

  const createdAt = simulation.created_at ?? new Date().toISOString()
  const companyName = branding?.company_display_name ?? 'Vello Finance'
  const logoUrl = branding?.logo_url ?? null

  const pdfBuffer = await renderToBuffer(
    createElement(SimulationPdf, {
      simulationId: simulation.id,
      clientName: simulation.client_name,
      productName: simulation.products.name,
      productSlug: slug,
      desiredAmount: Number(simulation.desired_amount),
      desiredTermMonths: simulation.desired_term_months,
      estimatedRate: simulation.estimated_rate != null ? Number(simulation.estimated_rate) : null,
      estimatedPayment: simulation.estimated_payment != null ? Number(simulation.estimated_payment) : null,
      simulationData: (simulation.simulation_data as Record<string, unknown>) ?? {},
      createdAt,
      companyName,
      logoUrl,
      primaryL: primary.l,
      primaryC: primary.c,
      primaryH: primary.h,
    }),
  )

  const date = new Date().toISOString().slice(0, 10)
  const filename = `simulacao-${slug}-${date}.pdf`

  return new Response(pdfBuffer, {
    headers: {
      'Content-Type': 'application/pdf',
      'Content-Disposition': `inline; filename="${filename}"`,
    },
  })
}
```

- [ ] **Step 6.2: Verificar TypeScript**

```bash
cd /Users/gilbertobueno/Projects/vello/vello-finance
pnpm --filter store exec tsc --noEmit 2>&1 | grep "error TS" | grep -v "node_modules" | head -20
```

Corrija quaisquer erros nos arquivos criados nesta task.

- [ ] **Step 6.3: Testar manualmente**

Suba o dev server:
```bash
pnpm --filter store dev
```

Abra o Supabase e copie o ID de alguma simulação existente (`SELECT id FROM simulations LIMIT 1`).
Acesse `http://localhost:3002/api/simulations/{id}/pdf` num browser.

Esperado: PDF abre na aba com logo, cores, dados da simulação.

Se der erro 404: a simulação pode não existir para o tenant do dev. Nesse caso, verifique se `x-tenant-id` está sendo injetado corretamente pelo middleware em requests locais (pode precisar acessar pela URL do tenant, ex: `http://meu-tenant.localhost:3002/api/simulations/{id}/pdf`).

- [ ] **Step 6.4: Commit**

```bash
git add apps/store/src/app/api/simulations/
git commit -m "feat(store): route handler GET /api/simulations/[id]/pdf"
```

---

## Task 7: Wiring do Botão "Baixar PDF" nos 9 Resultado Components

**Files:** 9 resultado components listados no mapa de arquivos.

A mudança é idêntica em todos os 9 componentes. O padrão:

1. Importar `Download` do lucide-react (se ainda não importado)
2. Localizar o bloco de botões secundários (RefreshCw / Download) no final do componente
3. Se o botão `Download` não existir, adicionar após o botão "Refazer"
4. Substituir/atualizar o botão para:

```tsx
<button
  type="button"
  disabled={!simulationId}
  onClick={() => {
    if (!simulationId) return
    window.open(`/api/simulations/${simulationId}/pdf`, '_blank')
  }}
  className="inline-flex items-center gap-2 text-xs font-medium text-surface-foreground/40 transition-colors hover:text-surface-foreground disabled:cursor-not-allowed disabled:opacity-30"
>
  <Download className="h-3.5 w-3.5" /> Baixar PDF
</button>
```

- [ ] **Step 7.1: Aplicar em `fgts-resultado.tsx`**

Arquivo: `apps/store/src/app/(store)/simulador/pessoa-fisica/fgts/resultado/_components/fgts-resultado.tsx`

Leia o arquivo primeiro. Localize a seção de botões secundários (no final, após o botão "Quero contratar"). Adicione o botão "Baixar PDF" conforme o padrão acima. Se `Download` não estiver importado, adicione ao import de `lucide-react`.

- [ ] **Step 7.2: Aplicar em `emprestimo-pessoal-resultado.tsx`**

Arquivo: `apps/store/src/app/(store)/simulador/pessoa-fisica/emprestimo-pessoal/resultado/_components/emprestimo-pessoal-resultado.tsx`

Mesma operação. O componente atual não tem seção de botões secundários — adicione após o botão "Quero contratar":

```tsx
<div className="flex items-center justify-center gap-6 pt-2">
  <button
    type="button"
    onClick={() => router.back()}
    className="inline-flex items-center gap-2 text-xs font-medium text-surface-foreground/40 transition-colors hover:text-surface-foreground"
  >
    <RefreshCw className="h-3.5 w-3.5" /> Refazer
  </button>
  <button
    type="button"
    disabled={!simulationId}
    onClick={() => {
      if (!simulationId) return
      window.open(`/api/simulations/${simulationId}/pdf`, '_blank')
    }}
    className="inline-flex items-center gap-2 text-xs font-medium text-surface-foreground/40 transition-colors hover:text-surface-foreground disabled:cursor-not-allowed disabled:opacity-30"
  >
    <Download className="h-3.5 w-3.5" /> Baixar PDF
  </button>
</div>
```

Adicione `RefreshCw, Download` ao import de `lucide-react`. Adicione `import { useRouter } from 'next/navigation'` se não existir (já existe neste arquivo).

- [ ] **Step 7.3: Aplicar nos demais 7 resultado components**

Para cada um dos seguintes arquivos, leia-o e aplique o mesmo padrão (adicionar botão "Baixar PDF" com `disabled={!simulationId}` e `window.open`):

1. `apps/store/src/app/(store)/simulador/pessoa-fisica/conta-luz/resultado/_components/conta-luz-resultado.tsx`
2. `apps/store/src/app/(store)/simulador/pessoa-fisica/home-equity/resultado/_components/home-equity-resultado.tsx`
3. `apps/store/src/app/(store)/simulador/pessoa-fisica/auto-equity/resultado/_components/auto-equity-resultado.tsx` — este já tem o botão (não funcional); apenas ative com `onClick` e `disabled`
4. `apps/store/src/app/(store)/simulador/pessoa-juridica/antecipacao-recebiveis/resultado/_components/antecipacao-recebiveis-resultado.tsx`
5. `apps/store/src/app/(store)/simulador/pessoa-juridica/capital-giro/resultado/_components/capital-giro-resultado.tsx`
6. `apps/store/src/app/(store)/simulador/financiamentos/imovel/resultado/_components/financiamento-imovel-resultado.tsx`
7. `apps/store/src/app/(store)/simulador/financiamentos/veiculo/resultado/_components/financiamento-veiculo-resultado.tsx`

- [ ] **Step 7.4: Verificar TypeScript**

```bash
cd /Users/gilbertobueno/Projects/vello/vello-finance
pnpm --filter store exec tsc --noEmit 2>&1 | grep "error TS" | grep -v "node_modules" | head -20
```

Esperado: sem erros.

- [ ] **Step 7.5: Commit**

```bash
git add apps/store/src/app/\(store\)/simulador/
git commit -m "feat(store): ativa botao Baixar PDF nos resultado components"
```

---

## Task 8: Push

- [ ] **Step 8.1: Push para origin**

```bash
git push origin main
```
