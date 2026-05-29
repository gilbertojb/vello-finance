import { createClient } from '@/lib/supabase/server'

export interface CommissionRow {
  id: string
  clientName: string
  product: string
  valorFinanciado: number
  comissaoPct: number
  comissaoValor: number
  status: 'a_receber' | 'pago'
  createdAt: string
}

export interface FinanceiroFilters {
  status?: 'a_receber' | 'pago'
  de?: string
  ate?: string
}

export async function getFinanceiroKpis(): Promise<{
  aReceber: number
  recebido: number
  proximoPagamento: string | null
}> {
  const supabase = await createClient()

  const { data } = await supabase
    .from('commission_snapshots')
    .select('tenant_commission_amount, paid_at, expected_payment_date')

  const snapshots = data ?? []

  const aReceber = snapshots
    .filter((s) => s.paid_at === null && s.tenant_commission_amount !== null)
    .reduce((sum, s) => sum + Number(s.tenant_commission_amount), 0)

  const recebido = snapshots
    .filter((s) => s.paid_at !== null && s.tenant_commission_amount !== null)
    .reduce((sum, s) => sum + Number(s.tenant_commission_amount), 0)

  const pendingDates = snapshots
    .filter((s) => s.paid_at === null && s.expected_payment_date !== null)
    .map((s) => s.expected_payment_date as string)
    .sort()

  const proximoPagamento = pendingDates[0] ?? null

  return { aReceber, recebido, proximoPagamento }
}

export async function listComissoes(filters: FinanceiroFilters = {}): Promise<CommissionRow[]> {
  const supabase = await createClient()

  const query = supabase
    .from('commission_snapshots')
    .select(`
      id,
      tenant_commission_amount,
      tenant_commission_pct,
      paid_at,
      created_at,
      proposals (
        client_name,
        simulations ( desired_amount ),
        products ( name )
      )
    `)
    .order('created_at', { ascending: false })

  const { data, error } = await query

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
      product: product?.name ?? '—',
      valorFinanciado: sim ? Number(sim.desired_amount) : 0,
      comissaoPct: Number(snap.tenant_commission_pct ?? 0),
      comissaoValor: Number(snap.tenant_commission_amount ?? 0),
      status: snap.paid_at ? 'pago' : 'a_receber',
      createdAt: snap.created_at,
    }
  })

  let filtered = rows

  if (filters.status) {
    filtered = filtered.filter((r) => r.status === filters.status)
  }
  if (filters.de) {
    filtered = filtered.filter((r) => r.createdAt >= filters.de!)
  }
  if (filters.ate) {
    filtered = filtered.filter((r) => r.createdAt <= filters.ate! + 'T23:59:59Z')
  }

  return filtered
}

export type FinanceiroKpis = Awaited<ReturnType<typeof getFinanceiroKpis>>
