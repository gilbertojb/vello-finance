# Feature Spec — Profile Button: Dados do Usuário e Sign-Out

**App:** `apps/admin` — Vello Admin
**Componente:** `src/components/sidebar/profile-button.tsx`
**Status:** `ready-for-dev`
**Prioridade:** Alta — dados hardcoded em produção

---

## Situação Atual

`profile-button.tsx` exibe nome, email e iniciais **hardcoded**.
O botão "Sair" não executa nenhuma ação.

```tsx
// ❌ Estado atual — dados fixos, sem sign-out
<AvatarFallback>GB</AvatarFallback>
<span>Gilberto Bueno</span>
<span>gilberto@vellofinance.com.br</span>
<DropdownMenuItem><LogOut /> Sair</DropdownMenuItem>  {/* sem ação */}
```

---

## Objetivo

1. Exibir nome completo, e-mail e role do usuário autenticado
2. Exibir iniciais geradas a partir do nome no `Avatar`
3. Sign-out funcional via Server Action

---

## Fluxo de Dados

```
nav-user.tsx (Server Component)
  └── createClient()              ← @/lib/supabase/server
  └── supabase.auth.getUser()     ← obtém auth.users
  └── supabase.from('backoffice_users').select('full_name, role')
  └── passa { name, email, initials, role } como props
        ↓
  ProfileButton (Client Component)
  └── recebe props — sem acesso ao banco
  └── renderiza Avatar + nome + email + badge de role
  └── chama signOut() (Server Action) ao clicar em "Sair"
```

**Regra Fat Server:** `ProfileButton` recebe dados via props — nunca importa nem chama Supabase diretamente.

---

## Dados a Exibir

| Campo | Fonte | Exibição |
|---|---|---|
| Nome completo | `backoffice_users.full_name` | Trigger + dropdown header |
| E-mail | `auth.users.email` | Abaixo do nome |
| Iniciais | 2 primeiras letras do nome (split por espaço) | `AvatarFallback` |
| Role | `backoffice_users.role` | Badge no dropdown (ver abaixo) |

**Badge de role:**

| Role | Label | Estilo |
|---|---|---|
| `super_admin` | Super Admin | `bg-primary/10 text-primary` |
| `admin` | Admin | `bg-primary/10 text-primary` |
| `financial` | Financeiro | `bg-primary/10 text-primary` |
| `support` | Suporte | `bg-muted text-muted-foreground` |

---

## Implementação

### `nav-user.tsx` — busca os dados (Server Component)

```tsx
// src/components/sidebar/nav-user.tsx
import { createClient } from '@/lib/supabase/server'
import { SidebarMenu, SidebarMenuItem } from '@/components/ui/sidebar'
import { ProfileButton } from './profile-button'

export async function NavUser() {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()

  const { data: profile } = await supabase
    .from('backoffice_users')
    .select('full_name, role')
    .eq('id', user!.id)
    .single()

  const name = profile?.full_name ?? user?.email ?? 'Usuário'
  const email = user?.email ?? ''
  const initials = name
    .split(' ')
    .slice(0, 2)
    .map((part) => part[0].toUpperCase())
    .join('')

  return (
    <SidebarMenu>
      <SidebarMenuItem>
        <ProfileButton
          name={name}
          email={email}
          initials={initials}
          role={profile?.role ?? 'support'}
        />
      </SidebarMenuItem>
    </SidebarMenu>
  )
}
```

---

### `sign-out.ts` — Server Action de sign-out

`actions.ts` é reservado para Server Actions de formulários.
Operações de sessão ficam em `src/http/`:

```typescript
// src/http/sign-out.ts
'use server'

import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'

export async function signOut() {
  const supabase = await createClient()
  await supabase.auth.signOut()
  redirect('/sign-in')
}
```

---

### `profile-button.tsx` — recebe props e chama a action (Client Component)

```tsx
// src/components/sidebar/profile-button.tsx
'use client'

import { useTransition } from 'react'
import { EllipsisVertical, LogOut } from 'lucide-react'

import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { SidebarMenuButton, useSidebar } from '@/components/ui/sidebar'

import type { BackofficeRole } from '@vello/auth'
import { signOut } from '@/http/sign-out'

const roleLabels: Record<BackofficeRole, string> = {
  super_admin: 'Super Admin',
  admin: 'Admin',
  financial: 'Financeiro',
  support: 'Suporte',
}

interface ProfileButtonProps {
  name: string
  email: string
  initials: string
  role: BackofficeRole
}

export function ProfileButton({ name, email, initials, role }: ProfileButtonProps) {
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
            <AvatarFallback className="rounded-lg">{initials}</AvatarFallback>
          </Avatar>
          <div className="grid flex-1 text-left text-sm leading-tight">
            <span className="truncate font-medium">{name}</span>
            <span className="text-muted-foreground truncate text-xs">{email}</span>
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
              <AvatarFallback className="rounded-lg">{initials}</AvatarFallback>
            </Avatar>
            <div className="grid flex-1 text-left text-sm leading-tight">
              <span className="truncate font-medium">{name}</span>
              <span className="text-muted-foreground truncate text-xs">{email}</span>
            </div>
            <span className="bg-primary/10 text-primary rounded-full px-2 py-0.5 text-xs">
              {roleLabels[role]}
            </span>
          </div>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={handleSignOut} disabled={isPending}>
          <LogOut className="size-4" />
          {isPending ? 'Saindo...' : 'Sair'}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
```

---

## Arquivos a Modificar / Criar

```
apps/admin/src/
├── app/
│   └── (private)/
│       └── actions.ts              ← CRIAR — Server Action signOut()
└── components/
    └── sidebar/
        ├── nav-user.tsx            ← MODIFICAR — busca dados, passa props
        └── profile-button.tsx      ← MODIFICAR — recebe props, sign-out funcional
└── http/
    └── sign-out.ts                 ← CRIAR — Server Action signOut()
```

---

## Critérios de Aceite

- [ ] Nome e e-mail do usuário autenticado exibidos (não hardcoded)
- [ ] Iniciais geradas dinamicamente a partir do `full_name`
- [ ] Badge de role exibido no header do dropdown
- [ ] Clicar em "Sair" chama `signOut()` e redireciona para `/sign-in`
- [ ] Botão "Sair" exibe "Saindo..." e fica desabilitado durante a transição
- [ ] Se `full_name` for nulo, fallback para o e-mail
- [ ] Sem acesso ao Supabase em `profile-button.tsx` — apenas props

---

## Fora do Escopo

- Edição de perfil do usuário
- Upload de avatar (foto de perfil)
- Troca de senha pelo sidebar
