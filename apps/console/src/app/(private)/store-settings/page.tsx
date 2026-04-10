import type { Metadata } from 'next'
import { StoreSettingsForm } from './_components/store-settings-form'
import { getTenantBrandingSettings } from './queries'

export const metadata: Metadata = { title: 'Configuração da Loja' }

export default async function StoreSettingsPage() {
  const branding = await getTenantBrandingSettings()

  return (
    <div className="flex flex-col gap-6 px-4 lg:px-6">
      <div>
        <h1 className="text-2xl font-semibold">Configuração da Loja</h1>
        <p className="text-muted-foreground mt-1 text-sm">
          Personalize a aparência do seu espaço.
        </p>
      </div>

      <StoreSettingsForm defaultValues={branding} />
    </div>
  )
}
