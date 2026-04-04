import { notFound } from 'next/navigation'
import { FinancialPartnerForm } from '../../_components/financial-partner-form'
import { getFinancialPartner } from '../../queries'

export const metadata = {
  title: 'Editar Instituição Financeira',
}

export default async function EditFinancialPartnerPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const partner = await getFinancialPartner(id).catch(() => null)

  if (!partner) notFound()

  return (
    <div className="flex-1 space-y-4 p-8 pt-6">
      <div className="flex items-center justify-between space-y-2">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">
            Editar Instituição Financeira
          </h2>
          <p className="text-muted-foreground mt-2">{partner.name}</p>
        </div>
      </div>
      <div className="pt-4">
        <FinancialPartnerForm partner={partner} />
      </div>
    </div>
  )
}
