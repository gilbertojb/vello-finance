

type Props = {
  bankPct: number
  velloPct: number
  tenantPct?: number
  velloSpreadPct?: number
}

export function CommissionCascade({ bankPct, velloPct, tenantPct, velloSpreadPct }: Props) {
  const tenantAvailable = bankPct - velloPct

  return (
    <div className="flex flex-col space-y-2 border border-border rounded-md p-4 bg-muted/50 font-mono text-sm">
      <div className="flex justify-between text-muted-foreground">
        <span>Comissão do Banco (paga à Vello)</span>
        <span>{(bankPct || 0).toFixed(2)}%</span>
      </div>
      <div className="flex justify-between text-red-500">
        <span>Retenção Vello</span>
        <span>- {(velloPct || 0).toFixed(2)}%</span>
      </div>
      <div className="my-2 border-t border-border" />
      <div className="flex justify-between font-medium">
        <span>Disponível ao Tenant</span>
        <span>{tenantAvailable.toFixed(2)}%</span>
      </div>
      {tenantPct !== undefined && (
        <>
          <div className="flex justify-between text-green-600">
            <span>Comissão do Tenant</span>
            <span>{tenantPct.toFixed(2)}%</span>
          </div>
          {velloSpreadPct !== undefined && (
            <div className="flex justify-between text-blue-600">
              <span>Vello Spread (Extra)</span>
              <span>{velloSpreadPct.toFixed(2)}%</span>
            </div>
          )}
        </>
      )}
    </div>
  )
}
