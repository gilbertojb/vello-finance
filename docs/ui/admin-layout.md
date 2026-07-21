# Feature Spec — Vello Admin Layout

**App:** `apps/admin`
**Status:** `implemented`

---

## Visual Structure

```
┌─────────────────────────────────────────────────────┐
│                    Vello Admin                       │
├──────────────┬──────────────────────────────────────┤
│              │  Header (52px) — SidebarTrigger       │
│   Sidebar    ├──────────────────────────────────────┤
│   (220px)    │                                       │
│   offcanvas  │  Content Area (@container/main)       │
│              │  padding: py-4, gap-4                 │
│   Logo       │                                       │
│   Nav        │                                       │
│   ─────      │                                       │
│   User       │                                       │
└──────────────┴──────────────────────────────────────┘
```

---

## File Structure (implemented)

```
apps/admin/src/
├── app/
│   ├── layout.tsx                    ← Root layout (font + html/body + Providers)
│   ├── providers.tsx                 ← ThemeProvider + TooltipProvider ('use client')
│   ├── globals.css                   ← CSS variables + shadcn base + Vello tokens
│   ├── (public)/
│   │   ├── layout.tsx                ← Two-column layout (form + decorative)
│   │   └── sign-in/
│   │       ├── page.tsx
│   │       └── sign-in-form.tsx      ← Sign-in form ('use client')
│   └── (private)/
│       ├── layout.tsx                ← SidebarProvider + Sidebar + Header + content
│       └── (dashboard)/
│           └── page.tsx              ← Dashboard placeholder
├── assets/
│   └── logo.svg                      ← Vello logo (SVG)
├── components/
│   ├── ui/                           ← shadcn (generated — do not edit)
│   ├── header.tsx                    ← Shared header with SidebarTrigger
│   └── sidebar/
│       ├── index.tsx                 ← Composed sidebar (server component)
│       ├── nav-main.tsx              ← Navigation groups (server component)
│       ├── nav-link.tsx              ← Link with active state ('use client')
│       ├── nav-user.tsx              ← User footer wrapper (server component)
│       └── profile-button.tsx        ← Profile dropdown ('use client')
├── hooks/
│   └── use-form-state.ts             ← Hook for Server Actions with form state
└── lib/
    └── utils.ts                      ← cn()
```

---

## Route Groups

| Group | Use | Layout |
|---|---|---|
| `(public)` | Unauthenticated routes — login, forgot-password | Two columns: form + decorative |
| `(private)` | Authenticated routes — dashboard, modules | SidebarProvider + Header |

---

## Root Layout

```tsx
// src/app/layout.tsx
import { GeistSans } from 'geist/font/sans'
import { GeistMono } from 'geist/font/mono'
import { Providers } from './providers'
import './globals.css'

export const metadata: Metadata = {
  title: {
    template: '%s | Vello Admin',  // ← "Tenants | Vello Admin"
    default: 'Vello Admin',
  },
}
```

> Each `page.tsx` exports `export const metadata = { title: 'PageName' }` to fill in the template.

---

## Providers

```tsx
// src/app/providers.tsx — 'use client'
// Includes ThemeProvider AND TooltipProvider
export function Providers({ children }) {
  return (
    <ThemeProvider attribute="class" defaultTheme="light" enableSystem={false}>
      <TooltipProvider>{children}</TooltipProvider>
    </ThemeProvider>
  )
}
```

> `providers.tsx` lives in `src/app/` (co-located with `layout.tsx`), not in `src/lib/`.

---

## Private Layout (`(private)/layout.tsx`)

Uses the shadcn `SidebarProvider` component. Dimensions overridden via inline `style`:

```tsx
<SidebarProvider
  style={{
    '--sidebar-width': 'calc(var(--spacing) * 72)',   // 288px (72 × 4px)
    '--header-height': 'calc(var(--spacing) * 12)',   // 48px  (12 × 4px)
  } as React.CSSProperties}
>
  <Sidebar variant="inset" />
  <SidebarInset className="border border-border">
    <Header />
    <div className="flex flex-1 flex-col">
      <div className="@container/main flex flex-1 flex-col gap-2">
        <div className="flex flex-col gap-4 py-4 md:gap-6 h-full">
          {children}
        </div>
      </div>
    </div>
  </SidebarInset>
</SidebarProvider>
```

**Important:**
- Sidebar dimensions are always set via `style` on `SidebarProvider` — never hardcoded in CSS
- `@container/main` enables container queries in child modules
- `SidebarInset` has `border border-border` for visual separation

---

## Public Layout (`(public)/layout.tsx`)

Two columns: form on the left, decorative image on the right (hidden on mobile):

```tsx
<div className="grid min-h-svh lg:grid-cols-3">
  {/* Column 1 (1/3): Logo + content */}
  <div className="flex flex-col gap-4 p-6 md:p-10">
    <Image src={logo} alt="Vello" ... />
    <div className="flex flex-1 items-center justify-center">
      {children}
    </div>
  </div>

  {/* Column 2 (2/3): Decorative — hidden on mobile */}
  <div className="bg-muted relative hidden lg:block col-span-2">
    <div className="bg-[url('/img/pattern.png')] bg-contain absolute inset-0 ..." />
  </div>
</div>
```

---

## Sidebar Component

Composed of shadcn parts + custom components. Server/client split is mandatory:

| File | Type | Responsibility |
|---|---|---|
| `sidebar/index.tsx` | Server | Assembles structure: Header, Content, Footer |
| `sidebar/nav-main.tsx` | Server | Defines navigation groups and items |
| `sidebar/nav-link.tsx` | Client | Detects active route via `usePathname()` |
| `sidebar/nav-user.tsx` | Server | Footer wrapper |
| `sidebar/profile-button.tsx` | Client | Dropdown menu with logout option |

**Logo and badge:**
```tsx
<Image src={logo} alt="Vello" height={24} loading="eager" />
<div className="bg-primary/10 rounded-full px-4 py-0.5 text-primary uppercase text-xs font-medium">
  Admin
</div>
```
> Use `bg-primary/10 text-primary` for the badge — not hardcoded colors.

**Active item (`nav-link.tsx`):**
```tsx
isActive
  ? 'bg-sidebar-accent text-sidebar-accent-foreground font-medium'
  : 'text-foreground/70 hover:bg-secondary hover:text-foreground'
```

---

## Shared Header

The `Header` in `(private)/layout.tsx` is **shared across all authenticated routes**.
Page titles are set via `export const metadata` in each `page.tsx` — not as Header props.

```tsx
// src/components/header.tsx — server component
export function Header() {
  return (
    <header className="flex h-header shrink-0 items-center gap-2 border-b ...">
      <div className="flex w-full items-center gap-1 px-4 lg:gap-2 lg:px-6">
        <SidebarTrigger className="-ml-1" />
        <Separator orientation="vertical" className="my-2 data-[orientation=vertical]:h-4" />
        {/* Additional page actions go here via a slot in the future */}
      </div>
    </header>
  )
}
```

---

## Form System (`Field`)

Forms use the `Field` component system, not standalone inputs:

```tsx
// Correct pattern
<FieldGroup>
  <Field>
    <FieldLabel htmlFor="email">Email</FieldLabel>
    <Input id="email" type="email" name="email" />
    <FieldError errors={formState.errors?.email} />
  </Field>
</FieldGroup>

// Components available in src/components/ui/field.tsx:
// Field, FieldGroup, FieldLabel, FieldTitle, FieldDescription,
// FieldError, FieldContent, FieldSeparator, FieldSet, FieldLegend
```

`Field` supports `orientation`: `vertical` (default), `horizontal`, `responsive`.

---

## `useFormState` Hook

For integration with Server Actions:

```tsx
'use client'
import { useFormState } from '@/hooks/use-form-state'

export function MyForm() {
  const [formState, handleSubmit, isPending] = useFormState(
    myServerAction,
    () => router.push('/success'),  // onSuccess
    (msg) => toast.error(msg),      // onError
  )

  return (
    <form onSubmit={handleSubmit}>
      <FieldError errors={formState.errors?.fieldName} />
      ...
    </form>
  )
}
```

**Server Action contract:**
```ts
interface ActionState {
  success: boolean
  message: string | null
  errors: Record<string, string[]> | null  // key = field name
  data?: Record<string, unknown>
}
```

---

## Page Pattern

```tsx
// src/app/(private)/[module]/page.tsx
export const metadata = { title: 'Tenants' }  // → "Tenants | Vello Admin"

export default async function TenantsPage() {
  const data = await listTenants()  // server-side — Fat Server rule

  return (
    <main className="flex flex-1 flex-col gap-4 p-4">
      {/* Page header with actions */}
      <div className="flex items-center justify-between">
        <h1 className="text-lg font-semibold">Tenants</h1>
        <Button size="sm" asChild><Link href="/tenants/new">New Tenant</Link></Button>
      </div>

      {/* Main content */}
      <div className="bg-card rounded-lg border">
        {/* Table, list, etc. */}
      </div>
    </main>
  )
}
```

---

## Completion Criteria

- [x] Root layout with Geist + `suppressHydrationWarning`
- [x] `globals.css` with Vello tokens (light and dark)
- [x] shadcn sidebar with full navigation and correct active item
- [x] Shared header with `SidebarTrigger`
- [x] Dark/light toggle without flash
- [x] Public layout (`(public)`) — two columns with sign-in form
- [x] Dashboard placeholder in `(private)/(dashboard)/page.tsx`
- [x] `Field` system for forms
- [x] `useFormState` hook for Server Actions
