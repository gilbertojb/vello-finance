# Feature Spec — Layout do Vello Admin

**App:** `apps/admin`
**Status:** `implementado`

---

## Estrutura Visual

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

## Estrutura de Arquivos (implementada)

```
apps/admin/src/
├── app/
│   ├── layout.tsx                    ← Root layout (fonte + html/body + Providers)
│   ├── providers.tsx                 ← ThemeProvider + TooltipProvider ('use client')
│   ├── globals.css                   ← CSS variables + shadcn base + tokens Vello
│   ├── (public)/
│   │   ├── layout.tsx                ← Layout duas colunas (form + decorativo)
│   │   └── sign-in/
│   │       ├── page.tsx
│   │       └── sign-in-form.tsx      ← Formulário de login ('use client')
│   └── (private)/
│       ├── layout.tsx                ← SidebarProvider + Sidebar + Header + conteúdo
│       └── (dashboard)/
│           └── page.tsx              ← Dashboard placeholder
├── assets/
│   └── logo.svg                      ← Logo Vello (SVG)
├── components/
│   ├── ui/                           ← shadcn (gerado — não editar)
│   ├── header.tsx                    ← Header compartilhado com SidebarTrigger
│   └── sidebar/
│       ├── index.tsx                 ← Sidebar composta (server component)
│       ├── nav-main.tsx              ← Grupos de navegação (server component)
│       ├── nav-link.tsx              ← Link com estado ativo ('use client')
│       ├── nav-user.tsx              ← Wrapper do rodapé do usuário (server component)
│       └── profile-button.tsx        ← Dropdown do perfil ('use client')
├── hooks/
│   └── use-form-state.ts             ← Hook para Server Actions com estado de form
└── lib/
    └── utils.ts                      ← cn()
```

---

## Route Groups

| Grupo | Uso | Layout |
|---|---|---|
| `(public)` | Rotas sem autenticação — login, forgot-password | Duas colunas: form + decorativo |
| `(private)` | Rotas autenticadas — dashboard, módulos | SidebarProvider + Header |

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

> Cada `page.tsx` exporta `export const metadata = { title: 'NomeDaPágina' }` para preencher o template.

---

## Providers

```tsx
// src/app/providers.tsx — 'use client'
// Inclui ThemeProvider E TooltipProvider
export function Providers({ children }) {
  return (
    <ThemeProvider attribute="class" defaultTheme="light" enableSystem={false}>
      <TooltipProvider>{children}</TooltipProvider>
    </ThemeProvider>
  )
}
```

> `providers.tsx` fica em `src/app/` (co-localizado com `layout.tsx`), não em `src/lib/`.

---

## Layout Privado (`(private)/layout.tsx`)

Usa o componente shadcn `SidebarProvider`. Dimensões sobrescritas via `style` inline:

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

**Importantes:**
- Dimensões do sidebar sempre via `style` no `SidebarProvider` — não hardcoded no CSS
- `@container/main` habilita container queries nos módulos filhos
- `SidebarInset` tem `border border-border` para separação visual

---

## Layout Público (`(public)/layout.tsx`)

Duas colunas: formulário à esquerda, imagem decorativa à direita (oculta em mobile):

```tsx
<div className="grid min-h-svh lg:grid-cols-3">
  {/* Coluna 1 (1/3): Logo + conteúdo */}
  <div className="flex flex-col gap-4 p-6 md:p-10">
    <Image src={logo} alt="Vello" ... />
    <div className="flex flex-1 items-center justify-center">
      {children}
    </div>
  </div>

  {/* Coluna 2 (2/3): Decorativo — hidden em mobile */}
  <div className="bg-muted relative hidden lg:block col-span-2">
    <div className="bg-[url('/img/pattern.png')] bg-contain absolute inset-0 ..." />
  </div>
</div>
```

---

## Componente Sidebar

Composta por partes shadcn + componentes próprios. Split server/client obrigatório:

| Arquivo | Tipo | Responsabilidade |
|---|---|---|
| `sidebar/index.tsx` | Server | Monta estrutura: Header, Content, Footer |
| `sidebar/nav-main.tsx` | Server | Define grupos e itens de navegação |
| `sidebar/nav-link.tsx` | Client | Detecta rota ativa via `usePathname()` |
| `sidebar/nav-user.tsx` | Server | Wrapper do rodapé |
| `sidebar/profile-button.tsx` | Client | Dropdown menu com opção de logout |

**Logo e badge:**
```tsx
<Image src={logo} alt="Vello" height={24} loading="eager" />
<div className="bg-primary/10 rounded-full px-4 py-0.5 text-primary uppercase text-xs font-medium">
  Admin
</div>
```
> Usar `bg-primary/10 text-primary` para o badge — não cores hardcoded.

**Item ativo (`nav-link.tsx`):**
```tsx
isActive
  ? 'bg-sidebar-accent text-sidebar-accent-foreground font-medium'
  : 'text-foreground/70 hover:bg-secondary hover:text-foreground'
```

---

## Header Compartilhado

O `Header` em `(private)/layout.tsx` é **compartilhado entre todas as rotas autenticadas**.
Títulos de página são definidos via `export const metadata` em cada `page.tsx` — não como props do Header.

```tsx
// src/components/header.tsx — server component
export function Header() {
  return (
    <header className="flex h-header shrink-0 items-center gap-2 border-b ...">
      <div className="flex w-full items-center gap-1 px-4 lg:gap-2 lg:px-6">
        <SidebarTrigger className="-ml-1" />
        <Separator orientation="vertical" className="my-2 data-[orientation=vertical]:h-4" />
        {/* Ações adicionais da página entram aqui via slot no futuro */}
      </div>
    </header>
  )
}
```

---

## Sistema de Formulário (`Field`)

Formulários usam o sistema de componentes `Field`, não inputs avulsos:

```tsx
// Padrão correto
<FieldGroup>
  <Field>
    <FieldLabel htmlFor="email">E-mail</FieldLabel>
    <Input id="email" type="email" name="email" />
    <FieldError errors={formState.errors?.email} />
  </Field>
</FieldGroup>

// Componentes disponíveis em src/components/ui/field.tsx:
// Field, FieldGroup, FieldLabel, FieldTitle, FieldDescription,
// FieldError, FieldContent, FieldSeparator, FieldSet, FieldLegend
```

`Field` suporta `orientation`: `vertical` (padrão), `horizontal`, `responsive`.

---

## Hook `useFormState`

Para integração com Server Actions:

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

**Contrato do Server Action:**
```ts
interface ActionState {
  success: boolean
  message: string | null
  errors: Record<string, string[]> | null  // chave = nome do campo
  data?: Record<string, unknown>
}
```

---

## Padrão de Página

```tsx
// src/app/(private)/[módulo]/page.tsx
export const metadata = { title: 'Tenants' }  // → "Tenants | Vello Admin"

export default async function TenantsPage() {
  const data = await listTenants()  // server-side — Fat Server rule

  return (
    <main className="flex flex-1 flex-col gap-4 p-4">
      {/* Cabeçalho da página com ações */}
      <div className="flex items-center justify-between">
        <h1 className="text-lg font-semibold">Tenants</h1>
        <Button size="sm" asChild><Link href="/tenants/new">Novo Tenant</Link></Button>
      </div>

      {/* Conteúdo principal */}
      <div className="bg-card rounded-lg border">
        {/* Tabela, lista, etc. */}
      </div>
    </main>
  )
}
```

---

## Critérios de Conclusão

- [x] Root layout com Geist + `suppressHydrationWarning`
- [x] `globals.css` com tokens Vello (light e dark)
- [x] Sidebar shadcn com navegação completa e item ativo correto
- [x] Header compartilhado com `SidebarTrigger`
- [x] Toggle dark/light sem flash
- [x] Layout público (`(public)`) — duas colunas com formulário de login
- [x] Dashboard placeholder em `(private)/(dashboard)/page.tsx`
- [x] Sistema `Field` para formulários
- [x] Hook `useFormState` para Server Actions
