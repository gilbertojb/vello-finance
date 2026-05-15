import type { Metadata } from 'next'
import { StoreSettingsForm } from './_components/store-settings-form'
import { getTenantBrandingSettings } from './queries'

export const metadata: Metadata = { title: 'Configuração da Loja' }

export default async function StoreSettingsPage() {
  const branding = await getTenantBrandingSettings()

  return (
    <div className="mx-auto max-w-10/12 w-full p-8">
      {/* Page header */}
      <div className="mb-7">
        <span className="text-xs font-medium uppercase tracking-widest text-foreground/45">
          Loja · Configurações
        </span>
        <h1 className="mb-2 mt-1 text-4xl font-semibold leading-none tracking-tight text-foreground">
          Configurações<span className="text-primary">.</span>
        </h1>
        <p className="m-0 max-w-xl text-sm leading-normal text-foreground/55">
          Personalize a aparência e a identidade visual do seu espaço.
        </p>
      </div>

      <StoreSettingsForm defaultValues={branding} />
    </div>
  )
}
