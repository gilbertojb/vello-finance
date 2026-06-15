// apps/console/src/app/(private)/proposals/[id]/page.tsx
import { notFound } from 'next/navigation'
import type { Metadata } from 'next'

import { getProposal, getTenantName } from '@/app/(private)/proposals/queries'
import { getPortalUrl } from '@/lib/tenant/portal-url'
import { ProposalDetailHeader } from './_components/proposal-detail-header'
import { ProposalTabs } from './_components/proposal-tabs'
import { ProposalTimeline } from './_components/proposal-timeline'
import { ProposalOrigin } from './_components/proposal-origin'

interface PageProps {
  params: Promise<{ id: string }>
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { id } = await params
  try {
    const proposal = await getProposal(id)
    return { title: `Proposta · ${proposal.client_name ?? 'Cliente'}` }
  } catch {
    return { title: 'Proposta' }
  }
}

export default async function ProposalDetailPage({ params }: PageProps) {
  const { id } = await params

  // Intentional exception: md:grid-cols-[1fr_256px] uses an arbitrary value
  // because no standard Tailwind token achieves a 1fr + 256px two-column grid.

  const [proposal, tenantName] = await Promise.all([
    getProposal(id),
    getTenantName(),
  ]).catch(() => notFound())

  const portalUrl = await getPortalUrl(proposal.tenant_id)

  return (
    <div className="mx-auto max-w-10/12 w-full p-8">
      <span className="text-xs font-medium uppercase tracking-widest text-foreground/45">
        Originação · Pipeline
      </span>
      <h1 className="mb-6 mt-1 text-4xl font-semibold leading-none tracking-tight">
        Proposta<span className="text-primary">.</span>
      </h1>

      <ProposalDetailHeader proposal={proposal} />

      <div className="grid grid-cols-1 gap-4 md:grid-cols-[1fr_256px]">
        <ProposalTabs proposal={proposal} portalUrl={portalUrl} />

        <div className="flex flex-col gap-4">
          <ProposalTimeline proposal={proposal} />
          <ProposalOrigin tenantName={tenantName} />
        </div>
      </div>
    </div>
  )
}
