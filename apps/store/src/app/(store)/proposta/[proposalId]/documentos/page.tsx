import { headers } from 'next/headers'
import { notFound } from 'next/navigation'
import { getProposal } from '@/app/(store)/queries'

type Props = {
  params: Promise<{ proposalId: string }>
  searchParams: Promise<Record<string, string | undefined>>
}

export default async function DocumentosPage({ params }: Props) {
  const { proposalId } = await params
  const tenantId = (await headers()).get('x-tenant-id')
  if (!tenantId) notFound()

  const proposal = await getProposal(proposalId, tenantId)
  if (!proposal) notFound()

  return (
    <div className="mx-auto w-full max-w-lg px-4 py-8">
      <p className="text-sm text-muted-foreground">
        Etapa 2 — {proposal.product_type_slug} — a ser implementado
      </p>
    </div>
  )
}
