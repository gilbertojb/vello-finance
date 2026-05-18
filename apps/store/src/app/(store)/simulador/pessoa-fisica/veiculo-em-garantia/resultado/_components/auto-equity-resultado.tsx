'use client'

import { useState, useMemo, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { RefreshCw, Info, Download } from 'lucide-react'
import { formatCurrency, formatRate, calcSAC, calcPMT } from '@/lib/utils/simulator'
import { saveSimulation, qualifySimulation } from '@/app/(store)/simulador/actions'
import { StoreButton } from '@/components/ui/store-button'

const PARCELAS_OPTIONS = [15, 25, 35, 45, 60, 90]

type Modalidade = 'SAC' | 'PRICE'

type Props = {
  productId: string
  productName: string
  rateMonthly: number
  isPj?: boolean
}

export function AutoEquityResultado({ productId, rateMonthly, isPj = false }: Props) {
  const router = useRouter()
  const [data, setData] = useState<{
    nome: string
    whatsapp: string
    valorFipe: number
    valorCredito: number
    marca: string
    ano: number
    parcelas?: number
  } | null>(null)
  const [parcelas, setParcelas] = useState(60)
  const [modalidade, setModalidade] = useState<Modalidade>('SAC')
  const [simulationId, setSimulationId] = useState<string | null>(null)
  const [isQualifying, setIsQualifying] = useState(false)

  useEffect(() => {
    const key = isPj ? 'sim:auto-equity-pj' : 'sim:auto-equity'
    const stored = sessionStorage.getItem(key)
    const route = isPj
      ? '/simulador/pessoa-juridica/veiculo-em-garantia'
      : '/simulador/pessoa-fisica/veiculo-em-garantia'
    if (!stored) {
      router.replace(route + `?productId=${productId}`)
      return
    }
    try {
      const parsed = JSON.parse(stored)
      setData(parsed)
      if (parsed.parcelas) setParcelas(parsed.parcelas)

      const SIM_ID_KEY = isPj ? 'sim:auto-equity-pj:id' : 'sim:auto-equity:id'
      const existingId = sessionStorage.getItem(SIM_ID_KEY)
      if (existingId) {
        setSimulationId(existingId)
      } else {
        const termMonths = parsed.parcelas ?? 48
        const payment = calcPMT(parsed.valorCredito, rateMonthly, termMonths)
        saveSimulation({
          tenantProductId: productId,
          clientName: parsed.nome,
          clientPhone: parsed.whatsapp ?? '',
          desiredAmount: parsed.valorCredito,
          desiredTermMonths: termMonths,
          estimatedRate: rateMonthly,
          estimatedPayment: payment,
          simulationData: parsed as Record<string, unknown>,
        }).then((result) => {
          if (result.success && result.data) {
            setSimulationId(result.data.id)
            sessionStorage.setItem(SIM_ID_KEY, result.data.id)
          }
        })
      }
    } catch {
      router.replace(route + `?productId=${productId}`)
    }
  }, [router, isPj, productId, rateMonthly])

  const ltv = data ? Math.round((data.valorCredito / data.valorFipe) * 100) : 0

  const calc = useMemo(() => {
    if (!data) return { first: 0, last: 0, amortization: 0 }
    if (modalidade === 'SAC') {
      return calcSAC(data.valorCredito, rateMonthly, parcelas)
    }
    const installment = calcPMT(data.valorCredito, rateMonthly, parcelas)
    return { first: installment, last: installment, amortization: 0 }
  }, [data, rateMonthly, parcelas, modalidade])

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
            Valor da Tabela FIPE
          </label>
          <div className="rounded-lg border border-surface-foreground/12 bg-surface px-4 py-3 text-sm font-semibold text-surface-foreground">
            {formatCurrency(data.valorFipe)}
          </div>
        </div>
        <div>
          <label className="mb-1.5 block text-xs font-medium text-surface-foreground/55">
            Valor do crédito
          </label>
          <div className="rounded-lg border border-surface-foreground/12 bg-surface px-4 py-3 text-sm font-semibold text-surface-foreground">
            {formatCurrency(data.valorCredito)}
          </div>
        </div>
      </div>

      {/* Parcelas selector */}
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
              className={`flex-1 rounded-lg border py-3 text-sm font-medium transition-colors ${
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

      {/* Modalidade toggle */}
      <div>
        <label className="mb-1.5 block text-xs font-medium text-surface-foreground/55">
          Modalidade
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
          { label: 'Crédito', value: formatCurrency(data.valorCredito) },
          { label: 'Valor do veículo (FIPE)', value: formatCurrency(data.valorFipe) },
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
          Simulação referencial baseada na taxa mínima de{' '}
          <strong className="font-semibold text-primary">{formatRate(rateMonthly)}% a.m.</strong>{' '}
          Condições finais dependem da análise de crédito e vistoria do veículo ({data.marca} -{' '}
          {data.ano}).
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
