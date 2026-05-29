import { createClient } from '@/lib/supabase/server'

export interface CommissionRow {
  id: string
  clientName: string
  product: string
  financedAmount: number
  commissionPct: number
  commissionAmount: number
  status: 'to_receive' | 'paid'
  capturedAt: string
}

export interface FinanceiroFilters {
  status?: 'to_receive' | 'paid'
  from?: string
  to?: string
}

export async function getFinanceiroKpis(): Promise<{
  toReceive: number
  received: number
  nextPayment: string | null
}> {
  const supabase = await createClient()

  const { data } = await supabase
    .from('commission_snapshots')
    .select('tenant_commission_amount, paid_at')

  const snapshots = data ?? []

  const toReceive = snapshots
    .filter((s) => s.paid_at === null && s.tenant_commission_amount !== null)
    .reduce((sum, s) => sum + Number(s.tenant_commission_amount), 0)

  const received = snapshots
    .filter((s) => s.paid_at !== null && s.tenant_commission_amount !== null)
    .reduce((sum, s) => sum + Number(s.tenant_commission_amount), 0)

  return { toReceive, received, nextPayment: null }
}

export async function listComissoes(filters: FinanceiroFilters = {}): Promise<CommissionRow[]> {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('commission_snapshots')
    .select(`
      id,
      tenant_commission_amount,
      tenant_commission_pct,
      paid_at,
      captured_at,
      proposals (
        client_name,
        simulations ( desired_amount ),
        products ( name )
      )
    `)
    .order('captured_at', { ascending: false })

  if (error) throw error

  const rows: CommissionRow[] = (data ?? []).map((snap) => {
    const proposal = Array.isArray(snap.proposals) ? snap.proposals[0] : snap.proposals
    const sim = proposal
      ? Array.isArray(proposal.simulations)
        ? proposal.simulations[0]
        : proposal.simulations
      : null
    const product = proposal
      ? Array.isArray(proposal.products)
        ? proposal.products[0]
        : proposal.products
      : null

    return {
      id: snap.id,
      clientName: proposal?.client_name ?? '—',
      product: (product as { name: string } | null)?.name ?? '—',
      financedAmount: sim ? Number((sim as { desired_amount: number }).desired_amount) : 0,
      commissionPct: Number(snap.tenant_commission_pct ?? 0),
      commissionAmount: Number(snap.tenant_commission_amount ?? 0),
      status: snap.paid_at ? 'paid' : 'to_receive',
      capturedAt: snap.captured_at,
    }
  })

  let filtered = rows

  if (filters.status) {
    filtered = filtered.filter((r) => r.status === filters.status)
  }
  if (filters.from) {
    filtered = filtered.filter((r) => r.capturedAt >= filters.from!)
  }
  if (filters.to) {
    filtered = filtered.filter((r) => r.capturedAt <= filters.to! + 'T23:59:59Z')
  }

  return filtered
}

export type FinanceiroKpis = Awaited<ReturnType<typeof getFinanceiroKpis>>
