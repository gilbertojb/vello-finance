'use client'

import { useState, useMemo, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Info, RefreshCw, Download } from 'lucide-react'
import { formatCurrency, formatRate, calcSAC, calcPMT } from '@/lib/utils/simulator'
import { saveSimulation, qualifySimulation } from '@/app/(store)/simulador/actions'
import { StoreButton } from '@/components/ui/store-button'

const PARCELAS_OPTIONS = [60, 120, 180, 240, 300, 360]

type Modalidade = 'SAC' | 'PRICE'

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
  const [modalidade, setModalidade] = useState<Modalidade>('SAC')
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

  const calc = useMemo(() => {
    if (!data || principal <= 0) return { first: 0, last: 0, amortization: 0 }
    if (modalidade === 'SAC') {
      return calcSAC(principal, rateMonthly, parcelas)
    }
    const installment = calcPMT(principal, rateMonthly, parcelas)
    return { first: installment, last: installment, amortization: 0 }
  }, [data, principal, rateMonthly, parcelas, modalidade])

  const isSAC = modalidade === 'SAC'

  if (!data) {
    return (
      <div className="py-12 text-center text-sm text-surface-foreground/50">
        Carregando dados da simulação...
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {/* Greeting */}
      <p className="text-sm font-medium text-surface-foreground">Olá, {data.nome}!</p>

      {/* Read-only fields */}
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="mb-1.5 block text-xs font-medium text-surface-foreground/55">
            Valor do imóvel
          </label>
          <div className="rounded-lg border border-surface-foreground/12 bg-surface px-4 py-3 text-sm font-semibold text-surface-foreground">
            {formatCurrency(data.valorImovel)}
          </div>
        </div>
        <div>
          <label className="mb-1.5 block text-xs font-medium text-surface-foreground/55">
            Valor de entrada
          </label>
          <div className="rounded-lg border border-surface-foreground/12 bg-surface px-4 py-3 text-sm font-semibold text-surface-foreground">
            {formatCurrency(data.entrada)}
          </div>
        </div>
      </div>

      {/* Modalidade toggle */}
      <div>
        <label className="mb-1.5 block text-xs font-medium text-surface-foreground/55">
          Sistema de amortização
        </label>
        <div className="flex overflow-hidden rounded-lg border border-surface-foreground/15 bg-white">
          {(['SAC', 'PRICE'] as Modalidade[]).map((m) => (
            <button
              key={m}
              type="button"
              onClick={() => setModalidade(m)}
              className={`flex-1 py-3 text-sm font-bold transition-colors ${
                modalidade === m
                  ? 'bg-surface-foreground text-surface'
                  : 'text-surface-foreground/50 hover:text-surface-foreground'
              }`}
            >
              {m}
            </button>
          ))}
        </div>
      </div>

      {/* Parcelas selector */}
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
              className={`rounded-lg border py-3 text-sm font-medium transition-colors ${
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

      {/* Valor principal */}
      <div>
        <p className="text-sm text-surface-foreground/55">
          {isSAC ? 'Primeira parcela (decrescente)' : 'Parcela fixa (PRICE)'}
        </p>
        <p className="mt-1 text-3xl font-extrabold tracking-tight text-surface-foreground">
          {formatCurrency(calc.first)}
        </p>
        {isSAC && (
          <p className="mt-0.5 text-xs text-surface-foreground/45">
            Última parcela: {formatCurrency(calc.last)}
          </p>
        )}
      </div>

      {/* Highlight pill */}
      <div className="flex items-center justify-between rounded-lg bg-primary/12 px-4 py-2.5">
        <span className="text-sm font-semibold text-surface-foreground">
          {isSAC ? `${parcelas}× decrescentes` : `${parcelas}× fixas`}
        </span>
        <span className="text-sm font-semibold text-surface-foreground">
          {isSAC
            ? `${formatCurrency(calc.last)} → ${formatCurrency(calc.first)}`
            : formatCurrency(calc.first)}
        </span>
      </div>

      {/* Divider */}
      <div className="h-px bg-surface-foreground/8" />

      {/* Data rows */}
      <div className="space-y-2.5">
        {[
          { label: 'Financiado', value: formatCurrency(principal) },
          { label: 'Valor do imóvel', value: formatCurrency(data.valorImovel) },
          { label: 'Taxa mensal', value: `${formatRate(rateMonthly)}% a.m.` },
          { label: 'LTV', value: `${ltv}%` },
          { label: 'Sistema', value: modalidade },
        ].map(({ label, value }) => (
          <div key={label} className="flex justify-between text-sm">
            <span className="text-surface-foreground/55">{label}</span>
            <span className="font-semibold text-surface-foreground">{value}</span>
          </div>
        ))}
      </div>

      {/* Aviso */}
      <div className="flex items-start gap-2.5 rounded-lg border border-primary/20 bg-primary/5 px-4 py-3">
        <Info className="mt-0.5 h-4 w-4 flex-shrink-0 text-primary" />
        <p className="text-xs leading-relaxed text-primary/80">
          Esta é uma simulação referencial. Condições finais dependem da análise de crédito e
          avaliação do imóvel.
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
          onClick={() => {
            if (simulationId) window.open(`/api/simulations/${simulationId}/pdf`, '_blank')
          }}
          className="inline-flex items-center gap-2 text-xs font-medium text-surface-foreground/40 transition-colors hover:text-surface-foreground disabled:opacity-30"
        >
          <Download className="h-3.5 w-3.5" /> Baixar PDF
        </button>
      </div>
    </div>
  )
}
