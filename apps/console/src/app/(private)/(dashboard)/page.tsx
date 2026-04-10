import type { Metadata } from 'next'

export const metadata: Metadata = { title: 'Dashboard' }

export default function DashboardPage() {
  return (
    <div className="px-4 lg:px-6">
      <h1 className="text-2xl font-semibold">Dashboard</h1>
      <p className="text-muted-foreground mt-1 text-sm">
        Em breve: métricas e resumos do seu negócio.
      </p>
    </div>
  )
}
