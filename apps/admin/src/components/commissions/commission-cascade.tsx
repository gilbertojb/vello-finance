type Props = {
  bankPct: number
  velloPct: number
  tenantPct?: number
  velloSpreadPct?: number
  baseValue?: number
}

export function CommissionCascade({
  bankPct,
  velloPct,
  tenantPct,
  velloSpreadPct,
  baseValue = 500_000,
}: Props) {
  const tenantAvailable = bankPct - velloPct

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
      <div className="bg-primary px-6 py-6 text-white w-full">
        <div className="text-[10px] font-bold tracking-widest text-white/80 uppercase mb-1.5">
          Simulação de Repasse
        </div>
        <div className="text-[32px] leading-tight font-extrabold mb-1.5">
          {formatCurrency(bankPct)}
        </div>
        <div className="text-xs text-white/70">
          Estimativa baseada em ticket médio de {formatCompact(baseValue)}
        </div>
      </div>

      {/* Body */}
      <div className="px-6 py-6 flex flex-col space-y-5">
        <div className="flex justify-between items-center">
          <span className="text-[15px] text-muted-foreground">
            Comissão Vello ({(velloPct || 0).toFixed(1)}%)
          </span>
          <span className="text-[15px] font-bold text-foreground">
            {formatCurrency(velloPct || 0)}
          </span>
        </div>

        <div className="flex justify-between items-center">
          <span className="text-[15px] text-muted-foreground">
            Comissão Parceiro ({tenantAvailable.toFixed(1)}%)
          </span>
          <span className="text-[15px] font-bold text-foreground">
            {formatCurrency(tenantAvailable)}
          </span>
        </div>

        {tenantPct !== undefined && (
          <div className="flex justify-between items-center">
            <span className="text-[15px] text-muted-foreground">
              Comissão do Parceiro ({tenantPct.toFixed(1)}%)
            </span>
            <span className="text-[15px] font-bold text-foreground">
              {formatCurrency(tenantPct)}
            </span>
          </div>
        )}

        {velloSpreadPct !== undefined && (
          <div className="flex justify-between items-center">
            <span className="text-[15px] text-muted-foreground">
              Vello Spread Extra ({velloSpreadPct.toFixed(1)}%)
            </span>
            <span className="text-[15px] font-bold text-foreground">
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
            <span className="text-xs font-bold text-[#10b981]">Alta (68%)</span>
          </div>
          <div className="flex gap-1 h-1.5">
            <div className="bg-[#10b981] h-full rounded-full w-[68%]" />
            <div className="bg-muted h-full rounded-full flex-1" />
          </div>
        </div>
      </div>
    </div>
  )
}
