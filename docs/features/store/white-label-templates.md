# Spec: Sistema de Templates White-label — Vello Store

**Status:** Aprovado para implementação  
**Escopo:** `apps/store`  
**Impacto:** `supabase/migrations`, `packages/config`

---

## 1. Contexto e objetivo

A Vello Store serve dois tipos de tenant (campo `tenants.type`):

| Tipo | Definição | Customização permitida |
|---|---|---|
| `subscription` | Consultor assinante da Vello | Logo + cor primária (via `base_color` já existente) |
| `whitelabel` | Cliente com marca própria e domínio dedicado | Tudo via template de código deployado por um dev |

Hoje ~35% do white-label está implementado. Logo e nome funcionam; copy, layout e cores estão hardcoded com TODOs explícitos. Esta spec define como estruturar a customização sem quebrar a experiência dos assinantes.

**Objetivo:** criar um sistema de templates code-first que permita a um dev criar e subir um novo white-label sem modificar os componentes compartilhados da store.

**Princípios:**
- Todo trabalho de customização é feito por um dev da Vello, não pelo cliente via UI
- O banco só registra qual template usar (`template_id`). Conteúdo, cores e layout vivem no código
- Assinantes usam o template `default` e nunca configuram copy — só logo e `base_color`
- A UI de `base_color` para assinantes já existe no Console; a integração com o tema da store é trabalho futuro

---

## 2. Modelo de dois níveis

### 2.1 Assinante (`subscription`)

- O que é configurável hoje: `logo_url`, `favicon_url`, `company_display_name`, `base_color`
- O que é configurável via template: nada — usa sempre o template `default`
- Copy, layout, navegação e imagens são fixos, gerenciados pela Vello
- Vantagem: assinantes recebem automaticamente qualquer melhoria que a Vello fizer na store

### 2.2 White-label (`whitelabel`)

- Um dev cria um template TypeScript com todas as definições do white-label
- O banco aponta para o `template_id` desse template
- O template pode customizar: cores, copy, imagens, ícones, estrutura de layout e substituir componentes inteiros
- Não há interface de edição — todas as mudanças passam por deploy

---

## 3. Arquitetura de templates

### 3.1 Estrutura de arquivos

```
apps/store/src/templates/
├── index.ts                    ← registry: mapeia templateId → TemplateConfig
├── _types.ts                   ← TemplateConfig e tipos derivados
│
├── default/                    ← experiência padrão Vello (assinantes + fallback)
│   └── config.ts
│
└── zp/                         ← primeiro white-label (ZP Pay)
    ├── config.ts               ← cores, copy, navegação, layout
    ├── assets/                 ← logo, favicon, imagem da hero etc.
    │   ├── logo.svg
    │   └── favicon.png
    └── components/             ← overrides de componentes (apenas quando necessário)
        └── hero.tsx
```

### 3.2 TemplateConfig (tipo central)

```typescript
// apps/store/src/templates/_types.ts

export type OklchColor = {
  l: number   // lightness  0–1
  c: number   // chroma     0–0.4
  h: number   // hue        0–360
}

export type ColorTokens = {
  primary:    OklchColor
  background: OklchColor
  surface:    OklchColor
  // foreground, primary-foreground, surface-foreground e card são
  // derivados automaticamente por generateThemeCss()
}

export type NavItem = { label: string; href: string }

export type HowItWorksStep = {
  title:       string
  description: string
  icon:        string   // nome do ícone Lucide
}

export type TemplateContent = {
  hero: {
    eyebrow:   string
    headline:  string   // suporta o token {{displayName}}
    lede:      string
    imageUrl?: string   // URL pública de imagem de fundo da hero (opcional)
  }
  cta: {
    title:       string
    description: string
    testimonial?: { text: string; author: string }
  }
  productsSection: {
    title:       string
    description: string
  }
  howItWorks: {
    title: string
    steps: HowItWorksStep[]
  }
}

export type TemplateLayout = {
  hero: 'split' | 'centered'
  // 'split'    = layout atual (texto à esq, visual decorativo à dir)
  // 'centered' = headline centralizada, sem painel decorativo
}

export type TemplateNavigation = {
  header:         NavItem[]
  footer:         NavItem[]
  footerTagline?: string
  socials?: {
    whatsapp?:  string
    instagram?: string
    linkedin?:  string
  }
}

// Cada chave é opcional. Se não fornecida, o componente default é usado.
export type ComponentOverrides = {
  Hero?:            React.ComponentType<HeroProps>
  ProductsSection?: React.ComponentType<ProductsSectionProps>
  CtaBanner?:       React.ComponentType<CtaBannerProps>
  HowItWorks?:      React.ComponentType<HowItWorksProps>
  StoreHeader?:     React.ComponentType<StoreHeaderProps>
  StoreFooter?:     React.ComponentType<StoreFooterProps>
}

export type TemplateConfig = {
  id:          string       // 'zp', 'default' — deve ser único no registry
  displayName: string       // nome legível, ex: 'ZP Pay'
  colors:      ColorTokens
  content:     TemplateContent
  navigation:  TemplateNavigation
  layout:      TemplateLayout
  components?: ComponentOverrides
}
```

### 3.3 Registry

```typescript
// apps/store/src/templates/index.ts

import { defaultTemplate } from './default/config'
import { zpTemplate }      from './zp/config'
import type { TemplateConfig } from './_types'

const registry: Record<string, TemplateConfig> = {
  default: defaultTemplate,
  zp:      zpTemplate,
}

export function getTemplate(templateId: string | null | undefined): TemplateConfig {
  return registry[templateId ?? 'default'] ?? registry.default!
}
```

---

## 4. Sistema de cores

### 4.1 Geração das CSS variables

Uma única função utilitária (em `packages/config`) gera o bloco `:root` com todas as variáveis CSS a partir dos 3 tokens base do template:

```typescript
// packages/config/src/generate-theme.ts

export function generateThemeCss(colors: ColorTokens): string {
  const { primary: p, background: bg, surface: s } = colors
  const fgLightness = (base: number) => base > 0.5 ? 0.1 : 0.96
  return `
    :root {
      --primary:             oklch(${p.l} ${p.c} ${p.h});
      --primary-foreground:  oklch(${fgLightness(p.l)} 0.01 ${p.h});
      --background:          oklch(${bg.l} ${bg.c} ${bg.h});
      --foreground:          oklch(${fgLightness(bg.l)} 0.015 ${bg.h});
      --surface:             oklch(${s.l} ${s.c} ${s.h});
      --surface-foreground:  oklch(${fgLightness(s.l)} 0.02 ${s.h});
      --card:                oklch(${Math.min(s.l + 0.04, 1)} ${s.c * 0.5} ${s.h});
    }
  `
}
```

### 4.2 Como é injetado

No `layout.tsx` da store, após resolver o tenant:

```typescript
const template  = getTemplate(branding?.template_id)
const themeCss  = generateThemeCss(template.colors)
// injetado como <style data-theme> antes de globals.css
// globals.css passa a conter apenas reset e utilitários,
// sem variáveis de cor hardcoded
```

### 4.3 Assinantes e `base_color`

O campo `base_color` já existe em `tenant_branding`. Quando o sistema de cores para assinantes for implementado (v3+), ele lerá esse campo e sobrescreverá apenas o token `primary` do template `default`. O restante da estrutura já suporta isso — não há mudança arquitetural necessária no futuro.

---

## 5. Sistema de conteúdo

### 5.1 Cadeia de resolução (simples)

```
tenant.template_id → getTemplate() → TemplateConfig
                                           ↓
                                    template.content  (copy)
                                    template.colors   (tema)
                                    template.layout   (estrutura)
                                    template.navigation
```

Sem cadeia de fallback por campo. O template é a única fonte de verdade para conteúdo.

### 5.2 Acesso nos componentes

**Server Components** recebem o template como prop:

```typescript
// app/(store)/page.tsx
const template = getTemplate(branding?.template_id)
return <HeroSection template={template} displayName={branding?.company_display_name} />
```

**Client Components** acessam via contexto (para evitar prop drilling):

```typescript
// lib/template/template-context.tsx
'use client'
export const TemplateContext = createContext<TemplateConfig>(defaultTemplate)

// lib/template/use-template.ts
'use client'
export const useTemplate = () => useContext(TemplateContext)
```

O `TemplateProvider` é adicionado ao `layout.tsx` da store, depois da resolução do tenant.

### 5.3 Token `{{displayName}}`

Qualquer campo de `content` pode conter `{{displayName}}`. Uma função utilitária substitui em render:

```typescript
export function resolveToken(text: string, displayName: string | null): string {
  return text.replace('{{displayName}}', displayName ?? 'nossa plataforma')
}
```

---

## 6. Overrides de componentes

Templates podem substituir qualquer componente listado em `ComponentOverrides`. Quando uma chave não está definida, o componente default da store é usado.

### 6.1 Convenção de uso nas páginas

```typescript
// app/(store)/page.tsx
import { HeroSection as DefaultHero } from './_components/hero-section'

const template     = getTemplate(branding?.template_id)
const HeroSection  = template.components?.Hero ?? DefaultHero

return <HeroSection template={template} displayName={...} featuredProductId={...} minRate={...} />
```

### 6.2 Contrato de props

Cada componente default exporta o seu tipo de props. Um componente override **deve** aceitar o mesmo contrato:

```typescript
// _components/hero-section.tsx
export type HeroProps = {
  template:          TemplateConfig
  displayName:       string | null
  featuredProductId: string | null
  minRate:           number | null
}

export function HeroSection(props: HeroProps) { ... }
```

O arquivo `_types.ts` do template re-exporta todos os tipos de props para que o dev possa importar ao criar um override.

---

## 7. Mudança no banco

Uma única coluna nova em `tenant_branding`:

```sql
ALTER TABLE tenant_branding
  ADD COLUMN template_id TEXT;

COMMENT ON COLUMN tenant_branding.template_id IS
  'Slug do template white-label (ex: "zp"). NULL = usa o template default da Vello.';
```

Nada mais. Não há `tenant_content`, não há colunas de cor por componente, não há overrides via banco. Todo o conteúdo vive no código do template.

**RLS:** sem novas políticas. `template_id` é escrito diretamente via SQL pela equipe da Vello ao ativar um white-label.

---

## 8. Workflow do dev para novo white-label

```
1. Receber briefing (cores em hex, copy de cada seção, logo em SVG, imagens)
2. Criar apps/store/src/templates/[slug]/
3. Converter cores para OKLCH → oklch.com
4. Criar config.ts preenchendo todos os campos de TemplateConfig
5. Adicionar assets em assets/ (logo, favicon, imagens)
6. Criar components/ apenas se o layout padrão não atender
7. Registrar o template em templates/index.ts
8. Deploy da store (vercel deploy)
9. UPDATE tenant_branding SET template_id = '[slug]' WHERE tenant_id = '...'
10. Validar no domínio/subdomínio do tenant
```

**Tempo estimado:**
- Template só de dados (copy + cores): 4–8 horas
- Template com 1–2 componentes customizados: 1–2 dias
- Template com layout completamente diferente: 3–5 dias

---

## 9. Template ZP (v1) — plano de implementação

### Cores

| Token | Valor OKLCH | Referência |
|---|---|---|
| `primary` | `0.83 0.10 85` | âmbar dourado (atual) |
| `background` | `0.13 0.015 45` | marrom escuro (designs existentes) |
| `surface` | `0.97 0.01 85` | off-white quente |

### Layout
- `hero: 'split'` — mantém o layout atual com painel decorativo

### Componentes a sobrescrever
- `HeroSection` — copy específico do ZP já definido abaixo
- `CtaBanner` — copy e testimonial do ZP (a confirmar com o cliente)

### Copy da hero ZP

```
eyebrow:  "Soluções de Crédito"
headline: "Crédito inteligente para realizar seus planos"
lede:     "Simule gratuitamente, compare condições e avance na
           contratação com total segurança. Rápido, digital e sem burocracia."
```

### Navegação ZP

```
header: [Produtos, Como funciona, Sobre]
footer: [Privacidade, Termos, Suporte]
```

---

## 10. Plano de migração (hardcoded → configurável)

| Fase | Entregável | Notas |
|---|---|---|
| **v1 (esta spec)** | `generateThemeCss()` + migration `template_id` | Remove cores hardcoded de globals.css |
| **v1** | Template `default` com copy atual da store | Zero regressão para assinantes |
| **v1** | Template `zp` formalizado | ZP configurado via template em vez de TODOs |
| **v2** | `TemplateProvider` + `useTemplate()` em todos os componentes | Elimina todos os TODOs de copy |
| **v2** | Suporte a `components?` overrides ativo em todas as páginas | Layouts diferentes por template |
| **v3** | Integração de `base_color` para assinantes | Usa estrutura já existente no banco |

---

## 11. Fora do escopo desta spec

- Overrides de conteúdo via banco (sem `tenant_content`, sem UI de edição)
- Self-service de configuração por assinantes (v3+)
- Upload de assets pelo cliente (tudo via dev + deploy)
- i18n por tenant
- PDF de simulação (spec separada)
- Geração automática de tema a partir da logo (color extraction)
