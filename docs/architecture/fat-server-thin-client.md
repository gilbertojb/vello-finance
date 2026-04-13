# Arquitetura: Fat Server, Thin Client

## Regra central

O browser NUNCA fala diretamente com o Supabase.
Toda chamada ao banco é feita no servidor (Server Components, Server Actions, Route Handlers).

## Exemplos

**✅ CORRETO — dados buscados no servidor:**
```tsx
// app/(app)/plans/page.tsx — Server Component
import { createClient } from '@/lib/supabase/server'

export default async function PlansPage() {
  const supabase = await createClient()
  const { data } = await supabase.from('plans').select('*')
  return <PlanTable plans={data} />
}
```

**❌ ERRADO — dados buscados no cliente:**
```tsx
'use client'
import { createClient } from '@/lib/supabase/client' // NUNCA em páginas de dados

export default function PlansPage() {
  const [plans, setPlans] = useState([])
  useEffect(() => {
    createClient().from('plans').select('*').then(...) // PROIBIDO
  }, [])
}
```

**✅ CORRETO — mutação via Server Action:**
```tsx
// app/(app)/plans/actions.ts
'use server'
import { createClient } from '@/lib/supabase/server'

export async function createPlan(formData: FormData) {
  const supabase = await createClient() // server client — não exposto
  await supabase.from('plans').insert(...)
}
```

**❌ ERRADO — mutação via fetch do cliente:**
```tsx
'use client'
// NUNCA chamar supabase.from() direto no client component para mutações
```

## Quando `supabase/client.ts` pode ser usado

Apenas para estes casos específicos, sem acesso ao banco:
- `supabase.auth.getUser()` — verificar sessão ativa no cliente
- `supabase.auth.signOut()` — logout
- Subscriptions de Realtime (quando notificações em tempo real forem necessárias — documentar explicitamente)

## Fluxo de dados obrigatório

```
Browser                    Servidor (Next.js)           Supabase
  │                               │                         │
  │── clica em "Salvar" ─────────▶│                         │
  │                        Server Action                    │
  │                               │── INSERT/SELECT ───────▶│
  │                               │◀── resultado ───────────│
  │◀── redirect ou toast ─────────│                         │
```

## Verificação antes de criar qualquer arquivo

1. Este arquivo tem `'use client'`? → NÃO pode importar `supabase/server` nem fazer queries
2. Este arquivo é Server Component ou tem `'use server'`? → PODE fazer queries
3. Preciso de dado no cliente? → receba via props do Server Component pai
