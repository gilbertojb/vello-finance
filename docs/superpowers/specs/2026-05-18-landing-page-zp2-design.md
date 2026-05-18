# Landing Page v2 — Template `zp2`

**Data:** 2026-05-18  
**App:** `apps/store`  
**Escopo:** Nova landing page pública do tenant ZP Pay, criada como template independente `zp2`. A landing atual (`zp`) permanece no ar até aprovação e substituição manual.

---

## Contexto e motivação

A landing page atual (`templates/zp`) apresenta três problemas de comunicação:

1. **Cards flutuantes incorretos** — o lado direito do hero exibe "Crédito Pessoal" e "Consignado INSS", produtos que não estão operando.
2. **Depoimento inválido** — o `CtaBanner` cita consignado INSS na fala do cliente.
3. **Página muito textual** — poucas âncoras visuais, experiência cansativa para o usuário.

Além disso, a página não possui seção de FAQ (solicitada pelo time de produto para reduzir atrito na conversão).

---

## Decisões de design

### Abordagem de implementação
Template `zp2` independente — diretório próprio `templates/zp2/` com cópia completa dos arquivos. Nenhum componente é compartilhado com `templates/zp/`. Motivo: isolamento total enquanto a versão atual está no ar; após aprovação, `zp` é substituído por `zp2`.

### Cores
Usar **exclusivamente os tokens CSS do tema** (`bg-background`, `bg-surface`, `text-foreground`, `text-primary`, `bg-primary`, `text-primary-foreground`, `text-surface-foreground`, `border-primary/20`, `text-accent-olive`, etc.). Nenhum valor arbitrário Tailwind.

### Tipografia
Substituir `Poppins` + `Playfair Display` por:
- **Plus Jakarta Sans** — sans-serif (weights 300/400/500/600/700/800)
- **Instrument Serif** — serif italic para destaques de headline

Ambas via `next/font/google`. Atualizar as variáveis `--font-sans` e `--font-serif` no layout do template `zp2`.

### Seções alternadas claro/escuro
| # | Seção | Fundo | Imagem |
|---|-------|-------|--------|
| Header | `ZpHeader` | `bg-background` sticky | — |
| ① | Hero | `bg-background` | Lateral direita (`hero-bg.jpg`) |
| ② | Benefícios | `bg-surface` | Fundo com overlay (`benefits-bg.jpg`) |
| ③ | Parceiros | `bg-background` | — |
| ④ | Produtos | `bg-surface` | — |
| ⑤ | Como funciona | `bg-background` | Fundo com overlay (`how-it-works-bg.jpg`) |
| ⑥ | Proposta de valor | `bg-surface` | Lateral direita (`value-prop.jpg`) |
| ⑦ | FAQ | `bg-background` | — |
| Footer | `ZpFooter` | `bg-background` | — |

### Botões CTA
Um único padrão para toda a página: `bg-primary text-primary-foreground rounded-xl font-semibold`. Não existe variante de botão diferente entre seções claras e escuras.

---

## Seções — spec detalhada

### ① Hero
**Componente:** `hero-section.tsx`  
**Layout:** `grid grid-cols-[1.05fr_1fr] gap-16 py-24 max-lg:grid-cols-1 max-lg:gap-12`

**Coluna esquerda:**
- Badge pill com dot verde pulsante + nome do tenant
- `<h1>` `text-5xl max-sm:text-4xl` — sans light + em serif italic `text-primary`
- Copy headline: *"Precisa de crédito? Vamos te ajudar a encontrar o melhor caminho."*
- Subtítulo: *"Compare, simule e contrate com rapidez."*
- 4 links de produto (`rounded-2xl border border-primary/20 bg-primary/6`):
  - Crédito Pessoa Física → `/simulador/pessoa-fisica`
  - Crédito Pessoa Jurídica → `/simulador/pessoa-juridica`
  - Financiamentos → `/simulador/financiamentos`
  - Fazer Simulação Gratuita → `/simulador` (destaque `bg-primary/18`)

**Coluna direita:**
- `<div className="relative h-hero-image rounded-3xl overflow-hidden border border-primary/12 max-lg:hidden">`
- `<Image src="/images/zp2/hero-bg.jpg" fill sizes="(max-width: 1280px) 50vw, 640px" className="object-cover object-top" priority />`
- `<div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-background" />`
- Em mobile (`max-lg`): a coluna direita some; a seção inteira ganha `bg-[image:url('/images/zp2/hero-bg.jpg')] bg-cover bg-top` + `before:absolute before:inset-0 before:bg-background/80` para um efeito de fundo sutil sem prejudicar a leitura dos botões.

Props recebidas: `displayName: string | null` (sem `minRate` — rate display removido junto com os cards).

---

### ② Benefícios
**Componente:** `benefits-section.tsx` (novo)  
**Background:** `bg-surface`

- Pill label + `<h2>` com em serif abaixo do pill
- `<h2>` `text-5xl max-sm:text-4xl`
- Copy: *"Benefícios de contratar crédito com a gente"*
- Grid `grid-cols-3 gap-3 max-lg:grid-cols-2 max-sm:grid-cols-1` com 5 cards
- Cada card: ícone Lucide (38×38, `bg-primary/8 rounded-xl`) + título bold + descrição
- Benefícios:
  1. **Processo simples e 100% online** — `ShieldCheck`
  2. **Crédito para todos os perfis** — `Users`
  3. **Compare várias opções de uma vez** — `LayoutGrid`
  4. **Aumenta suas chances de aprovação** — `TrendingUp`
  5. **Pode encontrar taxas melhores** — `CircleDollarSign`
- Imagem de fundo (`/images/zp2/benefits-bg.jpg`): `<Image fill className="object-cover" sizes="100vw" />` + `<div className="absolute inset-0 bg-surface/80" />`. A seção funciona sem a imagem (background `bg-surface` por padrão).

---

### ③ Parceiros
**Componente:** `partners-section.tsx` (novo)  
**Background:** `bg-background`

- Layout centralizado `text-center px-8 py-20`
- Pill label + parágrafo
- Linha de logos: `flex flex-wrap gap-4 justify-center` — 5 boxes (`border border-foreground/8 bg-foreground/4 rounded-lg px-5 h-9`). `flex-wrap` garante quebra de linha em mobile.
- CTA: `<Link href="/simulador">` com `bg-primary text-primary-foreground`
- Layout: `text-center` com radial-gradient sutil de `primary/8` vindo da base

> **Nota de implementação:** logos são placeholders por ora. Quando os arquivos SVG/PNG estiverem disponíveis, substituir os boxes por `<Image>` com `object-contain`.

---

### ④ Produtos
**Componente:** `products-section.tsx` (reutilizado do ZP com copy atualizada)  
**Background:** `bg-surface`

- Pill + `<h2>` `text-5xl max-sm:text-4xl` + parágrafo logo abaixo
- Grid de categorias: `grid-cols-3 gap-4 max-lg:grid-cols-1`
  - Em mobile cada categoria vira um card empilhado, clicável
  - **Crédito Pessoa Física:** Saque FGTS, Garantia de Imóvel, Garantia de Veículo
  - **Crédito Pessoa Jurídica:** Capital de Giro, Antecipação de Recebíveis, Crédito com Garantia
  - **Financiamentos:** Financiamento de Imóvel, Financiamento de Veículo
- CTA centralizado abaixo do grid

---

### ⑤ Como funciona
**Componente:** `how-it-works.tsx` (reutilizado com copy atualizada)  
**Background:** `bg-background` + imagem de fundo

- Pill + `<h2>` `text-5xl max-sm:text-4xl` + parágrafo logo abaixo do título
- Copy headline: *"Quatro passos para o crédito na sua mão."*
- Grid de steps: `grid-cols-4 gap-8 max-lg:grid-cols-2 max-sm:grid-cols-1`
- Linha tracejada de conexão: `hidden lg:block` (visível só em desktop onde os 4 steps ficam na mesma linha)
- Copy dos passos (nova, vinda do Google Doc):
  1. **Simule na hora** — "Veja suas possibilidades imediatamente"
  2. **Escolha se quer avançar** — "Sem pressão, você decide"
  3. **Nós cuidamos do envio** — "Sua solicitação é estruturada e enviada para instituições compatíveis"
  4. **Receba retorno** — "E siga com a contratação, se fizer sentido"
- Imagem de fundo: `<Image src="/images/zp2/how-it-works-bg.jpg" fill sizes="100vw" className="object-cover" />` com `<div className="absolute inset-0 bg-background/90" />`. A seção funciona sem a imagem (fundo `bg-background` sólido).

---

### ⑥ Proposta de valor
**Componente:** `value-prop-section.tsx` (novo)  
**Background:** `bg-surface`

- Grid `grid-cols-2 gap-16 items-center max-lg:grid-cols-1`
- **Coluna esquerda:**
  - Pill + `<h2>` `text-5xl max-sm:text-4xl`: *"Você não precisa sair buscando banco por banco."*
  - Parágrafo: *"Aqui você centraliza tudo. Isso reduz erro, tempo e custo na escolha do crédito."*
  - 3 cards de bullet (`bg-white border border-foreground/8 rounded-xl`):
    - **Mais opções** — `LayoutGrid`
    - **Mais velocidade** — `Clock`
    - **Mais controle** — `ShieldCheck`
- **Coluna direita:** imagem lateral
  - `<div className="relative h-96 rounded-3xl overflow-hidden max-lg:hidden">` — oculta em mobile (`max-lg:hidden`); em mobile a seção funciona só com a coluna de texto
  - `<Image src="/images/zp2/value-prop.jpg" fill sizes="(max-width: 1280px) 50vw, 640px" className="object-cover" />`
  - `<div className="absolute inset-0 bg-gradient-to-t from-surface/95 via-transparent to-transparent" />`

---

### ⑦ FAQ
**Componente:** `faq-section.tsx` (novo)  
**Background:** `bg-background`

- Pill + `<h2>`: *"Perguntas frequentes"*
- Implementação: `<Accordion>` do shadcn/ui (`@/components/ui/accordion`)
- 8 perguntas em coluna única, abertura individual
- Estilo: `border border-foreground/8 rounded-xl`, item aberto com `border-primary/22 bg-primary/4`
- Número da pergunta em serif italic `text-primary` antes do texto
- Copy das 8 perguntas: conforme Google Doc (seção FAQ)

---

## Imagens

### Storage
```
apps/store/public/images/zp2/
├── hero-bg.jpg           # 1200×1200 · imagem lateral do hero (container max-w-7xl=1280px, coluna ≈562px, quadrado cobre bem o object-cover)
├── benefits-bg.jpg       # 1920×600  · fundo da seção benefícios
├── how-it-works-bg.jpg   # 1920×800  · fundo do como funciona
└── value-prop.jpg        # 800×1200  · imagem lateral proposta de valor
```

### Uso com `next/image`
- Imagens laterais: `fill` + `object-cover` dentro de container `relative overflow-hidden`
- Imagens de fundo: `fill` + `object-cover` com `<div>` de overlay acima (`z-0` imagem, `z-10` conteúdo)
- Hero (`hero-bg.jpg`): `priority` porque está above-the-fold
- Demais: sem `priority` (lazy load padrão)

### Prompts de geração (Midjourney / DALL·E 3)
**hero-bg.jpg:**
> A confident Brazilian professional, 35 years old, holding a smartphone and smiling naturally. Modern minimalist home office with warm natural light. Shallow depth of field. Dark gradient at the bottom. No text. --ar 4:3 --style raw

**benefits-bg.jpg:**
> Lifestyle photography: three diverse Brazilian people in positive financial moments — entrepreneur at desk, young couple browsing properties on laptop, self-employed professional on video call. Warm airy interiors. No text. --ar 16:5 --style raw

**how-it-works-bg.jpg:**
> Dark cinematic close-up of hands typing on a laptop keyboard, glowing screen, dark moody environment with warm amber accent light. No faces. High contrast, deep shadows. --ar 16:9 --style raw

**value-prop.jpg:**
> A Brazilian family of four standing in front of their new modern house, genuinely happy, golden hour warm lighting. Authentic, not staged. Portrait orientation. No text. --ar 2:3 --style raw

---

## Registro no sistema de templates

```typescript
// templates/index.ts — adicionar entrada para zp2
import { Zp2Home } from './zp2/home'

export function selectTemplate(templateId: string | null) {
  switch (templateId) {
    case 'zp2': return Zp2Home
    case 'zp':  return ZpHome
    default:    return DefaultHome
  }
}
```

```typescript
// templates/zp2/config.ts — mesmas cores do zp
export const zp2Template: TemplateConfig = {
  id: 'zp2',
  colors: {
    primary:    { l: 0.83, c: 0.10, h: 85 },
    background: { l: 0.13, c: 0.015, h: 45 },
    surface:    { l: 0.97, c: 0.01,  h: 85 },
  },
}
```

---

## Estrutura de arquivos criados

```
apps/store/src/templates/zp2/
├── home.tsx                        ← Zp2Home (server component)
├── config.ts                       ← zp2Template config
└── _components/
    ├── hero-section.tsx            ← Hero com imagem lateral
    ├── benefits-section.tsx        ← 5 cards de benefícios (novo)
    ├── partners-section.tsx        ← Logos de parceiros (novo)
    ├── products-section.tsx        ← Produtos por categoria
    ├── how-it-works.tsx            ← 4 passos com copy nova
    ├── value-prop-section.tsx      ← "banco por banco" (novo)
    ├── faq-section.tsx             ← Accordion shadcn (novo)
    ├── header.tsx                  ← Cópia do ZpHeader
    └── footer.tsx                  ← Cópia do ZpFooter

apps/store/public/images/zp2/
├── hero-bg.jpg
├── benefits-bg.jpg
├── how-it-works-bg.jpg
└── value-prop.jpg
```

---

## O que NÃO muda

- `(home)/page.tsx` — apenas adiciona `zp2` no switch de templates
- `templates/zp/` — intocado enquanto está no ar
- Simuladores, formulários de proposta, FGTS wizard — fora do escopo
- Supabase: nenhuma migration necessária

---

## Critérios de conclusão

- [ ] Landing page renderiza corretamente com `template_id = 'zp2'`
- [ ] Nenhum card flutuante com produtos inválidos
- [ ] FAQ funcional em acordeão (shadcn Accordion)
- [ ] Seções alternam claro/escuro conforme spec
- [ ] Todos os botões CTA com `bg-primary text-primary-foreground`
- [ ] Zero valores arbitrários Tailwind (`[]`)
- [ ] Imagens com `next/image` e tratamento de overlay correto
- [ ] Template `zp` original inalterado
