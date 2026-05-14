import type { Metadata } from 'next'

import { SimulationsList } from './_components/simulations-list'
import { listSimulations } from './queries'

export const metadata: Metadata = { title: 'Simulações' }

export default async function SimulationsPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string }>
}) {
  const { status } = await searchParams
  const simulations = await listSimulations()

  return (
    <div className="flex flex-col gap-6 px-4 lg:px-6">
      <div>
        <h1 className="text-2xl font-semibold">Simulações</h1>
        <p className="text-muted-foreground mt-1 text-sm">
          Leads gerados pelo simulador da sua loja.
        </p>
      </div>

      <SimulationsList simulations={simulations} activeStatus={status} />
    </div>
  )
}
