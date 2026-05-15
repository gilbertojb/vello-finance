# Console — Reset de Layout + Theme Switcher — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Remover estilização customizada do console, adotar o tema neutro padrão do shadcn/Tailwind e adicionar ThemeSwitcher (light/dark/system) no ProfileButton da sidebar.

**Architecture:** O `globals.css` passa a ser um fallback neutro; o CSS do tenant sobrescreve `--primary`, `--sidebar-primary` e demais tokens em runtime via injeção existente. O ThemeSwitcher usa `next-themes` (já configurado no `Providers`) e é montado dentro do `DropdownMenu` do `ProfileButton`, idêntico ao padrão do admin.

**Tech Stack:** Next.js 15 App Router, Tailwind CSS v4, shadcn/ui (Radix UI), next-themes, TypeScript

---

## Mapa de arquivos

| Ação | Arquivo |
|------|---------|
| Criar | `apps/console/src/components/ui/toggle.tsx` |
| Criar | `apps/console/src/components/ui/toggle-group.tsx` |
| Criar | `apps/console/src/components/sidebar/theme-switcher.tsx` |
| Modificar | `apps/console/src/app/globals.css` |
| Modificar | `apps/console/src/components/sidebar/profile-button.tsx` |
| Modificar | `apps/console/src/components/sidebar/nav-user.tsx` |
| Modificar | `apps/console/src/components/sidebar/nav-link.tsx` |

---

## Task 1: Adicionar componentes `toggle` e `toggle-group` ao console

O `ThemeSwitcher` depende de `ToggleGroup`/`ToggleGroupItem`. Esses componentes existem no admin mas não no console — copiar o código exato.

**Files:**
- Create: `apps/console/src/components/ui/toggle.tsx`
- Create: `apps/console/src/components/ui/toggle-group.tsx`

- [ ] **Step 1: Criar `toggle.tsx`**

Criar o arquivo `apps/console/src/components/ui/toggle.tsx` com o conteúdo:

```tsx
"use client"

import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"
import { Toggle as TogglePrimitive } from "radix-ui"

import { cn } from "@/lib/utils"

const toggleVariants = cva(
  "group/toggle inline-flex items-center justify-center gap-1 rounded-md text-sm font-medium whitespace-nowrap transition-[color,box-shadow] outline-none hover:bg-muted hover:text-foreground focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50 disabled:pointer-events-none disabled:opacity-50 aria-invalid:border-destructive aria-invalid:ring-destructive/20 aria-pressed:bg-muted dark:aria-invalid:ring-destructive/40 [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4",
  {
    variants: {
      variant: {
        default: "bg-transparent",
        outline: "border border-input bg-transparent shadow-xs hover:bg-muted",
      },
      size: {
        default:
          "h-9 min-w-9 px-2.5 has-data-[icon=inline-end]:pr-2 has-data-[icon=inline-start]:pl-2",
        sm: "h-8 min-w-8 px-2.5 has-data-[icon=inline-end]:pr-1.5 has-data-[icon=inline-start]:pl-1.5",
        lg: "h-10 min-w-10 px-2.5 has-data-[icon=inline-end]:pr-2 has-data-[icon=inline-start]:pl-2",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

function Toggle({
  className,
  variant = "default",
  size = "default",
  ...props
}: React.ComponentProps<typeof TogglePrimitive.Root> &
  VariantProps<typeof toggleVariants>) {
  return (
    <TogglePrimitive.Root
      data-slot="toggle"
      className={cn(toggleVariants({ variant, size, className }))}
      {...props}
    />
  )
}

export { Toggle, toggleVariants }
```

- [ ] **Step 2: Criar `toggle-group.tsx`**

Criar o arquivo `apps/console/src/components/ui/toggle-group.tsx` com o conteúdo:

```tsx
"use client"

import * as React from "react"
import { type VariantProps } from "class-variance-authority"
import { ToggleGroup as ToggleGroupPrimitive } from "radix-ui"

import { cn } from "@/lib/utils"
import { toggleVariants } from "@/components/ui/toggle"

const ToggleGroupContext = React.createContext<
  VariantProps<typeof toggleVariants> & {
    spacing?: number
    orientation?: "horizontal" | "vertical"
  }
>({
  size: "default",
  variant: "default",
  spacing: 0,
  orientation: "horizontal",
})

function ToggleGroup({
  className,
  variant,
  size,
  spacing = 0,
  orientation = "horizontal",
  children,
  ...props
}: React.ComponentProps<typeof ToggleGroupPrimitive.Root> &
  VariantProps<typeof toggleVariants> & {
    spacing?: number
    orientation?: "horizontal" | "vertical"
  }) {
  return (
    <ToggleGroupPrimitive.Root
      data-slot="toggle-group"
      data-variant={variant}
      data-size={size}
      data-spacing={spacing}
      data-orientation={orientation}
      style={{ "--gap": spacing } as React.CSSProperties}
      className={cn(
        "group/toggle-group flex w-fit flex-row items-center gap-[--spacing(var(--gap))] rounded-md data-[spacing=0]:data-[variant=outline]:shadow-xs data-vertical:flex-col data-vertical:items-stretch",
        className
      )}
      {...props}
    >
      <ToggleGroupContext.Provider
        value={{ variant, size, spacing, orientation }}
      >
        {children}
      </ToggleGroupContext.Provider>
    </ToggleGroupPrimitive.Root>
  )
}

function ToggleGroupItem({
  className,
  children,
  variant = "default",
  size = "default",
  ...props
}: React.ComponentProps<typeof ToggleGroupPrimitive.Item> &
  VariantProps<typeof toggleVariants>) {
  const context = React.useContext(ToggleGroupContext)

  return (
    <ToggleGroupPrimitive.Item
      data-slot="toggle-group-item"
      data-variant={context.variant || variant}
      data-size={context.size || size}
      data-spacing={context.spacing}
      className={cn(
        "shrink-0 group-data-[spacing=0]/toggle-group:rounded-none group-data-[spacing=0]/toggle-group:px-2 group-data-[spacing=0]/toggle-group:shadow-none focus:z-10 focus-visible:z-10 group-data-[spacing=0]/toggle-group:has-data-[icon=inline-end]:pr-1.5 group-data-[spacing=0]/toggle-group:has-data-[icon=inline-start]:pl-1.5 group-data-horizontal/toggle-group:data-[spacing=0]:first:rounded-l-md group-data-vertical/toggle-group:data-[spacing=0]:first:rounded-t-md group-data-horizontal/toggle-group:data-[spacing=0]:last:rounded-r-md group-data-vertical/toggle-group:data-[spacing=0]:last:rounded-b-md data-[state=on]:bg-muted group-data-horizontal/toggle-group:data-[spacing=0]:data-[variant=outline]:border-l-0 group-data-vertical/toggle-group:data-[spacing=0]:data-[variant=outline]:border-t-0 group-data-horizontal/toggle-group:data-[spacing=0]:data-[variant=outline]:first:border-l group-data-vertical/toggle-group:data-[spacing=0]:data-[variant=outline]:first:border-t",
        toggleVariants({
          variant: context.variant || variant,
          size: context.size || size,
        }),
        className
      )}
      {...props}
    >
      {children}
    </ToggleGroupPrimitive.Item>
  )
}

export { ToggleGroup, ToggleGroupItem }
```

- [ ] **Step 3: Verificar TypeScript dos novos arquivos**

```bash
cd apps/console && pnpm tsc --noEmit 2>&1 | grep -E "toggle" | head -20
```

Esperado: sem erros relacionados a `toggle`.

- [ ] **Step 4: Commit**

```bash
git add apps/console/src/components/ui/toggle.tsx apps/console/src/components/ui/toggle-group.tsx
git commit -m "feat(console): adiciona componentes toggle e toggle-group do shadcn"
```

---

## Task 2: Substituir `globals.css` com tema neutro padrão

Remove os tokens âmbar do dark mode, `--page-bg`, `--color-amber*`, radii extras e chart colors. Mantém apenas os tokens canônicos do shadcn com paleta zinc/neutral.

**Files:**
- Modify: `apps/console/src/app/globals.css`

- [ ] **Step 1: Substituir o conteúdo completo de `globals.css`**

Substituir todo o conteúdo de `apps/console/src/app/globals.css` por:

```css
@import "tailwindcss";
@import "tw-animate-css";
@import "shadcn/tailwind.css";

@custom-variant dark (&:is(.dark *));

@theme inline {
  /* Tipografia */
  --font-sans: var(--font-geist-sans);
  --font-mono: var(--font-geist-mono);

  /* shadcn tokens → Tailwind utilities */
  --color-background:           var(--background);
  --color-foreground:           var(--foreground);
  --color-card:                 var(--card);
  --color-card-foreground:      var(--card-foreground);
  --color-popover:              var(--popover);
  --color-popover-foreground:   var(--popover-foreground);
  --color-primary:              var(--primary);
  --color-primary-foreground:   var(--primary-foreground);
  --color-secondary:            var(--secondary);
  --color-secondary-foreground: var(--secondary-foreground);
  --color-muted:                var(--muted);
  --color-muted-foreground:     var(--muted-foreground);
  --color-accent:               var(--accent);
  --color-accent-foreground:    var(--accent-foreground);
  --color-destructive:          var(--destructive);
  --color-border:               var(--border);
  --color-input:                var(--input);
  --color-ring:                 var(--ring);

  /* Sidebar */
  --color-sidebar:                    var(--sidebar);
  --color-sidebar-foreground:         var(--sidebar-foreground);
  --color-sidebar-primary:            var(--sidebar-primary);
  --color-sidebar-primary-foreground: var(--sidebar-primary-foreground);
  --color-sidebar-accent:             var(--sidebar-accent);
  --color-sidebar-accent-foreground:  var(--sidebar-accent-foreground);
  --color-sidebar-border:             var(--sidebar-border);
  --color-sidebar-ring:               var(--sidebar-ring);

  /* Border radius */
  --radius-sm: calc(var(--radius) - 4px);
  --radius-md: calc(var(--radius) - 2px);
  --radius-lg: var(--radius);
  --radius-xl: calc(var(--radius) + 4px);

  /* Layout */
  --width-sidebar: var(--sidebar-width);
  --height-header: var(--header-height);
}

:root {
  --background:                 oklch(1 0 0);
  --foreground:                 oklch(0.145 0 0);
  --card:                       oklch(1 0 0);
  --card-foreground:            oklch(0.145 0 0);
  --popover:                    oklch(1 0 0);
  --popover-foreground:         oklch(0.145 0 0);
  --primary:                    oklch(0.205 0 0);
  --primary-foreground:         oklch(0.985 0 0);
  --secondary:                  oklch(0.97 0 0);
  --secondary-foreground:       oklch(0.205 0 0);
  --muted:                      oklch(0.97 0 0);
  --muted-foreground:           oklch(0.556 0 0);
  --accent:                     oklch(0.97 0 0);
  --accent-foreground:          oklch(0.205 0 0);
  --destructive:                oklch(0.577 0.245 27.325);
  --border:                     oklch(0.922 0 0);
  --input:                      oklch(0.922 0 0);
  --ring:                       oklch(0.708 0 0);
  --radius:                     0.625rem;
  --sidebar:                    oklch(0.985 0 0);
  --sidebar-foreground:         oklch(0.145 0 0);
  --sidebar-primary:            oklch(0.205 0 0);
  --sidebar-primary-foreground: oklch(0.985 0 0);
  --sidebar-accent:             oklch(0.97 0 0);
  --sidebar-accent-foreground:  oklch(0.205 0 0);
  --sidebar-border:             oklch(0.922 0 0);
  --sidebar-ring:               oklch(0.708 0 0);
  --sidebar-width:              220px;
  --header-height:              52px;
}

.dark {
  --background:                 oklch(0.145 0 0);
  --foreground:                 oklch(0.985 0 0);
  --card:                       oklch(0.205 0 0);
  --card-foreground:            oklch(0.985 0 0);
  --popover:                    oklch(0.205 0 0);
  --popover-foreground:         oklch(0.985 0 0);
  --primary:                    oklch(0.922 0 0);
  --primary-foreground:         oklch(0.205 0 0);
  --secondary:                  oklch(0.269 0 0);
  --secondary-foreground:       oklch(0.985 0 0);
  --muted:                      oklch(0.269 0 0);
  --muted-foreground:           oklch(0.708 0 0);
  --accent:                     oklch(0.269 0 0);
  --accent-foreground:          oklch(0.985 0 0);
  --destructive:                oklch(0.704 0.191 22.216);
  --border:                     oklch(1 0 0 / 10%);
  --input:                      oklch(1 0 0 / 15%);
  --ring:                       oklch(0.556 0 0);
  --sidebar:                    oklch(0.205 0 0);
  --sidebar-foreground:         oklch(0.985 0 0);
  --sidebar-primary:            oklch(0.922 0 0);
  --sidebar-primary-foreground: oklch(0.205 0 0);
  --sidebar-accent:             oklch(0.269 0 0);
  --sidebar-accent-foreground:  oklch(0.985 0 0);
  --sidebar-border:             oklch(1 0 0 / 10%);
  --sidebar-ring:               oklch(0.556 0 0);
}

@layer base {
  * {
    @apply border-border outline-ring/50;
  }
  body {
    @apply bg-background text-foreground;
  }
  html {
    @apply font-sans;
  }
}
```

- [ ] **Step 2: Commit**

```bash
git add apps/console/src/app/globals.css
git commit -m "feat(console): substitui tema customizado por padrão neutro shadcn/zinc"
```

---

## Task 3: Criar o componente `ThemeSwitcher`

**Files:**
- Create: `apps/console/src/components/sidebar/theme-switcher.tsx`

- [ ] **Step 1: Criar o arquivo**

Criar `apps/console/src/components/sidebar/theme-switcher.tsx`:

```tsx
'use client'

import { Monitor, Moon, Sun } from 'lucide-react'
import { useTheme } from 'next-themes'

import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group'

export function ThemeSwitcher() {
  const { theme, setTheme } = useTheme()

  return (
    <ToggleGroup
      type="single"
      aria-label="Toggle theme"
      size="sm"
      defaultValue={theme}
      variant="outline"
      className="w-full"
    >
      <ToggleGroupItem
        value="light"
        onClick={() => setTheme('light')}
        className="flex-1"
      >
        <Sun className="size-4" />
      </ToggleGroupItem>
      <ToggleGroupItem
        value="dark"
        onClick={() => setTheme('dark')}
        className="flex-1"
      >
        <Moon className="size-4" />
      </ToggleGroupItem>
      <ToggleGroupItem
        value="system"
        onClick={() => setTheme('system')}
        className="flex-1"
      >
        <Monitor className="size-4" />
      </ToggleGroupItem>
    </ToggleGroup>
  )
}
```

- [ ] **Step 2: Verificar TypeScript**

```bash
cd apps/console && pnpm tsc --noEmit 2>&1 | grep -E "theme-switcher" | head -10
```

Esperado: sem erros.

- [ ] **Step 3: Commit**

```bash
git add apps/console/src/components/sidebar/theme-switcher.tsx
git commit -m "feat(console): adiciona ThemeSwitcher na sidebar"
```

---

## Task 4: Atualizar `ProfileButton` — Avatar + ThemeSwitcher

Remove o prop `initials` (passa a calcular localmente), substitui a `<div>` de avatar pelo componente `<Avatar>` do shadcn e insere o `ThemeSwitcher` no dropdown.

**Files:**
- Modify: `apps/console/src/components/sidebar/profile-button.tsx`

- [ ] **Step 1: Substituir o conteúdo completo do arquivo**

Substituir `apps/console/src/components/sidebar/profile-button.tsx` por:

```tsx
'use client'

import { EllipsisVertical, LogOut } from 'lucide-react'
import { useTransition } from 'react'

import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { SidebarMenuButton, useSidebar } from '@/components/ui/sidebar'

import { signOut } from '@/http/sign-out'
import { ThemeSwitcher } from './theme-switcher'

interface ProfileButtonProps {
  user: {
    name: string
    email: string
  }
}

function initials(name: string) {
  return name
    .split(' ')
    .slice(0, 2)
    .map((part: string) => part[0]?.toUpperCase() ?? '')
    .join('')
}

export function ProfileButton({ user }: ProfileButtonProps) {
  const { isMobile } = useSidebar()
  const [isPending, startTransition] = useTransition()

  function handleSignOut() {
    startTransition(() => signOut())
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <SidebarMenuButton
          size="lg"
          className="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground"
        >
          <Avatar className="h-8 w-8 rounded-lg grayscale">
            <AvatarFallback className="rounded-lg">
              {initials(user.name)}
            </AvatarFallback>
          </Avatar>
          <div className="grid flex-1 text-left text-sm leading-tight">
            <span className="truncate font-medium">{user.name}</span>
            <span className="text-muted-foreground truncate text-xs">
              {user.email}
            </span>
          </div>
          <EllipsisVertical className="ml-auto size-4" />
        </SidebarMenuButton>
      </DropdownMenuTrigger>

      <DropdownMenuContent
        className="w-(--radix-dropdown-menu-trigger-width) min-w-56 rounded-lg"
        side={isMobile ? 'bottom' : 'right'}
        align="end"
        sideOffset={4}
      >
        <DropdownMenuLabel className="p-0 font-normal">
          <div className="flex items-center gap-2 px-1 py-1.5 text-left text-sm">
            <Avatar className="h-8 w-8 rounded-lg">
              <AvatarFallback className="rounded-lg">
                {initials(user.name)}
              </AvatarFallback>
            </Avatar>
            <div className="grid flex-1 text-left text-sm leading-tight">
              <span className="truncate font-medium">{user.name}</span>
              <span className="text-muted-foreground truncate text-xs">
                {user.email}
              </span>
            </div>
          </div>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuGroup>
          <ThemeSwitcher />
        </DropdownMenuGroup>
        <DropdownMenuSeparator />
        <DropdownMenuGroup>
          <DropdownMenuItem
            onClick={handleSignOut}
            disabled={isPending}
            variant="destructive"
          >
            <LogOut className="size-4" />
            {isPending ? 'Saindo...' : 'Sair'}
          </DropdownMenuItem>
        </DropdownMenuGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
```

- [ ] **Step 2: Verificar TypeScript**

```bash
cd apps/console && pnpm tsc --noEmit 2>&1 | grep -E "profile-button" | head -10
```

Esperado: sem erros.

- [ ] **Step 3: Commit**

```bash
git add apps/console/src/components/sidebar/profile-button.tsx
git commit -m "feat(console): ProfileButton com Avatar shadcn e ThemeSwitcher"
```

---

## Task 5: Atualizar `NavUser` — alinhar com padrão do admin

Envolve o `ProfileButton` com `SidebarMenu`/`SidebarMenuItem` e remove a `border-t` inline.

**Files:**
- Modify: `apps/console/src/components/sidebar/nav-user.tsx`

- [ ] **Step 1: Substituir o conteúdo completo do arquivo**

Substituir `apps/console/src/components/sidebar/nav-user.tsx` por:

```tsx
import { SidebarMenu, SidebarMenuItem } from '@/components/ui/sidebar'
import { createClient } from '@/lib/supabase/server'

import { ProfileButton } from './profile-button'

export async function NavUser() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  let name = 'Usuário'
  let email = ''

  if (user) {
    const { data: profile } = await supabase
      .from('tenant_users')
      .select('full_name')
      .eq('id', user.id)
      .single()
    name = profile?.full_name ?? 'Usuário'
    email = user.email ?? ''
  }

  return (
    <SidebarMenu>
      <SidebarMenuItem>
        <ProfileButton user={{ name, email }} />
      </SidebarMenuItem>
    </SidebarMenu>
  )
}
```

- [ ] **Step 2: Verificar TypeScript**

```bash
cd apps/console && pnpm tsc --noEmit 2>&1 | grep -E "nav-user" | head -10
```

Esperado: sem erros.

- [ ] **Step 3: Commit**

```bash
git add apps/console/src/components/sidebar/nav-user.tsx
git commit -m "fix(console): NavUser usa SidebarMenu/SidebarMenuItem igual ao admin"
```

---

## Task 6: Limpar `NavLink` — remover CSS vars inline

Substitui referências `bg-[var(--sidebar-accent)]` e `text-[var(--sidebar-accent-foreground)]` pelas utilities do Tailwind equivalentes.

**Files:**
- Modify: `apps/console/src/components/sidebar/nav-link.tsx`

- [ ] **Step 1: Substituir o conteúdo completo do arquivo**

Substituir `apps/console/src/components/sidebar/nav-link.tsx` por:

```tsx
'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import type { ComponentProps } from 'react'

import { SidebarMenuButton } from '@/components/ui/sidebar'
import { cn } from '@/lib/utils'

interface NavLinkProps extends Omit<ComponentProps<typeof Link>, 'href'> {
  href: string
  icon: React.ReactNode
  label: string
  badge?: number
  disabled?: boolean
}

export function NavLink({ icon, label, badge, disabled, href, ...props }: NavLinkProps) {
  const pathname = usePathname()
  const isActive = href !== '#' && (href === '/' ? pathname === '/' : pathname.startsWith(href))

  return (
    <SidebarMenuButton tooltip={label} isActive={isActive} asChild>
      <Link
        href={href}
        {...props}
        onClick={disabled ? (e) => e.preventDefault() : undefined}
        className={cn(
          'group flex items-center gap-2.5 rounded-md px-2.5 py-2 text-sm transition-colors w-full',
          isActive
            ? 'bg-sidebar-accent text-sidebar-accent-foreground font-medium'
            : disabled
              ? 'text-muted-foreground/40 cursor-not-allowed'
              : 'text-sidebar-foreground/70 hover:bg-sidebar-accent/40 hover:text-sidebar-foreground',
        )}
      >
        <span className={cn('shrink-0', isActive ? 'text-sidebar-primary' : '')}>
          {icon}
        </span>
        <span className="flex-1 truncate">{label}</span>
        {badge !== undefined && badge > 0 && (
          <span className={cn(
            'ml-auto rounded-full px-1.5 py-0.5 text-[10px] font-semibold leading-none tabular-nums',
            isActive
              ? 'bg-black/20 text-white'
              : 'bg-muted text-muted-foreground',
          )}>
            {badge > 99 ? '99+' : badge}
          </span>
        )}
      </Link>
    </SidebarMenuButton>
  )
}
```

- [ ] **Step 2: Verificar TypeScript**

```bash
cd apps/console && pnpm tsc --noEmit 2>&1 | grep -E "nav-link" | head -10
```

Esperado: sem erros.

- [ ] **Step 3: Commit**

```bash
git add apps/console/src/components/sidebar/nav-link.tsx
git commit -m "refactor(console): NavLink usa utilities Tailwind em vez de CSS vars inline"
```

---

## Task 7: Verificação final de TypeScript

Confirmar que todo o console compila sem erros antes de encerrar.

- [ ] **Step 1: Verificação completa**

```bash
cd apps/console && pnpm tsc --noEmit
```

Esperado: saída vazia (sem erros). Se houver erros, resolvê-los antes de prosseguir.

- [ ] **Step 2: Verificar build**

```bash
cd apps/console && pnpm build 2>&1 | tail -20
```

Esperado: `✓ Compiled successfully` sem erros de tipo ou import ausente.
