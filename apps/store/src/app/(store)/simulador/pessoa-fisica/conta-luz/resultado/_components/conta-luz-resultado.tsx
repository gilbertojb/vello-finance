'use client'

import { useState, useMemo, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Info } from 'lucide-react'
import { formatCurrency, formatRate, calcPMT, calcCETAnual } from '@/lib/utils/simulator'
import { saveSimulation, qualifySimulation } from '../../../../actions'

const PARCELAS_OPTIONS = [6, 12, 18, 24]

type Props = {
  productId: string
  productName: string
  rateMonthly: number
}

type SimData = {
  nome: string
  whatsapp: string
  distribuidora: string
  valorDesejado: number
  parcelas: number
}

export function ContaLuzResultado({ productId, productName, rateMonthly }: Props) {
  const router = useRouter()
  const [data, setData] = useState<SimData | null>(null)
  const [parcelas, setParcelas] = useState(12)
  const [simulationId, setSimulationId] = useState<string | null>(null)
  const [isQualifying, setIsQualifying] = useState(false)

  useEffect(() => {
    const stored = sessionStorage.getItem('sim:conta-luz')
    if (!stored) {
      router.replace(`/simulador/pessoa-fisica/conta-luz?productId=${productId}`)
      return
    }
    try {
      const parsed: SimData = JSON.parse(stored)
      setData(parsed)
      setParcelas(parsed.parcelas)

      const SIM_ID_KEY = 'sim:conta-luz:id'
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
        }).then((id: string | null) => {
          if (id) {
            sessionStorage.setItem(SIM_ID_KEY, id)
            setSimulationId(id)
          }
        })
      }
    } catch {
      router.replace(`/simulador/pessoa-fisica/conta-luz?productId=${productId}`)
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
        <p className="text-[15px] font-medium text-surface-foreground">Olá, {data.nome}!</p>
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

      {/* Card de resultado */}
      <div className="rounded-2xl bg-surface-foreground p-6 text-white max-sm:p-5">
        <div className="mb-4 flex items-center justify-between">
          <div>
            <h3 className="text-[15px] font-medium text-white/70">Parcela mensal</h3>
            <p className="text-[11px] text-white/40">Sistema PRICE (Fixas)</p>
          </div>
          <p className="text-[28px] font-bold leading-none tracking-tight text-white">
            <span className="text-[15px] font-medium text-white/50">R$</span>{' '}
            {installment.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </p>
        </div>

        <div className="mt-5 border-t border-white/10 pt-4">
          <div className="grid grid-cols-5 gap-2 text-xs">
            {[
              { label: 'Solicitado', value: formatCurrency(data.valorDesejado) },
              { label: 'Prazo', value: `${parcelas}x` },
              { label: 'Taxa ref.', value: `${formatRate(rateMonthly)}% a.m.` },
              { label: 'CET anual', value: `${cetAnual.toFixed(1).replace('.', ',')}%` },
              { label: 'Distribuidora', value: data.distribuidora },
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
          Simulação baseada na taxa mínima de{' '}
          <strong className="font-semibold text-primary">{formatRate(rateMonthly)}% a.m.</strong> para{' '}
          {productName}. As condições finais dependem da análise de crédito.
        </p>
      </div>

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
    </div>
  )
}
