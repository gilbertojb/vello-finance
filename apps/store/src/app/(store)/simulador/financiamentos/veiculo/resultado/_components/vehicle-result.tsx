'use client'

import { useState, useMemo, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Info, RefreshCw, Download } from 'lucide-react'
import { formatCurrency, calcPMT } from '@/lib/utils/simulator'
import { saveSimulation, qualifySimulation } from '../../../../actions'

const PARCELAS_OPTIONS = [12, 24, 36, 48, 60]

type SimData = {
  nome: string
  whatsapp: string
  valorVeiculo: number
  entrada: number
  parcelas: number
}

type Props = {
  productId: string
  rateMonthly: number
}

export function VehicleResult({ productId, rateMonthly }: Props) {
  const router = useRouter()
  const [data, setData] = useState<SimData | null>(null)
  const [parcelas, setParcelas] = useState(48)
  const [simulationId, setSimulationId] = useState<string | null>(null)
  const [isQualifying, setIsQualifying] = useState(false)

  useEffect(() => {
    const stored = sessionStorage.getItem('sim:financiamento-veiculo')
    if (!stored) {
      router.replace(`/simulador/financiamentos/veiculo?productId=${productId}`)
      return
    }
    try {
      const parsed: SimData = JSON.parse(stored)
      setData(parsed)
      setParcelas(parsed.parcelas)

      const SIM_ID_KEY = 'sim:financiamento-veiculo:id'
      const existingId = sessionStorage.getItem(SIM_ID_KEY)
      if (existingId) {
        setSimulationId(existingId)
      } else {
        const principal = parsed.valorVeiculo - parsed.entrada
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
        }).then((id: string | null) => {
          if (id) {
            sessionStorage.setItem(SIM_ID_KEY, id)
            setSimulationId(id)
          }
        })
      }
    } catch {
      router.replace(`/simulador/financiamentos/veiculo?productId=${productId}`)
    }
  }, [router, productId, rateMonthly])

  const principal = data ? data.valorVeiculo - data.entrada : 0
  const ltv = data ? Math.round((principal / data.valorVeiculo) * 100) : 0

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
        <p className="text-[15px] font-medium text-surface-foreground">
          Olá, {data.nome}!
        </p>
      </div>

      {/* Valor do veículo e entrada (read-only) */}
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="mb-1.5 block text-xs font-medium text-surface-foreground/55">
            Valor do veículo
          </label>
          <div className="rounded-2xl border border-surface-foreground/12 bg-surface px-4 py-3 text-[15px] font-semibold text-surface-foreground">
            {formatCurrency(data.valorVeiculo)}
          </div>
        </div>
        <div>
          <label className="mb-1.5 block text-xs font-medium text-surface-foreground/55">
            Valor de entrada
          </label>
          <div className="rounded-2xl border border-surface-foreground/12 bg-surface px-4 py-3 text-[15px] font-semibold text-surface-foreground">
            {formatCurrency(data.entrada)}
          </div>
        </div>
      </div>

      {/* Seletor de parcelas */}
      <div>
        <label className="mb-1.5 block text-sm font-semibold text-surface-foreground">
          Em quanto tempo quer pagar?
        </label>
        <div className="flex gap-2 max-sm:grid max-sm:grid-cols-3">
          {PARCELAS_OPTIONS.map((p) => (
            <button
              key={p}
              type="button"
              onClick={() => setParcelas(p)}
              className={`flex-1 rounded-2xl border py-3 text-[15px] font-medium transition-colors ${
                parcelas === p
                  ? 'border-primary bg-primary/5 text-primary'
                  : 'border-surface-foreground/12 bg-white text-surface-foreground/60 hover:bg-surface'
              }`}
            >
              {p}x
            </button>
          ))}
        </div>
      </div>

      {/* Card escuro com resultado */}
      <div className="rounded-2xl bg-surface-foreground p-6 text-white max-sm:p-5">
        <div className="mb-4 flex items-center justify-between">
          <div>
            <h3 className="text-[15px] font-medium text-white/70">Parcela mensal</h3>
            <p className="text-[11px] text-white/40">Sistema PRICE (Fixas)</p>
          </div>
          <p className="text-[28px] font-bold leading-none tracking-tight text-white">
            <span className="text-[15px] font-medium text-white/50">R$</span>{' '}
            {installment.toLocaleString('pt-BR', {
              minimumFractionDigits: 2,
              maximumFractionDigits: 2,
            })}
          </p>
        </div>

        <div className="mt-5 border-t border-white/10 pt-4">
          <div className="grid grid-cols-4 gap-2 text-xs">
            {[
              { label: 'Financiado', value: formatCurrency(principal) },
              { label: 'Prazo', value: `${parcelas}x` },
              { label: 'Taxa ref.', value: `${rateMonthly.toFixed(2).replace('.', ',')}% a.m.` },
              { label: 'LTV', value: `${ltv}%` },
            ].map((item) => (
              <div key={item.label}>
                <p className="mb-0.5 text-white/40">{item.label}</p>
                <p className="font-medium text-white/90">{item.value}</p>
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
          vistoria do veículo.
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
        className="w-full rounded-2xl bg-background px-5 py-4 text-[15px] font-semibold text-primary transition-opacity hover:opacity-90 disabled:opacity-40"
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
