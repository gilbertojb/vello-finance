import { redirect } from 'next/navigation'

import { ability } from '@/lib/auth'

import { UserForm } from '../_components/user-form'

export const metadata = {
  title: 'Novo Usuário',
}

export default async function NewUserPage() {
  const permissions = await ability()

  if (!permissions.can('create', 'User')) {
    redirect('/users')
  }

  return (
    <div className="flex-1 space-y-4 p-8 pt-6">
      <h2 className="text-3xl font-bold tracking-tight">Novo Usuário</h2>
      <UserForm />
    </div>
  )
}
