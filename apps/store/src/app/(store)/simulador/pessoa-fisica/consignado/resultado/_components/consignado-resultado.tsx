'use client'

import { useState, useMemo, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Info, RefreshCw, Download } from 'lucide-react'
import { formatCurrency, formatRate, calcPMT, calcCETAnual } from '@/lib/utils/simulator'
import { saveSimulation, qualifySimulation } from '@/app/(store)/simulador/actions'

type Props = {
  productId: string
  productName: string
  rateMonthly: number
  minTermMonths: number
  maxTermMonths: number
}

type SimData = {
  nome: string
  whatsapp: string
  valorDesejado: number
  parcelas: number
}

export function ConsignadoResultado({ productId, productName, rateMonthly, minTermMonths, maxTermMonths }: Props) {
  const router = useRouter()
  const [data, setData] = useState<SimData | null>(null)
  const [parcelas, setParcelas] = useState(24)
  const [simulationId, setSimulationId] = useState<string | null>(null)
  const [isQualifying, setIsQualifying] = useState(false)

  const PARCELAS_OPTIONS = useMemo(() => {
    const opts: number[] = []
    const step = maxTermMonths <= 24 ? 6 : 12
    for (let m = Math.max(minTermMonths, step); m <= maxTermMonths; m += step) opts.push(m)
    if (opts.length === 0) opts.push(maxTermMonths)
    return opts
  }, [minTermMonths, maxTermMonths])

  useEffect(() => {
    const stored = sessionStorage.getItem('sim:consignado')
    if (!stored) {
      router.replace(`/simulador/pessoa-fisica/consignado?productId=${productId}`)
      return
    }
    try {
      const parsed: SimData = JSON.parse(stored)
      setData(parsed)
      setParcelas(parsed.parcelas)

      const SIM_ID_KEY = 'sim:consignado:id'
      const existingId = sessionStorage.getItem(SIM_ID_KEY)
      if (existingId) {
        setSimulationId(existingId)
      } else {
        const payment = calcPMT(parsed.valorDesejado, rateMonthly, parsed.parcelas)
        saveSimulation({
          tenantProductId: productId,
          clientName: parsed.nome,
          clientPhone: parsed.whatsapp,
          desiredAmount: parsed.valorDesejado,
          desiredTermMonths: parsed.parcelas,
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
      router.replace(`/simulador/pessoa-fisica/consignado?productId=${productId}`)
    }
  }, [router, productId, rateMonthly])

  const installment = useMemo(() => {
    if (!data) return 0
    return calcPMT(data.valorDesejado, rateMonthly, parcelas)
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

      <div>
        <label className="mb-1.5 block text-xs font-medium text-surface-foreground/55">
          Valor solicitado
        </label>
        <div className="rounded-2xl border border-surface-foreground/12 bg-surface px-4 py-3 text-sm font-semibold text-surface-foreground">
          {formatCurrency(data.valorDesejado)}
        </div>
      </div>

      <div>
        <label className="mb-1.5 block text-sm font-semibold text-surface-foreground">
          Em quanto tempo quer pagar?
        </label>
        <div className="flex flex-wrap gap-2">
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
              { label: 'Solicitado', value: formatCurrency(data.valorDesejado) },
              { label: 'Prazo', value: `${parcelas}x` },
              { label: 'Taxa ref.', value: `${formatRate(rateMonthly)}% a.m.` },
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

      <div className="flex items-start gap-2.5 rounded-xl border border-primary/20 bg-primary/5 px-4 py-3">
        <Info className="mt-0.5 h-4 w-4 flex-shrink-0 text-primary" />
        <p className="text-xs leading-relaxed text-primary/80">
          Simulação baseada na taxa mínima de{' '}
          <strong className="font-semibold text-primary">{formatRate(rateMonthly)}% a.m.</strong> para{' '}
          {productName}. As condições finais dependem da margem consignável e da análise de crédito.
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
