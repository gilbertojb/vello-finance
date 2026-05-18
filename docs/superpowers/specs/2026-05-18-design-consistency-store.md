# Design Consistency — Vello Store

**Data:** 2026-05-18
**Escopo:** `apps/store` — flows de simulação e contratação

---

## Problema

O simulador e o wizard de contratação usam tokens de design completamente diferentes, criando uma experiência fragmentada. O usuário percebe visualmente que "mudou de produto" ao sair do simulador e entrar no wizard.

Inconsistências identificadas:

| Elemento | Simulador (atual) | Wizard (atual) |
|---|---|---|
| Card wrapper | `rounded-2xl bg-white p-10` | Nenhum — form solto no fundo |
| Altura de inputs | `h-12` (48px) | `h-8` (32px) — shadcn default |
| Altura de botões | `h-12` custom | `h-8` (32px) — shadcn default |
| Border-radius inputs | `rounded-xl` (12px) | `rounded-lg` (8px) |
| Step indicator | Círculos numerados | Progress bar |
| Header de tela | Badge + título + subtítulo | Ausente |
| Card de resultado | `bg-surface-foreground` dark | N/A |

---

## Decisões de design

### 1. Layout de tela — Full Continuity

Todas as telas do simulador e do wizard terão a mesma estrutura:

```
bg-surface (fundo da página)
  └── Header (fora do card)
        ├── Badge: inline-flex, bg-primary/15, rounded-full, px-3 py-1, text-xs uppercase tracking-wide
        ├── Título: text-xl font-extrabold tracking-tight
        └── Subtítulo: text-sm text-surface-foreground/50
  └── Card branco
        └── bg-white rounded-2xl border border-surface-foreground/10 p-6 (mobile: p-5)
              └── Conteúdo do form / resultado
```

### 2. Step indicator — Dots pill

Substituir os dois sistemas atuais (círculos no simulador, progress bar no wizard) por um único componente `<DotsIndicator>`:

```
● ━━ ○ ○ ○
Passo 2 de 4                    Dados pessoais
```

- Dot concluído: `w-2 h-2 rounded-full bg-primary`
- Dot ativo: `w-5 h-2 rounded-full bg-primary` (pill)
- Dot pendente: `w-2 h-2 rounded-full bg-surface-foreground/12`
- Linha de texto abaixo: `text-xs text-surface-foreground/50` (esquerda: "Passo N de M") + `text-xs font-semibold text-surface-foreground/70` (direita: label do step)

### 3. Design tokens unificados

Aplicar em todos os inputs, selects e botões dos dois flows:

| Token | Valor Tailwind | Uso |
|---|---|---|
| Altura de inputs | `h-11` (44px) | Todos os `<Input>` |
| Altura de botões | `h-11` (44px) | Todos os `<Button>` principais |
| Border-radius inputs | `rounded-[10px]` | Todos os `<Input>` |
| Border-radius botões | `rounded-[10px]` | Todos os `<Button>` |
| Border-radius cards | `rounded-2xl` | Cards wrapper |
| Padding card (desktop) | `p-6` | `.white-card` |
| Padding card (mobile) | `max-sm:p-5` | `.white-card` |

**Nota:** os tokens devem ser aplicados via override nas props className dos componentes shadcn, não alterando os defaults globais do shadcn (evitar quebrar outros apps).

### 4. Cards de resultado

Migrar de dark card (`bg-surface-foreground`) para light card (`bg-white`) com o mesmo layout dos cards de form:

```
Card branco
  ├── Badge do produto (page-badge)
  ├── Label "Valor que você recebe" (text-sm text-muted-foreground)
  ├── Valor principal (text-3xl font-extrabold)
  ├── Sublabel (text-xs text-muted-foreground)
  ├── Highlight pill: bg-primary/12 rounded-lg p-2 — parcelas principais
  ├── Divider
  ├── Rows de dados secundários (taxa, CET, sistema, prazo)
  ├── Botão primário "Quero contratar →" (h-11 rounded-[10px] bg-primary)
  └── Botão secundário "Baixar PDF" (h-9 rounded-[10px] outline border)
```

**PRICE vs SAC:** o card deve exibir o sistema correto conforme os dados da simulação. O label do highlight pill deve ser:
- PRICE: "N× de R$ X,XX"
- SAC: "1ª parcela R$ X,XX · última R$ Y,YY"

### 5. PDF da simulação

**Objetivo:** documento formal, fundo branco, contraste via tipografia e acento de cor primária. Espelha todos os dados do card de resultado do browser.

#### Layout do PDF (A4, `@react-pdf/renderer`)

```
━━━━ barra de acento (4px, cor primary) ━━━━
Header: logo/nome empresa (esq) | "SIMULAÇÃO DE CRÉDITO" + data (dir)
─────────────────────────────────────────────
Badge do produto · Nome do cliente (grande)

[ Result box — borda-esq 4px primary, fundo primary/10 ]
  Esq: label "Valor disponível" + valor principal (26px bold)
       + sublabel "Sistema PRICE · parcelas fixas" ou "Sistema SAC · parcelas decrescentes"
  Dir: label "Parcela mensal" + valor (ou "N× sem custo" para FGTS)

[ Metrics grid — 4 células bg-gray-50 ]
  Crédito solicitado | Taxa mensal | CET anual | Prazo

─── DADOS DO PRODUTO ────────────────────────
[ Extras grid — 3 colunas, dados específicos do produto ]

─── TABELA DE PARCELAS — SISTEMA PRICE/SAC ──
[ Tabela — cabeçalho bg-primary branco, zebra alternada ]

─── Disclaimer ──────────────────────────────
Footer: empresa + simulationId (esq) | data geração + validade (dir)
```

#### Tabela de parcelas

- Mostrar as **12 primeiras parcelas** + linha de total no rodapé
- Para produtos com prazo ≤ 12 meses: mostrar todas

**Colunas PRICE:**

| # | Juros | Amortização | Saldo devedor |
|---|---|---|---|

**Colunas SAC:**

| # | Amortização | Juros | Valor da parcela |
|---|---|---|---|

#### Dados necessários no route handler

O route `GET /api/simulations/[id]/pdf` precisará calcular e passar as parcelas para o componente. A lógica de cálculo já existe nos componentes de resultado (`calcPRICE`, `calcSAC`) — extrair para `apps/store/src/lib/calc-installments.ts` e reutilizar tanto nos cards de resultado quanto no PDF.

Props adicionais em `SimulationPdfProps`:
```typescript
sistema: 'PRICE' | 'SAC' | null   // derivado de simulationData
installments: Array<{              // calculado no route handler
  n: number
  juros: number
  amortizacao: number
  saldoDevedor: number    // PRICE
  valorParcela?: number  // SAC (parcela total = amort + juros)
}>
```

#### Paleta para o PDF (fundo branco)

- Barra de acento e cabeçalho de tabela: `primary` (hex via `oklchToHex`)
- Borda esquerda do result box: `primary`
- Fundo do result box: `primary` a 10% opacity (misturar com branco)
- Células de métricas: `#f9fafb`
- Texto principal: `#0f172a`
- Texto labels: `#6b7280`
- Bordas: `#e5e7eb`
- Disclaimer: `#fefce8` / `#fde68a` / `#78350f`

---

## Componentes afetados

### Novos componentes / arquivos

| Arquivo | Descrição |
|---|---|
| `apps/store/src/app/(store)/_components/dots-indicator.tsx` | Novo `<DotsIndicator>` unificado (substitui `simulator-step-indicator.tsx` e `step-indicator.tsx`) |
| `apps/store/src/lib/calc-installments.ts` | Funções `calcPRICE` e `calcSAC` extraídas dos componentes de resultado — reutilizadas nos cards e no PDF |

### Componentes a modificar

**Simulador:**
- `simulador/pessoa-fisica/fgts/page.tsx` — remover step indicator próprio, usar `<DotsIndicator>`; ajustar padding do card
- `simulador/pessoa-fisica/consignado/page.tsx` — idem
- `simulador/pessoa-fisica/imovel-em-garantia/page.tsx` — idem
- `simulador/pessoa-fisica/veiculo-em-garantia/page.tsx` — idem
- `simulador/pessoa-fisica/emprestimo-pessoal/page.tsx` — idem
- `simulador/financiamentos/imovel/page.tsx` — idem
- `simulador/financiamentos/veiculo/page.tsx` — idem
- `simulador/pessoa-juridica/capital-de-giro/page.tsx` — idem
- `simulador/pessoa-juridica/antecipacao-recebiveis/page.tsx` — idem
- Todos os `_components/fgts-form.tsx` e similares — altura inputs/botões para `h-11 rounded-[10px]`

**Cards de resultado:**
- `pessoa-fisica/fgts/resultado/_components/fgts-resultado.tsx` — migrar dark→light
- `pessoa-fisica/consignado/resultado/_components/consignado-resultado.tsx` — idem
- `pessoa-fisica/imovel-em-garantia/resultado/_components/home-equity-resultado.tsx` — idem + corrigir PRICE/SAC
- `pessoa-fisica/veiculo-em-garantia/resultado/_components/auto-equity-resultado.tsx` — idem
- `pessoa-fisica/emprestimo-pessoal/resultado/_components/personal-loan-resultado.tsx` — idem
- `pessoa-fisica/conta-de-luz/resultado/_components/energy-bill-resultado.tsx` — idem
- `financiamentos/imovel/resultado/_components/property-result.tsx` — idem + corrigir PRICE/SAC
- `financiamentos/veiculo/resultado/_components/vehicle-result.tsx` — idem + corrigir PRICE/SAC
- `pessoa-juridica/capital-de-giro/resultado/_components/working-capital-resultado.tsx` — idem
- `pessoa-juridica/antecipacao-recebiveis/resultado/_components/receivables-advance-resultado.tsx` — idem

**PDF:**
- `apps/store/src/lib/pdf/simulation-pdf.tsx` — redesenho completo: fundo branco, result box com borda-esq primary, tabela de parcelas (12 primeiras), sistema dinâmico PRICE/SAC
- `apps/store/src/app/api/simulations/[id]/pdf/route.ts` — calcular parcelas via `calcInstallments` e passar como prop `installments` + `sistema`

**Wizard:**
- `contratar/[productTypeSlug]/_components/wizard-container.tsx` — **único lugar onde o card branco e o header são adicionados**; trocar `<StepIndicator>` por `<DotsIndicator>`; os steps individuais NÃO adicionam card próprio (evitar double-wrap)
- `contratar/[productTypeSlug]/_components/step-indicator.tsx` — deletar; substituído pelo `<DotsIndicator>` compartilhado
- Todos os wizard steps em `_components/wizards/` e `_components/steps/` — ajustar apenas inputs/botões (`h-11 rounded-[10px]`); nenhum wrapper novo

---

## O que NÃO muda

- Lógica de negócio (cálculos PRICE/SAC, validações de CPF/idade)
- Arquitetura Fat Server / Server Actions
- Multi-tenancy e CSS vars de paleta (`--primary`, `--surface`, `--surface-foreground`)
- Componentes shadcn globais (não alterar `input.tsx` nem `button.tsx` — usar className override)
- Fluxo de navegação do wizard (router.push, proposalId, etc.)

---

## Critérios de aceite

- [ ] Simulador e wizard têm visualmente a mesma estrutura de página (header + card branco)
- [ ] Ambos os flows usam `<DotsIndicator>` no lugar dos dois sistemas antigos
- [ ] Todos os inputs e botões primários têm `h-11 rounded-[10px]`
- [ ] Cards de resultado são light (bg-white), não dark
- [ ] Card de resultado exibe "PRICE" ou "SAC" conforme a simulação, não hardcodado
- [ ] PDF tem fundo branco, result box com borda-esq primary, tabela de parcelas (≤ 12 linhas)
- [ ] PDF exibe "Sistema PRICE" ou "Sistema SAC" conforme a simulação, com colunas corretas
- [ ] `calcPRICE` e `calcSAC` extraídas para `lib/calc-installments.ts` e compartilhadas entre cards e PDF
- [ ] Nenhum componente shadcn global foi alterado (apenas overrides via className)
- [ ] Funciona com a paleta de qualquer tenant (usa apenas CSS vars `--primary`, `--surface`, `--surface-foreground`)
