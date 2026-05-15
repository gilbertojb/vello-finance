import type { Metadata } from 'next'
import { Download, Plus } from 'lucide-react'

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
    <div className="mx-auto max-w-10/12 w-full p-8">
      {/* Page header */}
      <div className="mb-7 flex flex-wrap items-end justify-between gap-6">
        <div>
          <span className="text-xs font-medium uppercase tracking-widest text-foreground/45">
            Originação · Pipeline
          </span>
          <h1 className="mb-2 mt-1 text-4xl font-semibold leading-none tracking-tight text-foreground">
            Propostas<span className="text-primary">.</span>
          </h1>
          <p className="m-0 max-w-xl text-sm leading-normal text-foreground/55">
            Acompanhe contratos em andamento. Filtre por produto ou status e visualize todas as
            operações em formato de cartões.
          </p>
        </div>
        <div className="flex items-center gap-2.5">
          <button
            type="button"
            className="inline-flex cursor-pointer items-center gap-2 rounded-lg border border-primary/16 bg-foreground/4 px-4 py-2.5 text-sm font-medium text-foreground"
          >
            <Download size={14} /> Exportar CSV
          </button>
          <button
            type="button"
            className="inline-flex cursor-pointer items-center gap-2 rounded-lg border-none bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground"
          >
            <Plus size={14} /> Nova proposta
          </button>
        </div>
      </div>

      <ProposalsList proposals={proposals} activeStatus={status} />
    </div>
  )
}
