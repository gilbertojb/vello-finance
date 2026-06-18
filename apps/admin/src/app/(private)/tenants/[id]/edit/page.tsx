import { env } from '@vello/env/admin'

import { notFound } from 'next/navigation'

import { ResendWelcomeButton } from '../../_components/resend-welcome-button'
import { TenantForm } from '../../_components/tenant-form'
import { TenantStatusBadge } from '../../_components/tenant-status-badge'

import { getTenant } from '../../queries'

type Props = {
  params: Promise<{ id: string }>
}

export async function generateMetadata({ params }: Props) {
  const { id } = await params
  const tenant = await getTenant(id).catch(() => null)
  return { title: tenant ? `Editar ${tenant.name}` : 'Editar Parceiro' }
}

export default async function EditTenantPage({ params }: Props) {
  const { id } = await params
  const tenant = await getTenant(id).catch(() => null)

  if (!tenant) notFound()

  return (
    <div className="flex-1 space-y-4 p-8 pt-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-3xl font-bold tracking-tight">
                {tenant.name}
              </h2>
              <TenantStatusBadge status={tenant.status} />
            </div>
            <p className="text-muted-foreground text-sm mt-0.5">
              {tenant.console_custom_domain || `${tenant.slug}.${env.CONSOLE_BASE_DOMAIN}`}
            </p>
          </div>
        </div>
        <ResendWelcomeButton
          tenantId={tenant.id}
          welcomeEmailSentAt={tenant.welcome_email_sent_at}
        />
      </div>

      <div className="pt-2">
        <TenantForm tenant={tenant} />
      </div>
    </div>
  )
}
