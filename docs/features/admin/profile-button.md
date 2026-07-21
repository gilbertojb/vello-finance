# Feature Spec — Profile Button: User Data and Sign-Out

**App:** `apps/admin` — Vello Admin
**Component:** `src/components/sidebar/profile-button.tsx`
**Status:** `implemented`
**Priority:** High — hardcoded data in production

---

## Previous Situation

`profile-button.tsx` displayed **hardcoded** name, email, and initials.
The "Sair" button did not perform any action.

```tsx
// ❌ Estado anterior — dados fixos, sem sign-out
<AvatarFallback>GB</AvatarFallback>
<span>Gilberto Bueno</span>
<span>gilberto@vellofinance.com.br</span>
<DropdownMenuItem><LogOut /> Sair</DropdownMenuItem>  {/* sem ação */}
```

---

## Objective

1. Display the authenticated user's full name and email
2. Display initials generated from the name in the `Avatar`
3. Functional sign-out via Server Action

---

## Data Flow

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

**Fat Server Rule:** `ProfileButton` receives data via props — it never imports or calls Supabase directly.

---

## Data to Display

| Field | Source | Display |
|---|---|---|
| Full name | `backoffice_users.full_name` | Trigger + dropdown header |
| Email | `auth.users.email` | Below the name |
| Initials | local `initials()` function — first 2 words of the name | `AvatarFallback` |

---

## Implementation

### `nav-user.tsx` — fetches the data (Server Component)

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

### `sign-out.ts` — sign-out Server Action

`actions.ts` is reserved for form Server Actions.
Session operations live in `src/http/`:

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

### `profile-button.tsx` — receives props and calls the action (Client Component)

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

## Files Modified / Created

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

## Acceptance Criteria

- [x] Authenticated user's name and email displayed (not hardcoded)
- [x] Initials generated dynamically via the local `initials()` function from `full_name`
- [x] Clicking "Sair" calls `signOut()` and redirects to `/sign-in`
- [x] "Sair" button shows "Saindo..." and is disabled during the transition
- [x] If `full_name` is null, falls back to `'Usuário'`
- [x] No Supabase access in `profile-button.tsx` — props only

---

---

## Theme Switcher

`ProfileButton` integrates the `ThemeSwitcher` component to toggle between light/dark mode.

```tsx
// src/components/sidebar/theme-switcher.tsx (Client Component)
// Renderizado dentro do DropdownMenuContent do ProfileButton
<ThemeSwitcher />
```

`ThemeSwitcher` uses `next-themes` to persist the user's preference.

---

## Out of Scope

- Role badge in the dropdown
- User profile editing
- Avatar upload (profile photo)
- Password change from the sidebar
