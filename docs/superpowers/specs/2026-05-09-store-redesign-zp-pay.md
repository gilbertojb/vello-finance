# Spec: Vello Store — Redesign Visual (ZP Pay)

**Data:** 2026-05-09
**App:** `apps/store`
**Status:** aprovado
**Referência:** `/Users/gilbertobueno/Downloads/ZP Pay/ZP Pay.html`
**Escopo:** Redesign completo do visual do store, mantendo toda a arquitetura e rotas existentes da spec `2026-05-06-store-design.md`. Aplica a linguagem visual do ZP Pay via Tailwind + CSS variables. Dark fixo — apenas logo e nome mudam por tenant.

---

## Contexto e Decisões

- **Tema dark fixo:** o store sempre renderiza com fundo dark/gold. Apenas `company_display_name` e `logo_url` variam por tenant. Não há sobrescrita de paleta via CSS variables do tenant.
- **Abordagem:** Tailwind com CSS variables semânticas. CSS variables redefinidas em `globals.css` do store para a paleta ZP Pay. Nenhum CSS custom paralelo.
- **Fontes:** Poppins + Playfair Display via `next/font/google`.
- **PMT:** implementado com taxa fixa (`min_rate_monthly` do produto). Sem slider de taxa.
- **Conteúdo fixo:** copy do hero, stats, steps, depoimento são fixos nesta versão com `TODO` para futura configuração por tenant (JSON/DB).

> **TODO [White-label]:** Toda seção marcada com `// TODO: [White-label]` deve ser migrada para um modelo de configuração por tenant (JSON no banco ou tabela `tenant_store_config`) antes de suportar múltiplos white-labels com identidade própria. Prioridade: baixa — implementar após validação do template ZP Pay.

---

## Seção 1 — Sistema de Tokens e Tipografia

### CSS Variables (`apps/store/src/app/globals.css`)

Redefinir a camada `:root` com a paleta ZP Pay:

| Token | HSL | Papel |
|---|---|---|
| `--background` | `18 25% 6%` | Fundo global (ink) |
| `--foreground` | `36 53% 94%` | Texto principal (paper/cream) |
| `--primary` | `42 73% 69%` | Gold — CTAs e destaques |
| `--primary-foreground` | `22 61% 11%` | Texto sobre gold (brown-deep) |
| `--card` | `20 22% 10%` | Fundo de cards escuros |
| `--card-foreground` | `36 53% 94%` | Texto em cards |
| `--muted` | `20 18% 14%` | Superfícies secundárias |
| `--muted-foreground` | `36 25% 62%` | Texto muted |
| `--border` | `42 73% 69% / 0.12` | Bordas gold-tinted |
| `--surface` | `36 53% 92%` | Seções claras (paper) dentro do dark |
| `--surface-foreground` | `18 60% 10%` | Texto sobre --surface |

> `--surface` é uma CSS variable auxiliar para seções "papel" (grade de produtos, formulário). Não faz parte do shadcn padrão — usar como `bg-[hsl(var(--surface))]` no Tailwind.

### Fontes

```ts
// apps/store/src/app/layout.tsx
import { Poppins, Playfair_Display } from 'next/font/google'

const poppins = Poppins({
  subsets: ['latin'],
  weight: ['300', '400', '500', '600', '700', '800'],
  variable: '--font-sans',
})

const playfair = Playfair_Display({
  subsets: ['latin'],
  style: ['normal', 'italic'],
  weight: ['400', '700'],
  variable: '--font-serif',
})
```

- `font-sans` → Poppins (aplicado no `<body>`)
- `font-serif` → Playfair Display (aplicado via `font-serif` nas headlines com acento itálico)

---

## Seção 2 — Componentes da Home (`/`)

### 2.1 — Header (`store-header.tsx`)

Server Component. Recebe `displayName`, `logoUrl`.

- Sticky com `backdrop-blur-md bg-background/85 border-b border-border`
- Logo: imagem do tenant ou `displayName` como texto com logo-mark quadrado skewed
- Links de navegação fixos (TODO: configurável) com indicador active gold underline
- Botão CTA gold pill: "Simular agora" → `#produtos`
- Mobile: links ocultos, apenas logo + CTA

### 2.2 — Hero (`hero-section.tsx`)

Server Component. Recebe `displayName`, `bgImageUrl`, `featuredProduct` (primeiro produto ativo).

**Esquerda (55%):**
- Eyebrow pill: dot verde animado + texto fixo (TODO: configurável)
- Headline: fonte 300, 76px, com trecho em `font-serif italic text-primary`
- Lede: 17px, `text-foreground/74`
- CTAs: botão gold pill "Simular agora" → `/produto/[featuredProduct.id]` + botão ghost "Ver todas as linhas" → `#produtos`
- Stats strip: 3 métricas com `text-primary` (TODO: configurável via tenant config)

**Direita (45%) — `hero-visual` (apenas visual, sem dados reais):**
- `visual-bg`: gradiente radial gold + grid diagonal sutil
- `floating-card fc1`: card dark com valor simulado mockado (TODO: configurável)
- `ring`: círculo com taxa `min_rate_monthly` do produto em destaque em Playfair italic
- `floating-card fc2`: card claro (surface) com parcela mockada (TODO: configurável)

> Os floating cards usam valores ilustrativos fixos. O ring usa `min_rate_monthly` real do produto em destaque.

**Product Strip (embaixo do hero):**
- 4 chips gerados a partir dos tipos únicos de `tenant_products` ativos
- Cada chip: ícone por `product_type`, label da categoria, taxa `min_rate_monthly`
- Click → `/produto/[tenant_product_id]` do primeiro produto daquele tipo (navegação direta ao simulador)
- Se menos de 4 tipos, renderiza o que tiver

### 2.3 — Products Section (`products-section.tsx`)

Client Component (apenas para lógica de tab filter). Recebe `products[]` como prop do Server pai.

- Eyebrow + headline Playfair italic
- Filter tabs dinâmicos: "Todos" + tipos únicos dos produtos do tenant
- Grid 3 colunas: primeiro produto recebe `featured` (card dark tall com `grid-row: span 2`)
- Cards demais: fundo `--surface` (paper claro)
- Hover: `translateY(-3px)` com shadow
- CTA do card: "Simular condições →" → `/produto/[id]`

**Product Card (`product-card.tsx`) — props inalteradas, visual redesenhado:**
- `product-top`: categoria (product_type label) + badge se hover
- `product-icon`: ícone por tipo com fundo `bg-primary/10 text-primary`
- `product-body`: nome, descrição (se tiver), meta grid (faixa de valor + prazo)
- `product-cta`: rodapé com seta animada

### 2.4 — How It Works (`how-it-works.tsx`)

Server Component. Conteúdo 100% fixo.

```
// TODO: [White-label] mover steps para tenant_store_config
```

- 4 steps em grid com números romanos em `font-serif italic text-primary`
- Linha pontilhada horizontal conectando os circles (CSS via `before:` pseudo-element)
- Fundo: `bg-background` (dark), texto `text-foreground/62`

Steps fixos:
1. "Simule o crédito" — escolha produto, ajuste valor e prazo
2. "Preencha os dados" — formulário digital rápido
3. "Análise instantânea" — proposta analisada em minutos
4. "Crédito aprovado" — acompanhe pelo painel

### 2.5 — CTA Banner (`cta-banner.tsx`)

Server Component. Fundo `--surface` (claro). Conteúdo fixo.

```
// TODO: [White-label] mover copy e depoimento para tenant_store_config
```

- Split: CTA esquerda + card de depoimento direita
- Card depoimento: `bg-white`, `blockquote` em `font-serif italic`, avatar com iniciais
- CTA: headline Playfair, botão dark pill "Iniciar simulação", botão outline

### 2.6 — Footer (`store-footer.tsx`)

Server Component. Recebe `displayName`, `logoUrl`.

- Logo do tenant + links fixos (Privacidade, Termos, Suporte)
- Copyright: `© [ano] [displayName]`
- Fundo `bg-background`, borda superior `border-primary/8`

---

## Seção 3 — Simulador (`/produto/[id]`)

### Layout

Split full-height `min-h-[calc(100vh-78px)]`, sem container centralizado:

```
grid-cols-[5fr_7fr]
```

**Esquerda (dark `bg-background`):**
- Back link gold: "← Voltar aos produtos"
- Eyebrow com categoria do produto
- Headline: `font-light text-6xl` + acento Playfair italic gold
- Lede `text-foreground/70`
- Feature list com ícones (aprovação rápida, taxa garantida, sem afetar score)

**Direita (`bg-[hsl(var(--surface))] text-[hsl(var(--surface-foreground))]`):**
- Header: eyebrow + stepper pill "Etapa 1 de 3" com 3 barrinhas
- Título "Configure sua linha" + subtítulo Playfair italic
- Slider de valor: `min_amount` → `max_amount`, step R$ 500
- Term buttons: `termOptions[]` em grid (max 5 opções, já gerado em `generateTermOptions`)
- Result panel dark: Parcela mensal | CET anual | Botão "Solicitar agora →"
- Fine print com total a pagar

### PMT

Adicionar em `apps/store/src/lib/utils/simulator.ts`:

```ts
export function calcPMT(pv: number, rateMonthly: number, nper: number): number {
  const r = rateMonthly / 100
  if (r === 0) return pv / nper
  return (pv * (r * Math.pow(1 + r, nper))) / (Math.pow(1 + r, nper) - 1)
}

export function calcCETAnual(rateMonthly: number): number {
  const r = rateMonthly / 100
  return (Math.pow(1 + r, 12) - 1) * 100
}
```

`SimulatorPanel` (Client Component) usa `min_rate_monthly` como taxa fixa. Sem slider de taxa. Recalcula PMT a cada mudança de `amount` ou `term`.

---

## Seção 4 — Formulário de Solicitação (`/solicitar/[id]`)

Mantém a estrutura de 2 passos via `?step=` da spec original. Redesign visual apenas.

### Layout geral

Fundo `bg-[hsl(var(--surface))]` (claro). Grid `1fr 380px` com aside sticky.

**Aside (sticky, presente em ambos os passos):**

`summary-card` (dark, `bg-card`):
- Eyebrow + título do produto
- Rows: Valor · Prazo · Taxa (passados via URL params / hidden inputs)
- Total em gold 32px

`help-card` (branco):
- "Precisa de ajuda?" com ícone de chat
- "Conexão protegida" com ícone de lock

### Passo 1 — Dados da simulação

`app-card` (fundo branco, `rounded-2xl border border-border`):

Seções:
- **Dados da simulação:** Finalidade (select), Valor desejado (input R$), Prazo desejado (select)
- **Identificação:** Nome completo, E-mail

Rodapé: back link + "Continuar →" dark pill

Stepper: "Etapa 2 de 3" (1 barra done, 1 curr, 1 pending)

### Passo 2 — Dados pessoais

`app-card` com seções:
- **Dados pessoais:** CPF (máscara), Telefone (máscara), Data nascimento
- **Endereço:** CEP (auto-preenchimento via `/api/cep/[cep]`), Rua, Número, Complemento, Bairro, Cidade (read-only), UF (read-only)

Stepper: "Etapa 3 de 3" (2 barras done, 1 curr)

Rodapé: "Voltar" outline + "Enviar solicitação →" dark pill (disabled sem campos válidos)

### Estilo dos campos

Inputs com borda bottom only (`border-b border-surface-foreground/18`), focus muda para `border-surface-foreground`. Sem box completo — igual ao ZP Pay.

---

## Seção 5 — Tela de Confirmação (`/confirmacao/[id]`)

Fundo `bg-background` (dark). Centralizado `grid place-items-center min-h-[calc(100vh-78px)]`.

- Radial gradient decorativo no canto superior direito
- Ícone de check: círculo 96px, `bg-gradient-to-b from-primary to-primary/70`, glow `shadow-primary/40`
- Headline: `font-light text-6xl` + Playfair italic "recebida."
- Parágrafo com nome do produto em `text-primary`
- `success-meta` grid 3 colunas com borda gold-tinted: Protocolo · Valor · Produto
- Botões: "Voltar ao início" gold pill + "Nova simulação" ghost

---

## Seção 6 — Arquivos modificados / criados

### Novos / reescritos

```
apps/store/src/app/
├── globals.css                                ← reescrever CSS variables
├── layout.tsx                                 ← adicionar next/font (Poppins + Playfair)
└── (store)/
    ├── layout.tsx                             ← reescrever layout (header/footer redesign)
    ├── page.tsx                               ← adicionar featuredProduct às queries
    └── _components/
        ├── store-header.tsx                   ← redesign completo
        ├── hero-section.tsx                   ← redesign completo
        ├── product-strip.tsx                  ← NOVO
        ├── products-section.tsx               ← NOVO (extrai lógica de grid do page.tsx)
        ├── product-card.tsx                   ← redesign visual (interface inalterada)
        ├── how-it-works.tsx                   ← NOVO
        ├── cta-banner.tsx                     ← redesign completo
        └── store-footer.tsx                   ← redesign completo
    └── produto/[id]/
        ├── page.tsx                           ← redesign layout split
        └── _components/simulator-panel.tsx   ← adicionar PMT, redesign visual
    └── solicitar/[id]/
        ├── page.tsx                           ← redesign layout + aside
        └── _components/
            ├── step-indicator.tsx             ← redesign stepper pill
            ├── step-one-form.tsx              ← redesign visual (lógica inalterada)
            └── step-two-form.tsx              ← redesign visual (lógica inalterada)
    └── confirmacao/[id]/
        └── page.tsx                           ← redesign completo

apps/store/src/lib/utils/simulator.ts         ← adicionar calcPMT, calcCETAnual
```

### Inalterados (arquitetura preservada)

```
lib/supabase/*, lib/tenant/*, lib/branding.ts
app/(store)/queries.ts (adicionar featuredProduct query)
app/(store)/solicitar/[id]/actions.ts
app/api/cep/[cep]/route.ts
components/ui/*
```

---

## Critérios de Aceite

- [ ] Tema dark fixo: fundo escuro em todas as rotas independente do tenant
- [ ] Poppins como `font-sans` e Playfair Display como `font-serif` aplicadas corretamente
- [ ] Home: todas as 5 seções renderizando com dados reais (produtos) e conteúdo fixo (demais)
- [ ] Product Strip na home derivado dos tipos de produtos ativos do tenant
- [ ] Simulador: layout split screen, PMT calculado com `min_rate_monthly` do produto
- [ ] Formulário: visual ZP Pay mantendo 2-step flow e Server Action existente
- [ ] Campos do form com estilo border-bottom (sem box completo)
- [ ] Confirmação: design dark centrado com success-meta grid
- [ ] Nenhum valor hardcoded de cor — apenas tokens semânticos e CSS variables
- [ ] `// TODO: [White-label]` presente em hero stats, floating cards, steps, depoimento
- [ ] Responsive: mobile oculta nav-links e hero-visual, stacks splits verticalmente
