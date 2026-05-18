'use client'

import { useState, useMemo, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Info, RefreshCw, Download } from 'lucide-react'
import { formatCurrency, calcPMT } from '@/lib/utils/simulator'
import { saveSimulation, qualifySimulation } from '@/app/(store)/simulador/actions'

const PARCELAS_OPTIONS = [60, 120, 180, 240, 300, 360]

type SimData = {
  nome: string
  whatsapp: string
  valorImovel: number
  entrada: number
  parcelas: number
}

type Props = {
  productId: string
  rateMonthly: number
}

export function PropertyResult({ productId, rateMonthly }: Props) {
  const router = useRouter()
  const [data, setData] = useState<SimData | null>(null)
  const [parcelas, setParcelas] = useState(360)
  const [simulationId, setSimulationId] = useState<string | null>(null)
  const [isQualifying, setIsQualifying] = useState(false)

  useEffect(() => {
    const stored = sessionStorage.getItem('sim:financiamento-imovel')
    if (!stored) {
      router.replace(`/simulador/financiamentos/imovel?productId=${productId}`)
      return
    }
    try {
      const parsed: SimData = JSON.parse(stored)
      setData(parsed)
      setParcelas(parsed.parcelas)

      const SIM_ID_KEY = 'sim:financiamento-imovel:id'
      const existingId = sessionStorage.getItem(SIM_ID_KEY)
      if (existingId) {
        setSimulationId(existingId)
      } else {
        const principal = parsed.valorImovel - parsed.entrada
        const payment = calcPMT(principal, rateMonthly, parsed.parcelas)
        saveSimulation({
          tenantProductId: productId,
          clientName: parsed.nome,
          clientPhone: parsed.whatsapp,
          desiredAmount: principal,
          desiredTermMonths: parsed.parcelas,
          estimatedRate: rateMonthly,
          estimatedPayment: payment,
          simulationData: parsed as Record<string, unknown>,
        }).then((result) => {
          if (result.success && result.data) {
            sessionStorage.setItem(SIM_ID_KEY, result.data.id)
            setSimulationId(result.data.id)
          }
        })
      }
    } catch {
      router.replace(`/simulador/financiamentos/imovel?productId=${productId}`)
    }
  }, [router, productId, rateMonthly])

  const principal = data ? data.valorImovel - data.entrada : 0
  const ltv = data ? Math.round((principal / data.valorImovel) * 100) : 0

  const installment = useMemo(() => {
    if (!data || principal <= 0) return 0
    return calcPMT(principal, rateMonthly, parcelas)
  }, [data, principal, rateMonthly, parcelas])

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
        <p className="text-sm font-medium text-surface-foreground">
          Olá, {data.nome}!
        </p>
      </div>

      {/* Valor do imóvel e entrada (read-only) */}
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="mb-1.5 block text-xs font-medium text-surface-foreground/55">
            Valor do imóvel
          </label>
          <div className="rounded-2xl border border-surface-foreground/12 bg-surface px-4 py-3 text-sm font-semibold text-surface-foreground">
            {formatCurrency(data.valorImovel)}
          </div>
        </div>
        <div>
          <label className="mb-1.5 block text-xs font-medium text-surface-foreground/55">
            Valor de entrada
          </label>
          <div className="rounded-2xl border border-surface-foreground/12 bg-surface px-4 py-3 text-sm font-semibold text-surface-foreground">
            {formatCurrency(data.entrada)}
          </div>
        </div>
      </div>

      {/* Seletor de parcelas */}
      <div>
        <label className="mb-1.5 block text-sm font-semibold text-surface-foreground">
          Em quanto tempo quer pagar?
        </label>
        <div className="grid grid-cols-3 gap-2 max-sm:grid-cols-2">
          {PARCELAS_OPTIONS.map((p) => (
            <button
              key={p}
              type="button"
              onClick={() => setParcelas(p)}
              className={`rounded-2xl border py-3 text-sm font-medium transition-colors ${
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

      {/* Card escuro com resultado */}
      <div className="rounded-2xl bg-surface-foreground p-6 text-surface max-sm:p-5">
        <div className="mb-4 flex items-center justify-between">
          <div>
            <h3 className="text-sm font-medium text-surface/70">Parcela mensal</h3>
            <p className="text-xs text-surface/40">Sistema PRICE (Fixas)</p>
          </div>
          <p className="text-2xl font-bold leading-none tracking-tight text-surface">
            <span className="text-sm font-medium text-surface/50">R$</span>{' '}
            {installment.toLocaleString('pt-BR', {
              minimumFractionDigits: 2,
              maximumFractionDigits: 2,
            })}
          </p>
        </div>

        <div className="mt-5 border-t border-surface/15 pt-4">
          <div className="grid grid-cols-4 gap-2 text-xs">
            {[
              { label: 'Financiado', value: formatCurrency(principal) },
              { label: 'Prazo', value: `${parcelas}x` },
              { label: 'Taxa ref.', value: `${rateMonthly.toFixed(2).replace('.', ',')}% a.m.` },
              { label: 'LTV', value: `${ltv}%` },
            ].map((item) => (
              <div key={item.label}>
                <p className="mb-0.5 text-surface/40">{item.label}</p>
                <p className="font-medium text-surface/90">{item.value}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Aviso informativo */}
      <div className="flex items-start gap-2.5 rounded-xl border border-primary/20 bg-primary/5 px-4 py-3">
        <Info className="mt-0.5 h-4 w-4 flex-shrink-0 text-primary" />
        <p className="text-xs leading-relaxed text-primary/80">
          Esta é uma simulação referencial. Condições finais dependem da análise de crédito e
          avaliação do imóvel.
        </p>
      </div>

      {/* CTA */}
      <button
        type="button"
        disabled={!simulationId || isQualifying}
        onClick={async () => {
          if (!simulationId) return
          setIsQualifying(true)
          await qualifySimulation(simulationId)
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
