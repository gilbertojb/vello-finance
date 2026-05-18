'use client'

import { useState, useMemo, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Info, RefreshCw, Download } from 'lucide-react'
import { formatCurrency, calcPMT, calcCETAnual } from '@/lib/utils/simulator'
import { saveSimulation, qualifySimulation } from '@/app/(store)/simulador/actions'

const PARCELAS_OPTIONS = [6, 12, 18, 24]

type Props = {
  productId: string
  productName: string
  rateMonthly: number
}

type SimData = {
  nome: string
  whatsapp: string
  valorRecebiveis: number
  tipoRecebivel: string
  valorCredito: number
  parcelas: number
}

export function AntecipacaoReceiveisResultado({ productId, productName, rateMonthly }: Props) {
  const router = useRouter()
  const [data, setData] = useState<SimData | null>(null)
  const [parcelas, setParcelas] = useState(6)
  const [simulationId, setSimulationId] = useState<string | null>(null)
  const [isQualifying, setIsQualifying] = useState(false)

  useEffect(() => {
    const stored = sessionStorage.getItem('sim:antecipacao-recebiveis')
    if (!stored) {
      router.replace(`/simulador/pessoa-juridica/antecipacao-recebiveis?productId=${productId}`)
      return
    }
    try {
      const parsed: SimData = JSON.parse(stored)
      setData(parsed)
      setParcelas(parsed.parcelas)

      const SIM_ID_KEY = 'sim:antecipacao-recebiveis:id'
      const existingId = sessionStorage.getItem(SIM_ID_KEY)
      if (existingId) {
        setSimulationId(existingId)
      } else {
        const payment = calcPMT(parsed.valorCredito, rateMonthly, parsed.parcelas)
        saveSimulation({
          tenantProductId: productId,
          clientName: parsed.nome,
          clientPhone: parsed.whatsapp,
          desiredAmount: parsed.valorCredito,
          desiredTermMonths: parsed.parcelas,
          estimatedRate: rateMonthly,
          estimatedPayment: payment,
          simulationData: parsed as Record<string, unknown>,
        }).then((result) => {
          if (result.success) {
            setSimulationId(result.data.id)
            sessionStorage.setItem(SIM_ID_KEY, result.data.id)
          }
        })
      }
    } catch {
      router.replace(`/simulador/pessoa-juridica/antecipacao-recebiveis?productId=${productId}`)
    }
  }, [router, productId, rateMonthly])

  const installment = useMemo(() => {
    if (!data) return 0
    return calcPMT(data.valorCredito, rateMonthly, parcelas)
  }, [data, rateMonthly, parcelas])

  const cetAnual = useMemo(() => calcCETAnual(rateMonthly), [rateMonthly])

  if (!data) {
    return (
      <div className="py-12 text-center text-sm text-surface-foreground/50">
        Carregando dados da simulação...
      </div>
    )
  }

  return (
    <div className="space-y-5">
      <div className="mb-4">
        <p className="text-sm font-medium text-surface-foreground">Olá, {data.nome}!</p>
      </div>

      {/* Seletor de parcelas */}
      <div>
        <label className="mb-1.5 block text-sm font-semibold text-surface-foreground">
          Em quanto tempo quer pagar?
        </label>
        <div className="flex gap-2">
          {PARCELAS_OPTIONS.map((p) => (
            <button
              key={p}
              type="button"
              onClick={() => setParcelas(p)}
              className={`flex-1 rounded-2xl border py-3 text-sm font-medium transition-colors ${
                parcelas === p
                  ? 'border-primary bg-primary/5 text-primary'
                  : 'border-surface-foreground/12 bg-surface-foreground/5 text-surface-foreground/60 hover:bg-surface-foreground/10'
              }`}
            >
              {p}x
            </button>
          ))}
        </div>
      </div>

      {/* Card escuro de resultado */}
      <div className="rounded-2xl bg-surface-foreground p-6 text-surface max-sm:p-5">
        <div className="mb-4 flex items-center justify-between">
          <div>
            <h3 className="text-sm font-medium text-surface/70">Parcela mensal</h3>
            <p className="text-xs text-surface/40">Sistema PRICE (Fixas)</p>
          </div>
          <p className="text-2xl font-bold leading-none tracking-tight text-surface">
            <span className="text-sm font-medium text-surface/50">R$</span>{' '}
            {installment.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </p>
        </div>

        <div className="mt-5 border-t border-surface/15 pt-4">
          <div className="grid grid-cols-4 gap-2 text-xs">
            {[
              { label: 'Crédito', value: formatCurrency(data.valorCredito) },
              { label: 'Prazo', value: `${parcelas}x` },
              { label: 'Taxa ref.', value: `${rateMonthly.toFixed(2).replace('.', ',')}% a.m.` },
              { label: 'CET anual', value: `${cetAnual.toFixed(1).replace('.', ',')}%` },
            ].map((item) => (
              <div key={item.label}>
                <p className="mb-0.5 text-surface/40">{item.label}</p>
                <p className="font-medium text-surface/90">{item.value}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Informações dos recebíveis */}
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="mb-1.5 block text-xs font-medium text-surface-foreground/55">
            Tipo de recebível
          </label>
          <div className="rounded-2xl border border-surface-foreground/12 bg-surface px-4 py-3 text-sm font-semibold text-surface-foreground">
            {data.tipoRecebivel}
          </div>
        </div>
        <div>
          <label className="mb-1.5 block text-xs font-medium text-surface-foreground/55">
            Total de recebíveis
          </label>
          <div className="rounded-2xl border border-surface-foreground/12 bg-surface px-4 py-3 text-sm font-semibold text-surface-foreground">
            {formatCurrency(data.valorRecebiveis)}
          </div>
        </div>
      </div>

      {/* Aviso informativo */}
      <div className="flex items-start gap-2.5 rounded-xl border border-primary/20 bg-primary/5 px-4 py-3">
        <Info className="mt-0.5 h-4 w-4 flex-shrink-0 text-primary" />
        <p className="text-xs leading-relaxed text-primary/80">
          Condições sujeitas à análise dos documentos de recebíveis.{' '}
          Simulação baseada na taxa mínima de{' '}
          <strong className="font-semibold text-primary">
            {rateMonthly.toFixed(2).replace('.', ',')}% a.m.
          </strong>{' '}
          para {productName}.
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
        className="w-full rounded-2xl bg-surface-foreground px-5 py-4 text-sm font-semibold text-surface transition-opacity hover:opacity-90 disabled:opacity-40"
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
