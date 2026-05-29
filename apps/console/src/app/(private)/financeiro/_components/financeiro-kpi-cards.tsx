import type { FinanceiroKpis } from '../queries'

const brl = (v: number) =>
  new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(v)

const formatDate = (v: string | null) => {
  if (!v) return '—'
  const [year, month, day] = v.split('-')
  return `${day}/${month}/${year}`
}

interface Props {
  kpis: FinanceiroKpis
}

export function FinanceiroKpiCards({ kpis }: Props) {
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
      <div className="rounded-xl border bg-card p-5">
        <p className="text-xs font-medium uppercase tracking-widest text-foreground/45">
          A receber
        </p>
        <p className="mt-2 text-2xl font-semibold text-warning">{brl(kpis.toReceive)}</p>
      </div>

      <div className="rounded-xl border bg-card p-5">
        <p className="text-xs font-medium uppercase tracking-widest text-foreground/45">
          Recebido
        </p>
        <p className="mt-2 text-2xl font-semibold text-success">{brl(kpis.received)}</p>
      </div>

      <div className="rounded-xl border bg-card p-5">
        <p className="text-xs font-medium uppercase tracking-widest text-foreground/45">
          Próximo pagamento
        </p>
        <p className="mt-2 text-2xl font-semibold text-foreground">
          {formatDate(kpis.nextPayment)}
        </p>
      </div>
    </div>
  )
}
