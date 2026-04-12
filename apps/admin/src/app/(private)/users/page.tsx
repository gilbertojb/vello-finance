import { userSchema } from '@vello/auth'

import Link from 'next/link'

import { ability } from '@/lib/auth'
import { Button } from '@/components/ui/button'

import { UserTable } from './_components/user-table'
import { listUsers } from './queries'

export const metadata = {
  title: 'Usuários',
}

export default async function UsersPage() {
  const permissions = await ability()

  const users = await listUsers()

  const canCreate = permissions.can('create', 'User')

  const userPermissions: Record<string, { canDelete: boolean; canDeactivate: boolean }> = {}
  for (const u of users) {
    const target = userSchema.parse({ id: u.id, user_role: u.role })
    userPermissions[u.id] = {
      canDelete: permissions.can('delete', target),
      canDeactivate: permissions.can('deactivate', target),
    }
  }

  const tablePermissions = {
    canEdit: permissions.can('update', 'User'),
    userPermissions,
  }

  return (
    <div className="flex-1 space-y-4 p-8 pt-6">
      <div className="flex items-center justify-between space-y-2">
        <h2 className="text-3xl font-bold tracking-tight">Usuários</h2>
        {canCreate && (
          <Button asChild>
            <Link href="/users/new">Novo Usuário</Link>
          </Button>
        )}
      </div>
      <UserTable users={users} permissions={tablePermissions} />
    </div>
  )
}
