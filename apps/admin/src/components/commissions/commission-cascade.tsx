type Props = {
  ifPct: number
  velloPct: number
  tenantPct?: number
  velloSpreadPct?: number
  baseValue?: number
}

export function CommissionCascade({
  ifPct,
  velloPct,
  tenantPct,
  velloSpreadPct,
  baseValue = 500_000,
}: Props) {
  const tenantAvailable = ifPct - velloPct

  const formatCurrency = (value: number) =>
    Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(
      value * (baseValue / 100),
    )

  const formatCompact = (val: number) => {
    if (val >= 1000) {
      return `R$ ${val / 1000}k`
    }
    return Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(val)
  }

  return (
    <div className="flex flex-col border border-border rounded-xl overflow-hidden shadow-sm bg-card w-full max-w-sm mx-auto md:mx-0">
      {/* Header */}
      <div className="bg-primary px-6 py-6 text-primary-foreground w-full">
        <div className="text-2xs font-bold tracking-widest text-primary-foreground/80 uppercase mb-1.5">
          Simulação de Repasse
        </div>
        <div className="text-3xl leading-tight font-extrabold mb-1.5">
          {formatCurrency(ifPct)}
        </div>
        <div className="text-xs text-primary-foreground/70">
          Estimativa baseada em ticket médio de {formatCompact(baseValue)}
        </div>
      </div>

      {/* Body */}
      <div className="px-6 py-6 flex flex-col space-y-5">
        <div className="flex justify-between items-center">
          <span className="text-sm text-muted-foreground">
            Comissão Vello ({(velloPct || 0).toFixed(3)}%)
          </span>
          <span className="text-sm font-bold text-foreground">
            {formatCurrency(velloPct || 0)}
          </span>
        </div>

        <div className="flex justify-between items-center">
          <span className="text-sm text-muted-foreground">
            Comissão Parceiro ({tenantAvailable.toFixed(3)}%)
          </span>
          <span className="text-sm font-bold text-foreground">
            {formatCurrency(tenantAvailable)}
          </span>
        </div>

        {tenantPct !== undefined && (
          <div className="flex justify-between items-center">
            <span className="text-sm text-muted-foreground">
              Comissão do Parceiro ({tenantPct.toFixed(3)}%)
            </span>
            <span className="text-sm font-bold text-foreground">
              {formatCurrency(tenantPct)}
            </span>
          </div>
        )}

        {velloSpreadPct !== undefined && (
          <div className="flex justify-between items-center">
            <span className="text-sm text-muted-foreground">
              Vello Spread Extra ({velloSpreadPct.toFixed(3)}%)
            </span>
            <span className="text-sm font-bold text-foreground">
              {formatCurrency(velloSpreadPct)}
            </span>
          </div>
        )}

        <div className="border-t border-border my-1" />

        <div>
          <div className="flex justify-between items-end mb-2.5">
            <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
              Taxa de Conversão Est.
            </span>
            <span className="text-xs font-bold text-success">Alta (68%)</span>
          </div>
          <div className="flex gap-1 h-1.5">
            <div className="bg-success h-full rounded-full" style={{ width: '68%' }} />
            <div className="bg-muted h-full rounded-full flex-1" />
          </div>
        </div>
      </div>
    </div>
  )
}
