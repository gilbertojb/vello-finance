'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Info, AlertTriangle, RefreshCw, Download } from 'lucide-react'
import { formatCurrency, formatRate } from '@/lib/utils/simulator'
import { saveSimulation, qualifySimulation } from '@/app/(store)/simulador/actions'
import { StoreButton } from '@/components/ui/store-button'

type Props = { productId: string; productName: string; rateMonthly: number }
type SimData = { nome: string; whatsapp: string; saldoFgts: number }

export function FgtsResultado({ productId, productName, rateMonthly }: Props) {
  const router = useRouter()
  const [data, setData] = useState<SimData | null>(null)
  const [simulationId, setSimulationId] = useState<string | null>(null)
  const [isQualifying, setIsQualifying] = useState(false)

  useEffect(() => {
    const stored = sessionStorage.getItem('sim:fgts')
    if (!stored) {
      router.replace(`/simulador/pessoa-fisica/fgts?productId=${productId}`)
      return
    }
    try {
      const parsed: SimData = JSON.parse(stored)
      setData(parsed)
      const SIM_ID_KEY = 'sim:fgts:id'
      const existingId = sessionStorage.getItem(SIM_ID_KEY)
      if (existingId) {
        setSimulationId(existingId)
      } else {
        saveSimulation({
          tenantProductId: productId,
          clientName: parsed.nome,
          clientPhone: parsed.whatsapp,
          desiredAmount: parsed.saldoFgts * 0.75,
          desiredTermMonths: 120,
          estimatedRate: rateMonthly,
          estimatedPayment: 0,
          simulationData: parsed as Record<string, unknown>,
        }).then((result) => {
          if (result.success && result.data) {
            setSimulationId(result.data.id)
            sessionStorage.setItem(SIM_ID_KEY, result.data.id)
          }
        })
      }
    } catch {
      router.replace(`/simulador/pessoa-fisica/fgts?productId=${productId}`)
    }
  }, [router, productId, rateMonthly])

  if (!data) {
    return <div className="py-12 text-center text-sm text-surface-foreground/50">Carregando...</div>
  }

  const estimativa = data.saldoFgts * 0.75

  return (
    <div className="space-y-4">
      <div>
        <p className="text-sm text-surface-foreground/55">Valor estimado de antecipação</p>
        <p className="mt-1 text-3xl font-extrabold tracking-tight text-surface-foreground">
          {formatCurrency(estimativa)}
        </p>
        <p className="mt-0.5 text-xs text-surface-foreground/45">75% do saldo informado</p>
      </div>

      <div className="flex items-center justify-between rounded-lg bg-primary/12 px-4 py-2.5">
        <span className="text-sm font-semibold text-surface-foreground">Parcelas mensais</span>
        <span className="text-sm font-semibold text-surface-foreground">12× sem custo</span>
      </div>

      <div className="h-px bg-surface-foreground/8" />

      <div className="space-y-2.5">
        <div className="flex justify-between text-sm">
          <span className="text-surface-foreground/55">Saldo FGTS</span>
          <span className="font-semibold text-surface-foreground">{formatCurrency(data.saldoFgts)}</span>
        </div>
        <div className="flex justify-between text-sm">
          <span className="text-surface-foreground/55">Taxa referencial</span>
          <span className="font-semibold text-surface-foreground">{formatRate(rateMonthly)}% a.m.</span>
        </div>
        <div className="flex justify-between text-sm">
          <span className="text-surface-foreground/55">Prazo máximo</span>
          <span className="font-semibold text-surface-foreground">120 meses</span>
        </div>
        <div className="flex justify-between text-sm">
          <span className="text-surface-foreground/55">Sistema</span>
          <span className="font-semibold text-surface-foreground">PRICE</span>
        </div>
      </div>

      <div className="flex items-start gap-2.5 rounded-xl border border-primary/30 bg-primary/5 px-4 py-3">
        <AlertTriangle className="mt-0.5 h-4 w-4 flex-shrink-0 text-primary/70" />
        <p className="text-xs leading-relaxed text-surface-foreground/80">
          Valor estimado sujeito a análise e saldo verificado na CEF. Consulte o extrato atualizado no
          aplicativo FGTS ou nas agências da Caixa Econômica Federal.
        </p>
      </div>

      <div className="flex items-start gap-2.5 rounded-xl border border-primary/20 bg-primary/5 px-4 py-3">
        <Info className="mt-0.5 h-4 w-4 flex-shrink-0 text-primary" />
        <p className="text-xs leading-relaxed text-primary/80">
          A antecipação do FGTS ({productName}) não tem cobrança de parcelas mensais. O saldo futuro do
          FGTS é utilizado automaticamente para amortizar o valor antecipado.
        </p>
      </div>

      <StoreButton
        className="w-full bg-primary text-surface-foreground hover:bg-primary/90"
        disabled={!simulationId || isQualifying}
        onClick={async () => {
          if (!simulationId) return
          setIsQualifying(true)
          const result = await qualifySimulation(simulationId)
          if (result && !result.success) setIsQualifying(false)
        }}
      >
        {isQualifying ? 'Aguarde...' : simulationId ? 'Quero contratar este crédito →' : 'Carregando...'}
      </StoreButton>

      <div className="flex items-center justify-center gap-6 pt-1">
        <button
          type="button"
          onClick={() => router.back()}
          className="inline-flex items-center gap-2 text-xs font-medium text-surface-foreground/40 transition-colors hover:text-surface-foreground"
        >
          <RefreshCw className="h-3.5 w-3.5" /> Refazer
        </button>
        <button
          type="button"
          disabled={!simulationId}
          onClick={() => { if (simulationId) window.open(`/api/simulations/${simulationId}/pdf`, '_blank') }}
          className="inline-flex items-center gap-2 text-xs font-medium text-surface-foreground/40 transition-colors hover:text-surface-foreground disabled:cursor-not-allowed disabled:opacity-30"
        >
          <Download className="h-3.5 w-3.5" /> Baixar PDF
        </button>
      </div>
    </div>
  )
}
