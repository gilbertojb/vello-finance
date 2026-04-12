import { userSchema } from '@vello/auth'
import { notFound, redirect } from 'next/navigation'

import { ability } from '@/lib/auth'

import { UserForm } from '../../_components/user-form'
import { getUser } from '../../queries'

export const metadata = {
  title: 'Editar Usuário',
}

export default async function EditUserPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const permissions = await ability()

  if (!permissions.can('update', 'User')) {
    redirect('/users')
  }

  const user = await getUser(id)
  if (!user) notFound()

  const targetUser = userSchema.parse({ id: user.id, user_role: user.role })
  const canDeactivate = permissions.can('deactivate', targetUser)

  return (
    <div className="flex-1 space-y-4 p-8 pt-6">
      <h2 className="text-3xl font-bold tracking-tight">Editar Usuário</h2>
      <UserForm user={user} canDeactivate={canDeactivate} />
    </div>
  )
}
