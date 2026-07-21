# Spec: White-label Template System — Vello Store

**Status:** Implemented (v1)
**Scope:** `apps/store`
**Migration:** `supabase/migrations/20260511000000_add_template_id_tenant_branding.sql`

---

## 1. Context and goal

The Vello Store serves two tenant types (`tenants.type`):

| Type | Customization allowed |
|---|---|
| `subscription` | Logo + name (via `logo_url` and `company_display_name` in the database) |
| `whitelabel` | 100% custom home page via a code template |

**Principles:**
- Subscription tenants always use the `default` template — they never configure copy
- White-labels receive a full template developed and deployed by a Vello developer
- The database only records which template to use (`template_id`). All content and layout live in code
- From the simulator onward, all tenants share the same standard layout — only the colors change via CSS variables

---

## 2. Separation of responsibilities

| Area | Who customizes | How |
|---|---|---|
| Home (`/`) | Template | Full component per template, with its own header/footer |
| Simulator, Request, Product | Shared by all tenants | CSS variables generated from the template colors |
| Colors (CSS vars) | Template (via `config.ts`) | `generateThemeCss(template.colors)` in the root `layout.tsx` |
| Logo / name | DB (`tenant_branding`) | Passed as props to the template components |

---

## 3. Architecture

### 3.1 File structure

```
apps/store/src/
├── app/
│   ├── layout.tsx                  ← reads template_id, injects CSS vars into <head>
│   ├── (home)/
│   │   └── page.tsx                ← dispatcher: resolves template → renders HomeComponent
│   └── (store)/
│       ├── layout.tsx              ← standard layout (StoreHeader + StoreFooter) for simulator and beyond
│       ├── _components/
│       │   ├── store-header.tsx    ← standard header (used by subscribers and simulator/request)
│       │   ├── store-footer.tsx    ← standard footer
│       │   ├── product-card.tsx    ← product card (reusable across templates)
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
    ├── default/                    ← Vello template (subscribers + fallback)
    │   ├── config.ts               ← id + colors
    │   ├── home.tsx                ← full HomeComponent (header/footer/sections)
    │   └── _components/
    │       ├── hero-section.tsx
    │       ├── products-section.tsx
    │       ├── how-it-works.tsx
    │       └── cta-banner.tsx
    │
    └── zp/                         ← ZP Pay white-label
        ├── config.ts
        ├── home.tsx
        └── _components/
            ├── header.tsx          ← own header (ZP logo + ZP nav)
            ├── footer.tsx          ← own footer
            ├── hero-section.tsx
            ├── products-section.tsx
            ├── how-it-works.tsx
            └── cta-banner.tsx
```

### 3.2 Resolution flow

```
Request → middleware → x-tenant-id header
                            ↓
                   layout.tsx (root)
                   getTenantBranding(tenantId)
                   getTemplate(branding.template_id)
                   generateThemeCss(template.colors)
                   → injects <style> into <head> (overrides globals.css)
                            ↓
                   (home)/page.tsx  (route /)
                   getHomeComponent(branding.template_id)
                   → renders HomeComponent with { displayName, logoUrl, products }
```

### 3.3 Core types

```typescript
// _types.ts

export type OklchColor = { l: number; c: number; h: number }

export type ColorTokens = {
  primary:    OklchColor
  background: OklchColor
  surface:    OklchColor
  // foreground, card, secondary, etc. are derived by generateThemeCss()
}

export type TemplateConfig = {
  id:     string       // unique slug: 'default', 'zp'
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

## 4. Color system

### 4.1 Base tokens and derivation

Each template defines 3 tokens in OKLCH. `generateThemeCss()` automatically derives all the others:

| CSS Variable | Derivation |
|---|---|
| `--primary` | `colors.primary` directly |
| `--background` | `colors.background` directly |
| `--surface` | `colors.surface` directly |
| `--foreground` | contrast against background (light or dark) |
| `--primary-foreground` | contrast against primary |
| `--surface-foreground` | contrast against surface |
| `--card` | background ± 0.04 L |
| `--secondary` | background ± 0.08 L |
| `--muted-foreground` | foreground with reduced opacity |
| `--border` | primary / 0.12 opacity |

### 4.2 Colors per template

| Template | `primary` | `background` | `surface` |
|---|---|---|---|
| `default` (Vello) | `oklch(0.48 0.25 258)` — blue | `oklch(0.35 0.18 258)` — dark blue | `oklch(0.42 0.17 258)` — medium blue |
| `zp` (ZP Pay) | `oklch(0.83 0.10 85)` — amber | `oklch(0.13 0.015 45)` — dark brown | `oklch(0.97 0.01 85)` — warm off-white |

### 4.3 Injection into the layout

```typescript
// app/layout.tsx
const branding  = await getTenantBranding(tenantId)
const template  = getTemplate(branding?.template_id)
const themeCss  = generateThemeCss(template.colors)

// injects before the CSS bundle → overrides globals.css for all tenants
<style dangerouslySetInnerHTML={{ __html: themeCss }} />
```

---

## 5. Home page per template

The home page (`/`) is a **complete React component** per template — it includes header, footer, and all sections. There is no shared layout in the `(home)` route group.

### 5.1 Dispatcher

```typescript
// app/(home)/page.tsx
const HomeComponent = getHomeComponent(branding?.template_id)
return <HomeComponent displayName={...} logoUrl={...} products={[...]} />
```

### 5.2 HomeComponent contract

Each template exports a function with the signature:
```typescript
export function XyzHome({ displayName, logoUrl, products }: TemplateHomeProps): JSX.Element
```

The component is responsible for including its own header and footer.

---

## 6. Shared routes (simulator onward)

The routes `/simulador/...`, `/solicitar/...`, `/produto/...`, and `/confirmacao/...` use the standard layout defined in `(store)/layout.tsx`:

```tsx
<div className="flex min-h-svh flex-col">
  <StoreHeader logoUrl={branding?.logo_url} displayName={branding?.company_display_name} />
  <main className="flex-1">{children}</main>
  <StoreFooter displayName={branding?.company_display_name} logoUrl={branding?.logo_url} />
</div>
```

These routes are **not** customized per template — only the colors change via CSS variables.

---

## 7. Database

Single new column in `tenant_branding`:

```sql
ALTER TABLE tenant_branding
  ADD COLUMN IF NOT EXISTS template_id TEXT;

-- NULL = uses Vello's default template
```

**White-label activation:**
```sql
UPDATE tenant_branding
SET template_id = 'zp'
WHERE tenant_id = '<tenant-uuid>';
```

**Test / rollback:**
```sql
UPDATE tenant_branding SET template_id = NULL WHERE tenant_id = '<uuid>';
```

---

## 8. Developer workflow for a new white-label

```
1. Receive briefing: colors in hex, copy, logo in SVG/PNG, section design
2. Create apps/store/src/templates/<slug>/
3. Convert colors to OKLCH → oklch.com
4. Create config.ts with id + colors
5. Create home.tsx with the full HomeComponent
6. Create _components/ with custom header, footer, and sections
7. Register in templates/index.ts (configRegistry + homeRegistry)
8. Deploy the store
9. UPDATE tenant_branding SET template_id = '<slug>' WHERE tenant_id = '...'
10. Validate on the tenant's domain/subdomain
```

**Estimated time:**
- Colors + copy (no redesign): 4–8 hours
- Partial redesign (hero/header): 1–2 days
- Full redesign: 3–5 days

---

## 9. Out of scope (v1)

- Copy customization via the database (everything lives in the template code)
- Self-service for subscribers (v3+)
- Asset upload by the client (via dev + deploy)
- `base_color` integration for subscribers (v3+)
- Simulation PDF
- "Run a Free Simulation" flow (definition pending)
