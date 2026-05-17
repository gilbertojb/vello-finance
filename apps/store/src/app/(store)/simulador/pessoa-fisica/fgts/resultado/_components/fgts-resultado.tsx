'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Info, AlertTriangle, RefreshCw, Download } from 'lucide-react'
import { formatCurrency, formatRate } from '@/lib/utils/simulator'
import { saveSimulation, qualifySimulation } from '@/app/(store)/simulador/actions'

type Props = {
  productId: string
  productName: string
  rateMonthly: number
}

type SimData = {
  nome: string
  whatsapp: string
  saldoFgts: number
}

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
          if (result.success) {
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
    return (
      <div className="py-12 text-center text-sm text-surface-foreground/50">
        Carregando dados da simulação...
      </div>
    )
  }

  const estimativa = data.saldoFgts * 0.75

  return (
    <div className="space-y-5">
      <div className="mb-4">
        <p className="text-sm font-medium text-surface-foreground">Olá, {data.nome}!</p>
      </div>

      {/* Dados do saldo */}
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="mb-1.5 block text-xs font-medium text-surface-foreground/55">
            Saldo informado
          </label>
          <div className="rounded-2xl border border-surface-foreground/12 bg-surface px-4 py-3 text-sm font-semibold text-surface-foreground">
            {formatCurrency(data.saldoFgts)}
          </div>
        </div>
        <div>
          <label className="mb-1.5 block text-xs font-medium text-surface-foreground/55">
            Prazo máximo
          </label>
          <div className="rounded-2xl border border-surface-foreground/12 bg-surface px-4 py-3 text-sm font-semibold text-surface-foreground">
            120 meses
          </div>
        </div>
      </div>

      {/* Card de resultado */}
      <div className="rounded-2xl bg-surface-foreground p-6 text-primary-foreground max-sm:p-5">
        <div className="mb-4 flex items-center justify-between">
          <div>
            <h3 className="text-sm font-medium text-primary-foreground/70">Valor estimado de antecipação</h3>
            <p className="text-xs text-primary-foreground/40">75% do saldo informado</p>
          </div>
          <p className="text-2xl font-bold leading-none tracking-tight text-primary-foreground">
            <span className="text-sm font-medium text-primary-foreground/50">R$</span>{' '}
            {estimativa.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </p>
        </div>

        <div className="mt-5 border-t border-primary-foreground/10 pt-4">
          <div className="grid grid-cols-3 gap-2 text-xs">
            <div>
              <p className="mb-0.5 text-primary-foreground/40">Saldo FGTS</p>
              <p className="font-medium text-primary-foreground/90">{formatCurrency(data.saldoFgts)}</p>
            </div>
            <div>
              <p className="mb-0.5 text-primary-foreground/40">Taxa ref.</p>
              <p className="font-medium text-primary-foreground/90">{formatRate(rateMonthly)}% a.m.</p>
            </div>
            <div>
              <p className="mb-0.5 text-primary-foreground/40">Prazo máx.</p>
              <p className="font-medium text-primary-foreground/90">10 anos</p>
            </div>
          </div>
        </div>
      </div>

      {/* Aviso estimativa */}
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

      <button
        type="button"
        disabled={!simulationId || isQualifying}
        onClick={async () => {
          if (!simulationId) return
          setIsQualifying(true)
          const result = await qualifySimulation(simulationId)
          if (result && !result.success) {
            setIsQualifying(false)
            return
          }
        }}
        className="w-full rounded-2xl bg-background px-5 py-4 text-sm font-semibold text-primary transition-opacity hover:opacity-90 disabled:opacity-40"
      >
        {isQualifying ? 'Aguarde...' : simulationId ? 'Quero contratar este crédito →' : 'Carregando...'}
      </button>

      <div className="flex items-center justify-center gap-6 pt-2">
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
          onClick={() => {
            if (!simulationId) return
            window.open(`/api/simulations/${simulationId}/pdf`, '_blank')
          }}
          className="inline-flex items-center gap-2 text-xs font-medium text-surface-foreground/40 transition-colors hover:text-surface-foreground disabled:cursor-not-allowed disabled:opacity-30"
        >
          <Download className="h-3.5 w-3.5" /> Baixar PDF
        </button>
      </div>
    </div>
  )
}
