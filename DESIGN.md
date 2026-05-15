---
name: Vello Console
description: Painel operacional para consultores de crédito — profissional, humano, eficiente.
colors:
  papel: "oklch(1 0 0)"
  grafite-profundo: "oklch(0.145 0 0)"
  grafite: "oklch(0.205 0 0)"
  branco-suave: "oklch(0.985 0 0)"
  cinza-suave: "oklch(0.97 0 0)"
  chumbo: "oklch(0.556 0 0)"
  nevoa: "oklch(0.922 0 0)"
  verde-aprovacao: "oklch(0.596 0.145 163.225)"
  vermelho-alerta: "oklch(0.577 0.245 27.325)"
  ambar: "oklch(0.646 0.222 41.116)"
  ciano-fundo: "oklch(0.600 0.118 184.704)"
  indigo: "oklch(0.398 0.070 227.392)"
  limao: "oklch(0.828 0.189 84.429)"
  ambar-suave: "oklch(0.769 0.188 70.080)"
typography:
  display:
    fontFamily: "Geist Sans, system-ui, sans-serif"
    fontSize: "2.25rem"
    fontWeight: 600
    lineHeight: 1
    letterSpacing: "-0.025em"
  headline:
    fontFamily: "Geist Sans, system-ui, sans-serif"
    fontSize: "1.875rem"
    fontWeight: 700
    lineHeight: 1
    letterSpacing: "-0.025em"
  title:
    fontFamily: "Geist Sans, system-ui, sans-serif"
    fontSize: "1rem"
    fontWeight: 500
    lineHeight: 1.5
  body:
    fontFamily: "Geist Sans, system-ui, sans-serif"
    fontSize: "0.875rem"
    fontWeight: 400
    lineHeight: 1.5
  label:
    fontFamily: "Geist Sans, system-ui, sans-serif"
    fontSize: "0.75rem"
    fontWeight: 500
    lineHeight: 1.4
    letterSpacing: "0.12em"
  mono:
    fontFamily: "Geist Mono, ui-monospace, monospace"
    fontSize: "0.6875rem"
    fontWeight: 400
    letterSpacing: "0.06em"
rounded:
  sm: "6px"
  md: "8px"
  lg: "10px"
  xl: "14px"
  card: "16px"
  full: "9999px"
spacing:
  xs: "8px"
  sm: "12px"
  md: "16px"
  lg: "20px"
  xl: "28px"
  page: "32px"
components:
  button-primary:
    backgroundColor: "{colors.grafite}"
    textColor: "{colors.branco-suave}"
    rounded: "{rounded.lg}"
    padding: "10px 16px"
    typography: "{typography.body}"
  button-primary-hover:
    backgroundColor: "{colors.grafite-profundo}"
    textColor: "{colors.branco-suave}"
    rounded: "{rounded.lg}"
    padding: "10px 16px"
  button-ghost:
    backgroundColor: "oklch(0.145 0 0 / 4%)"
    textColor: "{colors.grafite-profundo}"
    rounded: "{rounded.lg}"
    padding: "10px 16px"
  button-ghost-hover:
    backgroundColor: "oklch(0.145 0 0 / 8%)"
    textColor: "{colors.grafite-profundo}"
    rounded: "{rounded.lg}"
    padding: "10px 16px"
  filter-pill:
    backgroundColor: "transparent"
    textColor: "oklch(0.145 0 0 / 45%)"
    rounded: "{rounded.full}"
    padding: "6px 14px"
  filter-pill-active:
    backgroundColor: "oklch(0.205 0 0 / 10%)"
    textColor: "{colors.grafite-profundo}"
    rounded: "{rounded.full}"
    padding: "6px 14px"
  status-tab-active:
    backgroundColor: "{colors.grafite}"
    textColor: "{colors.branco-suave}"
    rounded: "{rounded.md}"
    padding: "6px 14px"
  status-tab-inactive:
    backgroundColor: "transparent"
    textColor: "oklch(0.145 0 0 / 55%)"
    rounded: "{rounded.md}"
    padding: "6px 14px"
  card-default:
    backgroundColor: "{colors.papel}"
    textColor: "{colors.grafite-profundo}"
    rounded: "{rounded.card}"
    padding: "16px"
  card-featured:
    backgroundColor: "oklch(0.205 0 0 / 8%)"
    textColor: "{colors.grafite-profundo}"
    rounded: "{rounded.card}"
    padding: "20px"
  input-search:
    backgroundColor: "oklch(0.145 0 0 / 4%)"
    textColor: "{colors.grafite-profundo}"
    rounded: "{rounded.lg}"
    padding: "8px 14px"
---

# Design System: Vello Console

## 1. Overview

**Creative North Star: "O Caderno de Campo"**

O Vello Console é o caderno de campo do consultor de crédito. Como um caderno profissional bem mantido, cada elemento ocupa exatamente o espaço que merece, nada é decorativo, e a informação chega antes de ser pedida. O sistema não impressiona pela beleza: impõe respeito pela clareza. Quando o consultor abre o painel para checar uma proposta antes de uma ligação com o cliente, o trabalho já foi feito — SLAs em evidência, volumes à vista, filtros que não exigem descoberta.

A paleta é quase acromática: grafite profundo sobre papel branco, com acentos cromáticos reservados exclusivamente para dados: os tipos de produto financeiro (Âmbar para FGTS, Ciano Fundo para Consignado INSS, Índigo, Limão, Âmbar Suave) e os estados semânticos (Verde Aprovação, Vermelho Alerta). Cor é sinal, nunca decoração. Profundidade é expressa através de opacidade de borda, não de sombras: bordas em `primary/10` em repouso, `primary/25` no hover.

O que o sistema rejeita explicitamente: hero-metrics com gradientes decorativos; grids de cards com ícone + título + texto genérico; paletas de "finança clássica" em azul-marinho e dourado; qualquer coisa que pareça um template comprado. Se poderia estar em qualquer SaaS, está errada.

**Key Characteristics:**
- Paleta acromática: grafite + papel, sem matiz na base neutra
- Cor entra apenas para dados e estados semânticos
- Profundidade via opacidade de borda, sem box shadows em nenhum estado
- Cards com 16px de radius, bordas sutis, hover suave
- Geist Sans: limpo sem ser frio; Geist Mono para IDs e códigos de referência
- Hierarquia por peso e escala, nunca por cor
- Cópia no tom de colega: "Você tem 3 propostas em risco de SLA"

## 2. Colors: A Paleta Grafite-Campo

A base tem chroma zero. Toda cor com matiz na paleta é um dado operacional, não decoração.

### Primary
- **Grafite** (`oklch(0.205 0 0)`): Cor de ação. Botão primário, estado ativo de abas e filtros, ícone de navegação ativo. Aparece em menos de 15% de qualquer tela; sua raridade é o que dá peso ao estado ativo.
- **Grafite Profundo** (`oklch(0.145 0 0)`): Texto principal, headings, valores monetários. A cor mais presente no sistema, sempre como tipografia, nunca como superfície de fundo.

### Neutral
- **Papel** (`oklch(1 0 0)`): Fundo de tela e de cards em light mode. Superfície base.
- **Branco Suave** (`oklch(0.985 0 0)`): Texto sobre Grafite (botão primário, abas ativas). Background da sidebar.
- **Cinza Suave** (`oklch(0.97 0 0)`): Superfícies secundárias, backgrounds de input e de segmented tab container.
- **Chumbo** (`oklch(0.556 0 0)`): Texto secundário, labels de suporte, ícones em repouso. Nunca para texto de body principal.
- **Névoa** (`oklch(0.922 0 0)`): Bordas em repouso, divisores, separators.

### Semantic
- **Verde Aprovação** (`oklch(0.596 0.145 163.225)`): Exclusivo para status "Pago" e deltas positivos. Nunca como cor de marca ou decoração.
- **Vermelho Alerta** (`oklch(0.577 0.245 27.325)`): Exclusivo para status "Reprovada", SLA em risco, e erros de formulário. Nunca como destaque genérico.

### Data
Cinco cores para os tipos de produto financeiro. Usadas como pontos (10x10px, radius 2px), fills de avatar (25% de opacidade), e traços de sparkline. Nunca como cor de superfície de card ou acento de UI.

- **Âmbar** (`oklch(0.646 0.222 41.116)`): FGTS
- **Ciano Fundo** (`oklch(0.600 0.118 184.704)`): Consignado INSS
- **Índigo** (`oklch(0.398 0.070 227.392)`): Consignado Federal
- **Limão** (`oklch(0.828 0.189 84.429)`): Consignado Privado
- **Âmbar Suave** (`oklch(0.769 0.188 70.080)`): Crédito Pessoal

### Named Rules

**The Achromatic Foundation Rule.** A base neutra tem chroma zero — nenhum matiz nos backgrounds, borders ou texto padrão. Cor cromática entra apenas para dados de produto e estados semânticos. Nunca use chart colors como acento decorativo, cor de marca, ou destaque editorial.

**The Border-Depth Rule.** Profundidade é comunicada por opacidade de borda: `oklch(primary / 10%)` em repouso, `oklch(primary / 25%)` no hover, `oklch(primary / 20%) + bg primary/8%` para superfícies em destaque. Nenhuma sombra em nenhum estado.

## 3. Typography

**Display Font:** Geist Sans (system-ui, sans-serif como fallback)
**Label/Mono Font:** Geist Mono (ui-monospace, monospace como fallback)

**Character:** Geist Sans é geométrico mas humanista: limpo o suficiente para densidades de dados, sem a frieza de fontes puramente técnicas. O par Geist Sans + Geist Mono cria distinção clara entre informação narrativa e informação de referência (IDs, códigos de proposta).

### Hierarchy

- **Display** (600, 2.25rem, line-height 1, tracking -0.025em): Títulos de página. O ponto em `text-primary` ao final do título (ex: `Propostas.`) é o único ornamento tipográfico do sistema.
- **Headline** (700, 1.875rem, line-height 1, tracking -0.025em): Valores de KPI e métricas primárias. Números em destaque máximo.
- **Title** (500, 1rem, line-height 1.5): Nomes de cliente em cards, subcabeçalhos de seção.
- **Body** (400/500, 0.875rem, line-height 1.5): Texto operacional, labels de filtro, conteúdo de cards. Max 75ch em cópia corrida.
- **Label** (500, 0.75rem, letter-spacing 0.12em, uppercase): Labels de categoria sobre títulos de página e cabeçalhos de KPI card. Sempre uppercase com tracking largo.
- **Mono** (Geist Mono, 0.6875rem, letter-spacing 0.06em): IDs de proposta (`PROP-A1B2C`), códigos de referência. Nunca para texto narrativo.

### Named Rules

**The Tight Numbers Rule.** Valores monetários e numéricos usam tracking negativo (-0.025em). Labels de categoria usam tracking positivo (0.12em) uppercase. Nunca misture: número rastreado largo ou label rastreada apertada quebra a hierarquia.

**The Point Rule.** O ponto final colorido após o título de página (`Propostas.`) é o único ornamento tipográfico do sistema, e `text-primary` nunca aparece em tipografia fora desse contexto e de botões ou estados ativos.

## 4. Elevation

O sistema é plano por padrão. Não há box shadows em nenhuma superfície, em nenhum estado. Profundidade é comunicada inteiramente por três mecanismos:

1. **Opacidade de borda**: `border-primary/10` em repouso → `border-primary/25` no hover
2. **Tint de fundo**: cards em destaque usam `bg-primary/8` para diferenciar hierarquia sem elevar visualmente
3. **Contexto de sidebar**: o background da sidebar (`oklch(0.985)`) vs. o fundo principal (`oklch(1)`) cria separação por tint, não por sombra ou borda pesada

Se você está prestes a adicionar `box-shadow`: esse é o sinal de que a solução está na opacidade de borda ou no tint de fundo.

### Named Rules

**The Flat-By-Default Rule.** Superfícies são planas em repouso. Hover escurece a borda. Featured escurece o fundo. Nenhuma das duas estratégias usa sombra. Jamais.

## 5. Components

### Buttons

Precisos e acolhedores: cantos arredondados (10px), transição suave de 150ms, sem bordas rígidas no primário.

- **Shape:** Gently rounded (10px, `rounded-lg`)
- **Primary:** Grafite (`oklch(0.205)`) fundo, Branco Suave texto, padding 10px 16px, font-size 0.875rem, font-weight 600. Hover: Grafite Profundo (`oklch(0.145)`).
- **Ghost:** `oklch(foreground / 4%)` fundo, borda `border-primary/16`, mesmos padding e radius. Para ações secundárias (Exportar CSV, seletores de período).
- **Focus:** `outline-ring/50` padrão shadcn. Nunca remova o indicador de foco sem substituição.
- **Disabled:** opacity do browser, sem custom styling.

### Filter Pills

Filtros de tipo de produto. Distintos dos botões por shape (rounded-full) e comportamento de seleção.

- **Shape:** Fully rounded (`rounded-full`), padding 6px 14px
- **Inactive:** sem fundo, sem borda, texto `foreground/45`, hover `hover:text-foreground`
- **Active:** `bg-primary/10 border border-primary/30 text-foreground`. O ponto colorido (10x10px, radius 2px) à esquerda do label identifica o produto visualmente.
- **Count badge:** inline à direita, `text-foreground/55` ativo, `text-foreground/30` inativo.

### Cards / Containers

O padrão de container principal do sistema.

- **Corner Style:** 16px (`rounded-2xl`)
- **Background:** `bg-card` (papel/branco em light)
- **Shadow Strategy:** Nenhuma. Ver Elevation.
- **Border:** `border border-primary/10` em repouso, hover `border-primary/25`
- **Internal Padding:** 16px (`p-4`) padrão para cards de proposta, 20px (`p-5`) para KPI cards
- **Featured variant:** `border-primary/20 bg-primary/8` — para o KPI card em destaque

### Inputs / Fields

- **Style:** `bg-foreground/4 border border-primary/10 rounded-lg`, padding 8px 14px
- **Ícone à esquerda:** `size-3.5`, `text-foreground/55`
- **Placeholder:** `text-foreground/40`
- **Focus:** borda escurece para `primary/25` no container; sem ring custom interno.
- **Segmented tab container:** `bg-foreground/4 border border-primary/10 rounded-lg p-0.5` — os tabs ficam dentro como itens com `rounded-md`.

### Navigation

- **Sidebar width:** 220px (CSS variable `--sidebar-width`)
- **Item shape:** `rounded-md` (~6px), padding 8px 10px
- **Active:** `bg-sidebar-accent text-sidebar-accent-foreground font-medium`, ícone em `text-sidebar-primary`
- **Inactive:** `text-sidebar-foreground/70`
- **Hover:** `bg-sidebar-accent/40 text-sidebar-foreground`
- **Badge numérico:** `rounded-full text-[10px]`, ativo: `bg-black/20 text-white`, inativo: `bg-muted text-muted-foreground`
- **Transition:** `transition-colors` em todos os estados

### Status Badge (Componente de assinatura)

O sistema de status combina um ponto de 6px com texto colorido em token semântico: nunca uma badge opaca, nunca um chip com fundo de cor sólida. Simples, legível, sem ruído visual.

- **Em análise:** ponto `bg-primary`, texto `text-primary`
- **Pago:** ponto `bg-success`, texto `text-success`
- **Reprovada:** ponto `bg-destructive`, texto `text-destructive`
- **Simulação / Arquivada:** ponto `bg-muted-foreground`, texto `text-foreground/40` ou `/55`

## 6. Do's and Don'ts

### Do:

- **Do** usar `tracking-tight` (-0.025em) em todos os valores numéricos e monetários (KPIs, valores de proposta).
- **Do** usar `text-xs uppercase tracking-[0.12em]` para labels de categoria acima de headings.
- **Do** expressar hover em cards escurecendo a borda: `hover:border-primary/25`.
- **Do** usar chart colors apenas como pontos (10x10px radius 2px), fills de avatar (25% opacidade), e traços de sparkline.
- **Do** usar Geist Mono para IDs de proposta, códigos de referência, e qualquer valor que o consultor precise comparar ou copiar.
- **Do** manter o ponto colorido no título de página (`Propostas.`) como único ornamento tipográfico.
- **Do** usar status badges como ponto (6px) + texto colorido em token semântico, sem chip ou badge opaca.
- **Do** falar como colega na cópia: "Você tem 3 propostas em risco de SLA", não "3 propostas com SLA em risco detectadas".
- **Do** variar padding para criar ritmo: `p-4` em cards de proposta, `p-5` em KPI cards, `p-8` em containers de página.

### Don't:

- **Don't** adicionar box shadows. Nem `shadow-sm`. Nem `drop-shadow`. Nenhuma sombra em nenhum estado.
- **Don't** usar hero-metrics com gradiente decorativo: número grande, label pequena, gradiente de acento. É exatamente o padrão que esse sistema recusa.
- **Don't** usar chart colors fora do contexto de dados. `ambar` não é cor de acento de UI, é a cor do FGTS.
- **Don't** criar grids de cards com ícone + heading + texto genérico. Cards carregam dados operacionais reais.
- **Don't** usar `border-left` maior que 1px como stripe colorida em cards ou list items. Se precisar de destaque, use tint de fundo (`bg-primary/8`).
- **Don't** usar gradient text (`background-clip: text`). Texto é sempre uma cor sólida.
- **Don't** usar azul-marinho e dourado como paleta. É a primeira reflex de "SaaS financeiro" que esse sistema recusa por princípio.
- **Don't** escalar o padding uniformemente em toda a interface. Ritmo vem da variação.
- **Don't** usar em dashes (—) na cópia. Use vírgula, dois-pontos, ponto-e-vírgula, ou parênteses.
- **Don't** usar glassmorphism. Blur + glass card é decoração, não profundidade.
