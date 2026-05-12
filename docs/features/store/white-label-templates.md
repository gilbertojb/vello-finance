# Spec: Sistema de Templates White-label — Vello Store

**Status:** Implementado (v1)
**Escopo:** `apps/store`
**Migration:** `supabase/migrations/20260511000000_add_template_id_tenant_branding.sql`

---

## 1. Contexto e objetivo

A Vello Store serve dois tipos de tenant (`tenants.type`):

| Tipo | Customização permitida |
|---|---|
| `subscription` | Logo + nome (via `logo_url` e `company_display_name` no banco) |
| `whitelabel` | Home page 100% customizada via template de código |

**Princípios:**
- Assinantes usam sempre o template `default` — nunca configuram copy
- White-labels recebem um template completo desenvolvido e deployado por um dev da Vello
- O banco registra apenas qual template usar (`template_id`). Todo conteúdo e layout vivem no código
- Do simulador em diante, todos os tenants compartilham o mesmo layout padrão — só as cores mudam via CSS variables

---

## 2. Separação de responsabilidades

| Área | Quem customiza | Como |
|---|---|---|
| Home (`/`) | Template | Componente completo por template, com header/footer próprios |
| Simulador, Solicitar, Produto | Todos os tenants compartilham | CSS variables geradas das cores do template |
| Cores (CSS vars) | Template (via `config.ts`) | `generateThemeCss(template.colors)` no `layout.tsx` raiz |
| Logo / nome | DB (`tenant_branding`) | Passado como props para os componentes do template |

---

## 3. Arquitetura

### 3.1 Estrutura de arquivos

```
apps/store/src/
├── app/
│   ├── layout.tsx                  ← lê template_id, injeta CSS vars no <head>
│   ├── (home)/
│   │   └── page.tsx                ← dispatcher: resolve template → renderiza HomeComponent
│   └── (store)/
│       ├── layout.tsx              ← layout padrão (StoreHeader + StoreFooter) para simulador e além
│       ├── _components/
│       │   ├── store-header.tsx    ← header padrão (usado por assinantes e simulador/solicitar)
│       │   ├── store-footer.tsx    ← footer padrão
│       │   ├── product-card.tsx    ← card de produto (reutilizável pelos templates)
│       │   ├── produto-selector.tsx
│       │   └── simulador-step-indicator.tsx
│       ├── simulador/...
│       ├── solicitar/...
│       └── produto/...
│
└── templates/
    ├── _types.ts                   ← TemplateConfig, TemplateHomeProps, TemplateHomeProduct
    ├── index.ts                    ← getTemplate(), getHomeComponent()
    │
    ├── default/                    ← template Vello (assinantes + fallback)
    │   ├── config.ts               ← id + colors
    │   ├── home.tsx                ← HomeComponent completo (header/footer/seções)
    │   └── _components/
    │       ├── hero-section.tsx
    │       ├── products-section.tsx
    │       ├── how-it-works.tsx
    │       └── cta-banner.tsx
    │
    └── zp/                         ← white-label ZP Pay
        ├── config.ts
        ├── home.tsx
        └── _components/
            ├── header.tsx          ← header próprio (logo ZP + nav ZP)
            ├── footer.tsx          ← footer próprio
            ├── hero-section.tsx
            ├── products-section.tsx
            ├── how-it-works.tsx
            └── cta-banner.tsx
```

### 3.2 Fluxo de resolução

```
Request → middleware → x-tenant-id header
                            ↓
                   layout.tsx (raiz)
                   getTenantBranding(tenantId)
                   getTemplate(branding.template_id)
                   generateThemeCss(template.colors)
                   → injeta <style> no <head> (sobrescreve globals.css)
                            ↓
                   (home)/page.tsx  (rota /)
                   getHomeComponent(branding.template_id)
                   → renderiza HomeComponent com { displayName, logoUrl, products }
```

### 3.3 Tipos centrais

```typescript
// _types.ts

export type OklchColor = { l: number; c: number; h: number }

export type ColorTokens = {
  primary:    OklchColor
  background: OklchColor
  surface:    OklchColor
  // foreground, card, secondary etc. são derivados por generateThemeCss()
}

export type TemplateConfig = {
  id:     string       // slug único: 'default', 'zp'
  colors: ColorTokens
}

export type TemplateHomeProduct = {
  tenantProductId: string
  coverUrl:        string | null
  productName:     string
  productTypeSlug: string | null
  minAmount:       number | null
  maxAmount:       number | null
  minTermMonths:   number | null
  maxTermMonths:   number | null
  minRate:         number | null
}

export type TemplateHomeProps = {
  displayName: string | null   // branding.company_display_name
  logoUrl:     string | null   // branding.logo_url
  products:    TemplateHomeProduct[]
}
```

### 3.4 Registry (`templates/index.ts`)

```typescript
export function getTemplate(templateId: string | null | undefined): TemplateConfig
export function getHomeComponent(templateId: string | null | undefined): ComponentType<TemplateHomeProps>
```

---

## 4. Sistema de cores

### 4.1 Tokens base e derivação

Cada template define 3 tokens em OKLCH. `generateThemeCss()` deriva automaticamente todos os outros:

| CSS Variable | Derivação |
|---|---|
| `--primary` | `colors.primary` direto |
| `--background` | `colors.background` direto |
| `--surface` | `colors.surface` direto |
| `--foreground` | contraste com background (claro ou escuro) |
| `--primary-foreground` | contraste com primary |
| `--surface-foreground` | contraste com surface |
| `--card` | background ± 0.04 L |
| `--secondary` | background ± 0.08 L |
| `--muted-foreground` | foreground com opacidade reduzida |
| `--border` | primary / 0.12 opacidade |

### 4.2 Cores por template

| Template | `primary` | `background` | `surface` |
|---|---|---|---|
| `default` (Vello) | `oklch(0.48 0.25 258)` — azul | `oklch(0.35 0.18 258)` — azul escuro | `oklch(0.42 0.17 258)` — azul médio |
| `zp` (ZP Pay) | `oklch(0.83 0.10 85)` — âmbar | `oklch(0.13 0.015 45)` — marrom escuro | `oklch(0.97 0.01 85)` — off-white quente |

### 4.3 Injeção no layout

```typescript
// app/layout.tsx
const branding  = await getTenantBranding(tenantId)
const template  = getTemplate(branding?.template_id)
const themeCss  = generateThemeCss(template.colors)

// injeta antes do CSS bundle → sobrescreve globals.css para todos os tenants
<style dangerouslySetInnerHTML={{ __html: themeCss }} />
```

---

## 5. Home page por template

A home (`/`) é um **componente React completo** por template — inclui header, footer e todas as seções. Não há layout compartilhado no route group `(home)`.

### 5.1 Dispatcher

```typescript
// app/(home)/page.tsx
const HomeComponent = getHomeComponent(branding?.template_id)
return <HomeComponent displayName={...} logoUrl={...} products={[...]} />
```

### 5.2 Contrato do HomeComponent

Cada template exporta uma função com a assinatura:
```typescript
export function XyzHome({ displayName, logoUrl, products }: TemplateHomeProps): JSX.Element
```

O componente é responsável por incluir seu próprio header e footer.

---

## 6. Rotas compartilhadas (simulador em diante)

As rotas `/simulador/...`, `/solicitar/...`, `/produto/...` e `/confirmacao/...` usam o layout padrão definido em `(store)/layout.tsx`:

```tsx
<div className="flex min-h-svh flex-col">
  <StoreHeader logoUrl={branding?.logo_url} displayName={branding?.company_display_name} />
  <main className="flex-1">{children}</main>
  <StoreFooter displayName={branding?.company_display_name} logoUrl={branding?.logo_url} />
</div>
```

Essas rotas **não** são customizadas por template — apenas as cores mudam via CSS variables.

---

## 7. Banco de dados

Única coluna nova em `tenant_branding`:

```sql
ALTER TABLE tenant_branding
  ADD COLUMN IF NOT EXISTS template_id TEXT;

-- NULL = usa o template default da Vello
```

**Ativação de white-label:**
```sql
UPDATE tenant_branding
SET template_id = 'zp'
WHERE tenant_id = '<uuid-do-tenant>';
```

**Teste / rollback:**
```sql
UPDATE tenant_branding SET template_id = NULL WHERE tenant_id = '<uuid>';
```

---

## 8. Workflow do dev para novo white-label

```
1. Receber briefing: cores em hex, copy, logo em SVG/PNG, design das seções
2. Criar apps/store/src/templates/<slug>/
3. Converter cores para OKLCH → oklch.com
4. Criar config.ts com id + colors
5. Criar home.tsx com o HomeComponent completo
6. Criar _components/ com header, footer e seções customizadas
7. Registrar em templates/index.ts (configRegistry + homeRegistry)
8. Deploy da store
9. UPDATE tenant_branding SET template_id = '<slug>' WHERE tenant_id = '...'
10. Validar no domínio/subdomínio do tenant
```

**Tempo estimado:**
- Cores + copy (sem redesign): 4–8 horas
- Redesign parcial (hero/header): 1–2 dias
- Redesign completo: 3–5 dias

---

## 9. Fora do escopo (v1)

- Customização de copy via banco (tudo vive no código do template)
- Self-service por assinantes (v3+)
- Upload de assets pelo cliente (via dev + deploy)
- Integração de `base_color` para assinantes (v3+)
- PDF de simulação
- Fluxo "Fazer Simulação Gratuita" (definição pendente)
