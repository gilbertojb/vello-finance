import type { LeadOriginKpis } from '../queries'

interface Props {
  kpis: LeadOriginKpis
}

export function OrigemLeadsKpiCards({ kpis }: Props) {
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
      <div className="rounded-xl border bg-card p-5">
        <p className="text-xs font-medium uppercase tracking-widest text-foreground/45">
          Total de leads
        </p>
        <p className="mt-2 text-2xl font-semibold text-foreground">{kpis.totalLeads}</p>
      </div>

      <div className="rounded-xl border bg-card p-5">
        <p className="text-xs font-medium uppercase tracking-widest text-foreground/45">
          Pela loja própria
        </p>
        <p className="mt-2 text-2xl font-semibold text-primary">{kpis.lojaPropriaLeads}</p>
      </div>

      <div className="rounded-xl border bg-card p-5">
        <p className="text-xs font-medium uppercase tracking-widest text-foreground/45">
          Por vendedores
        </p>
        <p className="mt-2 text-2xl font-semibold text-primary">{kpis.vendedoresLeads}</p>
      </div>
    </div>
  )
}
