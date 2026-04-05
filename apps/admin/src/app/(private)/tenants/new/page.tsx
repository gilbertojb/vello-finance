import { TenantForm } from '../_components/tenant-form'

export const metadata = {
  title: 'Cadastrar Parceiro',
}

export default function NewTenantPage() {
  return (
    <div className="flex-1 space-y-4 p-8 pt-6">
      <div className="flex items-center justify-between space-y-2">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Cadastrar Parceiro</h2>
          <p className="text-muted-foreground mt-2">
            Adicione um novo parceiro white-label à plataforma.
          </p>
        </div>
      </div>

      <div className="pt-4">
        <TenantForm />
      </div>
    </div>
  )
}
