import { headers } from 'next/headers'
import { notFound } from 'next/navigation'
import { getProposal } from '@/app/(store)/queries'
import { Etapa2Container } from './_components/etapa2-container'

type Props = {
  params: Promise<{ proposalId: string }>
  searchParams: Promise<Record<string, string | undefined>>
}

export default async function DocumentosPage({ params, searchParams }: Props) {
  const { proposalId } = await params
  const { step } = await searchParams
  const tenantId = (await headers()).get('x-tenant-id')
  if (!tenantId) notFound()

  const proposal = await getProposal(proposalId, tenantId)
  if (!proposal) notFound()

  return <Etapa2Container proposal={proposal} step={step ?? 'dados-bancarios'} />
}
