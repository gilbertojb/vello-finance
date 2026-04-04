import { FinancialPartnerForm } from '../_components/financial-partner-form'
import { getCurrentUserRole } from '../queries'

export const metadata = {
  title: 'Cadastrar Instituição Financeira',
}

export default async function NewFinancialPartnerPage() {
  const role = await getCurrentUserRole()
  const isSuperAdmin = role === 'super_admin'

  return (
    <div className="flex-1 space-y-4 p-8 pt-6">
      <div className="flex items-center justify-between space-y-2">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">
            Cadastrar Instituição Financeira
          </h2>
          <p className="text-muted-foreground mt-2">
            Adicione uma nova instituição financeira parceira da Vello.
          </p>
        </div>
      </div>
      <div className="pt-4">
        <FinancialPartnerForm isSuperAdmin={isSuperAdmin} />
      </div>
    </div>
  )
}
