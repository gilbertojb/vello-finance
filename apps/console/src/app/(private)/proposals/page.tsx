import type { Metadata } from 'next'

import { ProposalsList } from './_components/proposals-list'
import { listProposals } from './queries'

export const metadata: Metadata = { title: 'Propostas' }

export default async function ProposalsPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string }>
}) {
  const { status } = await searchParams
  const proposals = await listProposals()

  return (
    <div className="flex flex-col gap-6 px-4 lg:px-6">
      <div>
        <h1 className="text-2xl font-semibold">Propostas</h1>
        <p className="text-muted-foreground mt-1 text-sm">
          Pipeline de propostas enviadas pelos clientes da sua loja.
        </p>
      </div>

      <ProposalsList proposals={proposals} activeStatus={status} />
    </div>
  )
}
