import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { FinancialPartnerTable } from './_components/financial-partner-table'
import { listFinancialPartners } from './queries'

export const metadata = {
  title: 'Instituições Financeiras',
}

export default async function FinancialPartnersPage() {
  const partners = await listFinancialPartners()

  return (
    <div className="flex-1 space-y-4 p-8 pt-6">
      <div className="flex items-center justify-between space-y-2">
        <h2 className="text-3xl font-bold tracking-tight">
          Instituições Financeiras
        </h2>
        <div className="flex items-center space-x-2">
          <Button asChild>
            <Link href="/financial-partners/new">Cadastrar Instituição</Link>
          </Button>
        </div>
      </div>
      <FinancialPartnerTable partners={partners} />
    </div>
  )
}
