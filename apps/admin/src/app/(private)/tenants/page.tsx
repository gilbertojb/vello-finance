import Link from 'next/link'

import { Button } from '@/components/ui/button'
import { TenantTable } from './_components/tenant-table'
import { listTenants } from './queries'

export const metadata = {
  title: 'Parceiros',
}

export default async function TenantsPage() {
  const tenants = await listTenants()

  return (
    <div className="flex-1 space-y-4 p-8 pt-6">
      <div className="flex items-center justify-between space-y-2">
        <h2 className="text-3xl font-bold tracking-tight">Parceiros</h2>
        <Button asChild>
          <Link href="/tenants/new">Cadastrar Parceiro</Link>
        </Button>
      </div>
      <TenantTable tenants={tenants} />
    </div>
  )
}
