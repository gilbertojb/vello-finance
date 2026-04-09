# Spec: Tema dinâmico white-label por tenant no console

## Objetivo
Permitir que o console carregue um tema base global via `globals.css`, e aplique customizações específicas por tenant white-label via CSS variables e um campo de CSS customizado armazenado no banco. A solução mantém a semântica de Tailwind e shadcn/ui, suporta um seletor de escopo por tenant e inclui os conceitos de `Base Color` e `Theme Color`.

## Contexto
O console usa um tema padrão do sistema. Tenants white-label precisam de personalização visual mais forte: variações de layout, tons, superfícies, contraste, radius, tipografia e detalhes de UI. Base Color e Theme Color são selecionáveis na criação de qualquer tenant; o CSS customizado avançado é exclusivo de tenants white-label.

## Arquitetura implementada

### Três camadas de estilo

1. **`globals.css`** — base global do sistema (Tailwind 4 + shadcn, valores oklch em `:root`)
2. **JSONB tokens** — CSS variables por tenant, injetadas via `<style>` com seletor de escopo
3. **`rawCss`** — CSS avançado livre, injetado por último (maior precedência)

### Escopo por tenant

A tag `<html>` recebe `data-tenant-theme="{slug}"`:

```html
<html lang="pt-BR" data-tenant-theme="demo-tenant">
```

Tokens são aplicados no seletor `[data-tenant-theme="slug"]`, garantindo isolamento.

## Modelo de dados

### `tenant_branding`

Campos de tema (todos presentes, sem tabela separada de tokens):

| Coluna | Tipo | Descrição |
|---|---|---|
| `use_custom_theme` | `boolean NOT NULL DEFAULT false` | Ativa tema white-label avançado |
| `base_color` | `text` | Família cromática: `Neutral`, `Stone`, `Zinc`, `Mauve`, `Olive`, `Mist`, `Taupe` |
| `theme_color` | `text` | Tonalidade de destaque: `red`, `blue`, `green`, `violet`, etc. |
| `custom_css` | `jsonb` | Tokens CSS + CSS customizado (ver formato abaixo) |

> A tabela `tenant_theme_tokens` foi removida. Os campos legados `primary_color`, `secondary_color`, `auth_theme` e `auth_bg_color` foram removidos da tabela `tenant_branding`.

### Formato do campo `custom_css` (JSONB)

```json
{
  "background": "oklch(0.98 0 0)",
  "foreground": "oklch(0.14 0.02 260)",
  "card": "oklch(1 0 0)",
  "card-foreground": "oklch(0.14 0.02 260)",
  "popover": "oklch(1 0 0)",
  "popover-foreground": "oklch(0.14 0.02 260)",
  "primary": "oklch(0.62 0.18 42)",
  "primary-foreground": "oklch(0.98 0 0)",
  "secondary": "oklch(0.28 0.04 24)",
  "secondary-foreground": "oklch(0.98 0 0)",
  "accent": "oklch(0.55 0.16 18)",
  "accent-foreground": "oklch(0.98 0 0)",
  "muted": "oklch(0.95 0.005 260)",
  "muted-foreground": "oklch(0.55 0.01 260)",
  "destructive": "oklch(0.59 0.22 25)",
  "destructive-foreground": "oklch(0.98 0 0)",
  "border": "oklch(0.90 0.005 260)",
  "input": "oklch(0.90 0.005 260)",
  "ring": "oklch(0.62 0.18 42)",
  "radius": "0.75rem",
  "chart-1": "oklch(0.62 0.18 42)",
  "chart-2": "oklch(0.55 0.16 18)",
  "chart-3": "oklch(0.45 0.12 200)",
  "chart-4": "oklch(0.65 0.14 140)",
  "chart-5": "oklch(0.70 0.15 80)",
  "sidebar": "oklch(0.96 0.003 260)",
  "sidebar-foreground": "oklch(0.14 0.02 260)",
  "sidebar-primary": "oklch(0.62 0.18 42)",
  "sidebar-primary-foreground": "oklch(0.98 0 0)",
  "sidebar-accent": "oklch(0.92 0.005 260)",
  "sidebar-accent-foreground": "oklch(0.14 0.02 260)",
  "sidebar-border": "oklch(0.88 0.005 260)",
  "sidebar-ring": "oklch(0.62 0.18 42)",
  "rawCss": "[data-tenant-theme=\"demo-tenant\"] .hero-panel {\n  background: linear-gradient(135deg, #4b281e, #190c0a);\n  border-radius: 28px;\n}"
}
```

**Regra de estrutura:**
- Todas as chaves exceto `rawCss` são nomes de CSS variables (sem o prefixo `--`). O valor deve ser uma string CSS válida.
- `rawCss` é CSS livre aplicado depois dos tokens, com maior precedência.
- Qualquer chave ausente no JSON mantém o valor do `globals.css`.

## Fluxo de carregamento

```
Browser                         Next.js Server                    Supabase
  │                                   │                               │
  │── GET /api/tenant-theme?slug=X ──▶│                               │
  │                             Route Handler                         │
  │                                   │── SELECT tenants, branding ──▶│
  │                                   │◀── slug, custom_css ──────────│
  │◀── { selector, variables, customCss } ────────────────────────────│
  │                                   │
  │  TenantThemeLoader (useEffect)     │
  │── injectStyle(tokens) ────────────│
  │── injectStyle(rawCss) ────────────│
```

1. `RootLayout` lê o header `x-tenant-slug` (injetado pelo middleware ou request).
2. Renderiza `<html data-tenant-theme="{slug}">` e `<TenantThemeLoader tenantSlug={slug} />`.
3. No cliente, `TenantThemeLoader` chama `loadTenantTheme(slug)`.
4. A função busca `/api/tenant-theme?slug={slug}` e injeta dois `<style>` no `<head>`:
   - `#tenant-theme-tokens` — variáveis CSS no seletor de escopo
   - `#tenant-theme-custom` — `rawCss` do tenant

## Precedência de estilos

```
globals.css (base)
  ↓ sobrescrito por
[data-tenant-theme="slug"] { tokens do JSONB }
  ↓ sobrescrito por
rawCss (custom_css.rawCss)
```

## API `/api/tenant-theme`

**Request:** `GET /api/tenant-theme?slug={tenant_slug}`

**Response (tenant sem tema customizado):**
```json
{
  "selector": null,
  "baseColor": "Neutral",
  "themeColor": "blue",
  "variables": {},
  "customCss": null
}
```

**Response (tenant white-label com custom_css):**
```json
{
  "selector": "[data-tenant-theme=\"demo-tenant\"]",
  "baseColor": "Stone",
  "themeColor": "amber",
  "variables": {
    "background": "oklch(0.98 0 0)",
    "primary": "oklch(0.62 0.18 42)",
    "radius": "0.75rem"
  },
  "customCss": "[data-tenant-theme=\"demo-tenant\"] .hero-panel { ... }"
}
```

**Cache:** `Cache-Control: public, s-maxage=300, stale-while-revalidate=600`

**Segurança:** Usa `createServiceClient()` (service role, server-side). Nenhuma policy pública de leitura é adicionada às tabelas `tenants` ou `tenant_branding`.

## UI de cadastro no Admin

### Campos disponíveis para todos os tenants
- **Base Color** — select com opções: Neutral, Stone, Zinc, Mauve, Olive, Mist, Taupe
- **Theme Color** — select com as cores padrão do Tailwind (red, orange, ... rose)
- **Nome de Exibição** — `company_display_name`
- **Logo, Favicon, Imagem de Fundo Auth** — upload de arquivos

### Campos exclusivos de tenants white-label (toggle `use_custom_theme`)
- **CSS Customizado** — textarea com `name="custom_css"`, texto livre. A action envolve como `{ rawCss: texto }` antes de salvar no JSONB.

## Arquivos implementados

| Arquivo | Responsabilidade |
|---|---|
| `supabase/migrations/20260406100000_*.sql` | Adiciona `use_custom_theme`, `base_color`, `theme_color`, `custom_css TEXT` |
| `supabase/migrations/20260406100400_*.sql` | Remove colunas legadas, converte `custom_css TEXT → JSONB`, remove tabela `tenant_theme_tokens` |
| `apps/admin/src/app/(private)/tenants/actions.ts` | `brandingSchema` com `use_custom_theme`, `base_color`, `theme_color`; wraps `rawCss` em JSONB |
| `apps/admin/src/app/(private)/tenants/_components/tenant-form.tsx` | Toggle `isWhiteLabel` controla exibição do textarea; `base_color`/`theme_color` sempre visíveis |
| `apps/console/src/app/api/tenant-theme/route.ts` | Lê `custom_css` JSONB, desestrutura `{ rawCss, ...tokenEntries }`, retorna payload tipado |
| `apps/console/src/lib/theme/load-tenant-theme.ts` | `loadTenantTheme()` + `applyTenantTheme()` + `injectStyle()` |
| `apps/console/src/components/tenant-theme-loader.tsx` | Client component com `useEffect` que chama `loadTenantTheme` |
| `apps/console/src/app/layout.tsx` | Lê `x-tenant-slug` do header (injetado pelo `proxy.ts`), seta `data-tenant-theme`, monta `TenantThemeLoader` |

## Observação: injeção do `x-tenant-slug`

O header `x-tenant-slug` é injetado pelo `proxy.ts` do console (middleware Edge), que resolve o tenant a partir do subdomínio ou `custom_domain`. Detalhes do middleware em `docs/superpowers/specs/2026-04-09-console-app-design.md`.

## Tailwind 4 e shadcn

O console usa Tailwind 4 com `@theme inline`. Os tokens semânticos são definidos em `globals.css` como CSS variables em `:root` com valores `oklch(...)`. O `@theme inline` mapeia `--color-background: var(--background)` etc., de forma que todos os componentes shadcn continuam funcionando.

**Não usar** a sintaxe Tailwind 3 `hsl(var(--token))` — o projeto usa valores oklch diretamente.

## Critérios de aceite

- O console funciona com tema padrão sem tenant.
- Tenant white-label (`use_custom_theme = true`) aplica variáveis do JSONB no seletor correto.
- `rawCss` é injetado depois dos tokens, com precedência maior.
- O campo `Base Color` e `Theme Color` são salvos para todos os tenants.
- O textarea de CSS customizado só é exibido no form quando `use_custom_theme` estiver ativo.
- O tema é carregado dinamicamente sem rebuild da aplicação.
- Estilos não vazam entre tenants (escopo via `data-tenant-theme`).
- A API usa service role e não adiciona policies públicas de leitura ao banco.

## Fora de escopo

- Editor visual de tema no admin/console.
- Preview em tempo real do tema.
- Sanitização avançada de CSS.
- Tenant slug via JWT token (planejado para fase futura).
- Suporte a domínio customizado no middleware (planejado para fase futura).
