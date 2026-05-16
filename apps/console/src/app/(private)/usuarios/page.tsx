import type { Metadata } from 'next'
import { createClient } from '@/lib/supabase/server'
import { listTenantUsers } from './queries'
import { UsersList } from './_components/users-list'

export const metadata: Metadata = { title: 'Usuários' }

export default async function UsuariosPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  const users = await listTenantUsers()

  return (
    <div className="mx-auto max-w-10/12 w-full p-8">
      <div className="mb-7">
        <span className="text-xs font-medium uppercase tracking-widest text-foreground/45">
          Sistema · Equipe
        </span>
        <h1 className="mb-2 mt-1 text-4xl font-semibold leading-none tracking-tight text-foreground">
          Usuários<span className="text-primary">.</span>
        </h1>
        <p className="m-0 max-w-xl text-sm leading-normal text-foreground/55">
          Gerencie os membros com acesso ao painel da sua loja.
        </p>
      </div>
      <UsersList users={users} currentUserId={user?.id ?? ''} />
    </div>
  )
}
