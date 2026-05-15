# Spec: Console — Reset de Layout + Theme Switcher

**Data:** 2026-05-15
**App afetado:** `apps/console`
**Escopo:** Remoção de estilização customizada, adoção do tema padrão shadcn/Tailwind e adição de theme switcher na sidebar.

---

## Contexto

O console acumulou estilização própria que conflita com a proposta de um app neutro cuja identidade visual vem do tenant (via `custom_css` injetado em runtime). Especificamente:

- Dark mode com paleta âmbar/quente hardcoded em `globals.css`
- Tokens extra não-padrão (`--page-bg`, `--color-amber`, radii extras, charts no dark)
- `NavLink` com CSS vars inline em vez de utilities do Tailwind
- `NavUser` e `ProfileButton` desalinhados com o padrão do admin
- Ausência de theme switcher (light/dark/system)

O sistema de tema por tenant (`TenantThemeLoader`, injeção de `custom_css`, rota `/api/tenant-theme`) é uma feature de produto e **não será alterado**.

---

## Objetivos

1. `globals.css` — tema base neutro (shadcn canônico), sem cores de marca
2. ThemeSwitcher no `ProfileButton` do console, igual ao admin
3. `ProfileButton` e `NavUser` alinhados com o padrão do admin
4. `NavLink` sem referências diretas a CSS vars

---

## Arquivos alterados

### `apps/console/src/app/globals.css`

**Remove:**
- Tokens dark mode âmbar (`oklch(... 70)` e similares)
- `--page-bg` do `@theme inline` e do `:root`/`.dark`
- `--color-amber`, `--color-amber-dim` do `@theme inline`
- `--radius-2xl`, `--radius-3xl`, `--radius-4xl` do `@theme inline`
- `--color-chart-*` do `@theme inline` e do `.dark` (tokens de chart não padrão)
- `--text-2xs` e `--font-heading` (fora do padrão shadcn)

**Mantém:**
- Imports: `tailwindcss`, `tw-animate-css`, `shadcn/tailwind.css`
- `@custom-variant dark (&:is(.dark *))`
- `@theme inline`: mapeamento dos tokens shadcn → Tailwind utilities (background, foreground, card, primary, secondary, muted, accent, destructive, border, input, ring, sidebar-*, radius-sm/md/lg/xl)
- `@theme inline`: fontes (`--font-sans`, `--font-mono`) e layout (`--width-sidebar`, `--height-header`)
- `:root`: cores neutras canônicas do shadcn (zinc/slate, sem cor de marca)
- `.dark`: par dark canônico do shadcn (zinc-950/zinc-900, sem cor de marca)
- `@layer base`: `* { @apply border-border outline-ring/50 }`, `body`, `html`

**Paleta de referência (shadcn default zinc):**
```css
:root {
  --background: oklch(1 0 0);
  --foreground: oklch(0.145 0 0);
  --card: oklch(1 0 0);
  --primary: oklch(0.205 0 0);
  --primary-foreground: oklch(0.985 0 0);
  --muted: oklch(0.97 0 0);
  --muted-foreground: oklch(0.556 0 0);
  --border: oklch(0.922 0 0);
  --radius: 0.625rem;
  --sidebar: oklch(0.985 0 0);
  --sidebar-primary: oklch(0.205 0 0);
  /* ... demais tokens no mesmo estilo neutro */
}

.dark {
  --background: oklch(0.145 0 0);
  --foreground: oklch(0.985 0 0);
  --card: oklch(0.205 0 0);
  --primary: oklch(0.922 0 0);
  --primary-foreground: oklch(0.205 0 0);
  --sidebar: oklch(0.205 0 0);
  /* ... zinc-900/zinc-950 para o resto */
}
```

O tenant CSS sobrescreve `--primary`, `--sidebar-primary`, etc. em `:root` (e `.dark` se quiser suporte dark).

---

### `apps/console/src/components/sidebar/theme-switcher.tsx` — **Novo arquivo**

Cópia exata do admin (`apps/admin/src/components/sidebar/theme-switcher.tsx`):

```tsx
'use client'

import { Monitor, Moon, Sun } from 'lucide-react'
import { useTheme } from 'next-themes'
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group'

export function ThemeSwitcher() {
  const { theme, setTheme } = useTheme()
  return (
    <ToggleGroup type="single" aria-label="Toggle theme" size="sm"
      defaultValue={theme} variant="outline" className="w-full">
      <ToggleGroupItem value="light" onClick={() => setTheme('light')} className="flex-1">
        <Sun className="size-4" />
      </ToggleGroupItem>
      <ToggleGroupItem value="dark" onClick={() => setTheme('dark')} className="flex-1">
        <Moon className="size-4" />
      </ToggleGroupItem>
      <ToggleGroupItem value="system" onClick={() => setTheme('system')} className="flex-1">
        <Monitor className="size-4" />
      </ToggleGroupItem>
    </ToggleGroup>
  )
}
```

Requer o componente `toggle-group` do shadcn. Se não existir no console, adicionar via `pnpm dlx shadcn@latest add toggle-group` dentro de `apps/console`.

---

### `apps/console/src/components/sidebar/profile-button.tsx`

**Altera:**
- Remove prop `initials?: string` — calcula localmente com função `initials()` (igual ao admin)
- Troca `<div>` de avatar por `<Avatar>` + `<AvatarFallback>` (componente já existe em `ui/avatar`)
- Adiciona import do `ThemeSwitcher`
- Adiciona `<ThemeSwitcher />` em `<DropdownMenuGroup>` antes do separador do logout

**Interface resultante:**
```tsx
interface ProfileButtonProps {
  user: { name: string; email: string }
}
```

---

### `apps/console/src/components/sidebar/nav-user.tsx`

**Altera:**
- Envolve `<ProfileButton>` com `<SidebarMenu>` + `<SidebarMenuItem>` (igual ao admin)
- Remove `border-t border-sidebar-border pt-3` — o `SidebarFooter` gerencia o espaçamento
- Remove prop `initials` passado para `ProfileButton`

---

### `apps/console/src/components/sidebar/nav-link.tsx`

**Altera:**
- `bg-[var(--sidebar-accent)]` → `bg-sidebar-accent`
- `text-[var(--sidebar-accent-foreground)]` → `text-sidebar-accent-foreground`
- Remove quaisquer outras referências `[var(--...)]` substituindo pela utility Tailwind equivalente

---

## O que não muda

- `apps/console/src/app/layout.tsx` — injeção de `custom_css`
- `apps/console/src/components/tenant-theme-loader.tsx`
- `apps/console/src/lib/theme/load-tenant-theme.ts`
- `apps/console/src/app/api/tenant-theme/route.ts`
- `apps/console/src/app/providers.tsx`
- Todas as páginas, routes, queries, actions

---

## Critérios de aceitação

- [ ] `globals.css` sem tokens âmbar, sem `--page-bg`, sem extra-radius
- [ ] ThemeSwitcher aparece no dropdown do ProfileButton e alterna corretamente light/dark/system
- [ ] `ProfileButton` usa `Avatar` do shadcn
- [ ] `NavUser` usa `SidebarMenu`/`SidebarMenuItem`
- [ ] `NavLink` sem `[var(--...)]` inline
- [ ] Sistema de tema do tenant continua funcional
- [ ] Sem erros de TypeScript
