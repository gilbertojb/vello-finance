# Store Template System

The `store` application (Vello Store) has a dynamic and extensible template system designed to support multiple *tenants* with completely different looks and flows (White-label), without needing to duplicate the application.

The system is based on a **Registry Pattern** combined with dependency injection and CSS variable customization via the main layout.

## How It Works (Overview)

1. **Tenant Resolution:** When a request reaches `store`, `middleware.ts` identifies the tenant by host (subdomain or custom domain).
2. **Template Identification:** The tenant data loaded from Supabase (`tenant_branding` table) informs which `template_id` should be used (e.g.: `default`, `zp`, etc.).
3. **Registry:** The system consumes the `template_id` and looks up the color configuration files (`config.ts`) and the corresponding root component (`home.tsx`) in the `apps/store/src/templates/` directory.
4. **Rendering:** The `app/(home)/page.tsx` page renders the returned component, passing standardized properties (products, logo, tenant name). The `layout.tsx` injects the colors (OKLCH) defined in the template's `config.ts` as CSS variables.

---

## Folder and File Structure

The template system is centralized in the `apps/store/src/templates/` folder:

```
apps/store/src/templates/
├── _types.ts                   ← Core required typings
├── index.ts                    ← Template registry (where all templates are registered)
├── default/                    ← Template 1 (e.g.: Default)
│   ├── config.ts               ← Color configuration (Oklch) and ID
│   ├── home.tsx                ← Root home component
│   └── _components/            ← Subcomponents isolated to this template
└── zp/                         ← Template 2 (e.g.: ZP)
    ├── config.ts
    ├── home.tsx
    └── _components/
```

### 1. `_types.ts`
Defines the mandatory contracts every template must follow.

- `TemplateConfig`: Interface that dictates the tenant's color structure.
- `TemplateHomeProps`: Properties injected by the server on the main page (display name, logo URL, tenant's available products).
- `TemplateHomeProduct`: Standardized format of a product to be displayed in the storefront.

### 2. `index.ts` (The Registry)
This file acts as a dictionary. Whenever a new template is created, it must be explicitly added to the `configRegistry` and `homeRegistry` maps.

```tsx
import { defaultTemplate } from './default/config'
import { DefaultHome } from './default/home'
import { zpTemplate } from './zp/config'
import { ZpHome } from './zp/home'

const configRegistry: Record<string, TemplateConfig> = {
  default: defaultTemplate,
  zp: zpTemplate,
}

const homeRegistry: Record<string, ComponentType<TemplateHomeProps>> = {
  default: DefaultHome,
  zp: ZpHome,
}
```

Exporting functions like `getTemplate(id)` and `getHomeComponent(id)` ensures there is always a *fallback* (usually defaulting to `default`) in case an invalid `template_id` is requested from the database.

---

## Anatomy of a Template

For a new visual to exist, it only needs two public files inside a folder:

### The `config.ts` File
Defines the base palette tokens for that specific template in the **OKLCH** color space, for perfect compatibility with Tailwind CSS (v4+).

```typescript
// apps/store/src/templates/meu-template/config.ts
import type { TemplateConfig } from '../_types'

export const meuTemplateConfig: TemplateConfig = {
  id: 'meu-template',
  colors: {
    primary:    { l: 0.48, c: 0.25, h: 258 },
    background: { l: 0.98, c: 0.01, h: 200 },
    surface:    { l: 1.00, c: 0.00, h: 0 },
  },
}
```

### The `home.tsx` File
This is the Server Component that dictates the structure and experience of the page. It must receive `TemplateHomeProps`. The big advantage of this approach is that one template can be a simple listing of cards, while another template can be a super interactive, complex Landing Page with completely different sections.

```tsx
// apps/store/src/templates/meu-template/home.tsx
import type { TemplateHomeProps } from '@/templates/_types'
import { StoreHeader } from '@/app/(store)/_components/store-header'
import { MinhaHeroSection } from './_components/hero-section'

export function MeuTemplateHome({
  displayName,
  logoUrl,
  products,
}: TemplateHomeProps) {
  return (
    <div>
      <StoreHeader logoUrl={logoUrl} displayName={displayName} />
      <MinhaHeroSection products={products} />
      {/* Rest of this template's exclusive UI */}
    </div>
  )
}
```

---

## Creating a New Template (Step by Step)

1. **Create the directory:** `apps/store/src/templates/novo-tema/`.
2. **Create the subcomponents:** Add specific components in the `_components` subfolder. Each template is encouraged to have its own components (Hero, Listing, CTA) so that a change in one template doesn't break the others. Reuse should be limited to shadcn's primitive components (`@/components/ui`).
3. **Create the required files:** Create `config.ts` and `home.tsx` at the root of the new theme's directory.
4. **Follow the Contract:** `home.tsx` must export a default React component that accepts `TemplateHomeProps`.
5. **Register the Template:** Edit the `apps/store/src/templates/index.ts` file and import your `config` and your `home` component. Add them to the `configRegistry` and `homeRegistry` objects, mapping to a new ID (e.g.: `'novo-tema'`).
6. **Test on the Database:** Assign `template_id = 'novo-tema'` to the corresponding tenant in the database to see the page render the new structure.

## Overriding Global Components

By architectural convention, we do not use component inheritance (i.e., `Template B` importing components specific to `Template A`).
If a component's structure is very similar:
1. Prefer **duplicating** the component into your new template's `_components` folder to keep templates fully decoupled.
2. Elements that *need* to be globally consistent (like `StoreHeader` or `StoreFooter`) live in `apps/store/src/app/(store)/_components/`. These can be imported by any template, since they receive generic props like `logoUrl`.

## Theme Injection (CSS)

Every color referenced in a template (`bg-primary`, `text-surface`, `bg-background`) uses Tailwind utility classes.
In Next.js (in `layout.tsx`), the OKLCH properties returned by the template's `config.ts` are translated into inline CSS variables applied to the HTML element, thereby overriding the project's theme at runtime for that specific request.

```html
<!-- Example of how CSS is dynamically injected for the current template -->
<html style="
  --color-primary: oklch(0.48 0.25 258);
  --color-background: oklch(0.98 0.01 200);
">
```
