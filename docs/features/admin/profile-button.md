# Feature Spec — Profile Button: Dados do Usuário e Sign-Out

**App:** `apps/admin` — Vello Admin
**Componente:** `src/components/sidebar/profile-button.tsx`
**Status:** `implementado`
**Prioridade:** Alta — dados hardcoded em produção

---

## Situação Anterior

`profile-button.tsx` exibia nome, email e iniciais **hardcoded**.
O botão "Sair" não executava nenhuma ação.

```tsx
// ❌ Estado anterior — dados fixos, sem sign-out
<AvatarFallback>GB</AvatarFallback>
<span>Gilberto Bueno</span>
<span>gilberto@vellofinance.com.br</span>
<DropdownMenuItem><LogOut /> Sair</DropdownMenuItem>  {/* sem ação */}
```

---

## Objetivo

1. Exibir nome completo e e-mail do usuário autenticado
2. Exibir iniciais geradas a partir do nome no `Avatar`
3. Sign-out funcional via Server Action

---

## Fluxo de Dados

```
nav-user.tsx (Server Component)
  └── createClient()              ← @/lib/supabase/server
  └── supabase.auth.getUser()     ← obtém auth.users
  └── supabase.from('backoffice_users').select('full_name')
  └── passa { name, email } via prop user
        ↓
  ProfileButton (Client Component)
  └── recebe user: { name, email } — sem acesso ao banco
  └── calcula iniciais localmente com função initials()
  └── renderiza Avatar + nome + email
  └── chama signOut() (Server Action) ao clicar em "Sair"
```

**Regra Fat Server:** `ProfileButton` recebe dados via props — nunca importa nem chama Supabase diretamente.

---

## Dados a Exibir

| Campo | Fonte | Exibição |
|---|---|---|
| Nome completo | `backoffice_users.full_name` | Trigger + dropdown header |
| E-mail | `auth.users.email` | Abaixo do nome |
| Iniciais | função local `initials()` — 2 primeiras palavras do nome | `AvatarFallback` |

---

## Implementação

### `nav-user.tsx` — busca os dados (Server Component)

```tsx
// src/components/sidebar/nav-user.tsx
import { SidebarMenu, SidebarMenuItem } from '@/components/ui/sidebar'
import { createClient } from '@/lib/supabase/server'

import { ProfileButton } from './profile-button'

export async function NavUser() {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  const { data: profile } = await supabase
    .from('backoffice_users')
    .select('full_name')
    .eq('id', user?.id)
    .single()

  const name = profile?.full_name ?? 'Usuário'
  const email = user?.email ?? ''

  return (
    <SidebarMenu>
      <SidebarMenuItem>
        <ProfileButton user={{ name, email }} />
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

import { EllipsisVertical, LogOut } from 'lucide-react'
import { useTransition } from 'react'

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

import { signOut } from '@/http/sign-out'

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
    .map((part: string) => part[0].toUpperCase())
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
              <span className="text-muted-foreground truncate text-xs">{user.email}</span>
            </div>
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

## Arquivos Modificados / Criados

```
apps/admin/src/
├── http/
│   └── sign-out.ts                 ← CRIADO — Server Action signOut()
└── components/
    └── sidebar/
        ├── nav-user.tsx            ← MODIFICADO — busca dados, passa user prop
        └── profile-button.tsx      ← MODIFICADO — recebe user prop, sign-out funcional
```

---

## Critérios de Aceite

- [x] Nome e e-mail do usuário autenticado exibidos (não hardcoded)
- [x] Iniciais geradas dinamicamente via função local `initials()` a partir do `full_name`
- [x] Clicar em "Sair" chama `signOut()` e redireciona para `/sign-in`
- [x] Botão "Sair" exibe "Saindo..." e fica desabilitado durante a transição
- [x] Se `full_name` for nulo, fallback para `'Usuário'`
- [x] Sem acesso ao Supabase em `profile-button.tsx` — apenas props

---

## Fora do Escopo

- Badge de role no dropdown
- Edição de perfil do usuário
- Upload de avatar (foto de perfil)
- Troca de senha pelo sidebar
