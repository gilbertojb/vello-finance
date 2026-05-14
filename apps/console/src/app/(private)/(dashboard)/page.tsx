import type { Metadata } from 'next'

import { ConversionFunnel } from './_components/conversion-funnel'
import { KpiCards } from './_components/kpi-cards'
import { RecentProposals, RecentSimulations } from './_components/recent-activity'
import { getDashboardStats, getRecentProposals, getRecentSimulations } from './queries'

export const metadata: Metadata = { title: 'Dashboard' }

export default async function DashboardPage() {
  const [stats, recentSimulations, recentProposals] = await Promise.all([
    getDashboardStats(),
    getRecentSimulations(),
    getRecentProposals(),
  ])

  return (
    <div className="flex flex-col gap-6 px-4 lg:px-6">
      <div>
        <h1 className="text-2xl font-semibold">Dashboard</h1>
        <p className="text-muted-foreground mt-1 text-sm">
          Visão geral do seu negócio em tempo real.
        </p>
      </div>

      <KpiCards stats={stats} />

      <ConversionFunnel stats={stats} />

      <div className="grid gap-4 lg:grid-cols-2">
        <RecentSimulations simulations={recentSimulations} />
        <RecentProposals proposals={recentProposals} />
      </div>
    </div>
  )
}
