import { CircleDollarSign, Wallet } from 'lucide-react'
import type { DashboardCommissionKpis } from '../queries'

function brl(v: number): string {
  if (v >= 1_000_000) return `R$ ${(v / 1_000_000).toFixed(1)}M`
  if (v >= 1_000) return `R$ ${(v / 1_000).toFixed(1)}k`
  return v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
}

interface Props {
  kpis: DashboardCommissionKpis
}

export function CommissionKpiCards({ kpis }: Props) {
  return (
    <div className="grid grid-cols-2 gap-3">
      <div className="rounded-2xl border border-primary/10 bg-card p-5">
        <div className="mb-3.5 flex items-center justify-between">
          <span className="text-xs font-medium uppercase tracking-widest text-foreground/55">Comissões a receber</span>
          <span className="grid size-8 place-items-center rounded-lg bg-warning/10 text-warning">
            <Wallet size={15} />
          </span>
        </div>
        <div className="text-3xl font-semibold leading-none tracking-tight text-warning">
          {brl(kpis.aReceber)}
        </div>
        <p className="mt-2 text-xs text-foreground/38">Propostas aprovadas, pagamento pendente</p>
      </div>

      <div className="rounded-2xl border border-primary/10 bg-card p-5">
        <div className="mb-3.5 flex items-center justify-between">
          <span className="text-xs font-medium uppercase tracking-widest text-foreground/55">Comissões recebidas</span>
          <span className="grid size-8 place-items-center rounded-lg bg-success/10 text-success">
            <CircleDollarSign size={15} />
          </span>
        </div>
        <div className="text-3xl font-semibold leading-none tracking-tight text-success">
          {brl(kpis.recebidas)}
        </div>
        <p className="mt-2 text-xs text-foreground/38">Confirmado pelo painel admin</p>
      </div>
    </div>
  )
}
