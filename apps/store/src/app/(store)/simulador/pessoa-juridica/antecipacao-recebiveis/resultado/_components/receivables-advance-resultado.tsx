'use client'

import { useState, useMemo, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Info, RefreshCw, Download } from 'lucide-react'
import { formatCurrency, formatRate, calcPMT, calcCETAnual } from '@/lib/utils/simulator'
import { saveSimulation, qualifySimulation } from '@/app/(store)/simulador/actions'
import { StoreButton } from '@/components/ui/store-button'

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
  prazo: number
}

export function AntecipacaoReceiveisResultado({ productId, productName, rateMonthly }: Props) {
  const router = useRouter()
  const [data, setData] = useState<SimData | null>(null)
  const [prazo, setPrazo] = useState(30)
  const [simulationId, setSimulationId] = useState<string | null>(null)
  const [isQualifying, setIsQualifying] = useState(false)

  const prazoOptions = useMemo(
    () => (data?.tipoRecebivel === 'NF-e' || data?.tipoRecebivel === 'Contrato') ? [30, 60, 90, 190] : [30, 60, 90],
    [data?.tipoRecebivel],
  )

  useEffect(() => {
    const stored = sessionStorage.getItem('sim:antecipacao-recebiveis')
    if (!stored) {
      router.replace(`/simulador/pessoa-juridica/antecipacao-recebiveis?productId=${productId}`)
      return
    }
    try {
      const parsed: SimData = JSON.parse(stored)
      setData(parsed)
      setPrazo(parsed.prazo)

      const SIM_ID_KEY = 'sim:antecipacao-recebiveis:id'
      const existingId = sessionStorage.getItem(SIM_ID_KEY)
      if (existingId) {
        setSimulationId(existingId)
      } else {
        const payment = calcPMT(parsed.valorCredito, rateMonthly, parsed.prazo)
        saveSimulation({
          tenantProductId: productId,
          clientName: parsed.nome,
          clientPhone: parsed.whatsapp,
          desiredAmount: parsed.valorCredito,
          desiredTermMonths: parsed.prazo,
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
      router.replace(`/simulador/pessoa-juridica/antecipacao-recebiveis?productId=${productId}`)
    }
  }, [router, productId, rateMonthly])

  const installment = useMemo(() => {
    if (!data) return 0
    return calcPMT(data.valorCredito, rateMonthly, prazo)
  }, [data, rateMonthly, prazo])

  const cetAnual = useMemo(() => calcCETAnual(rateMonthly), [rateMonthly])

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

      {/* Prazo selector */}
      <div>
        <label className="mb-1.5 block text-sm font-semibold text-surface-foreground">
          Prazo de antecipação
        </label>
        <div className="flex gap-2">
          {prazoOptions.map((p) => (
            <button
              key={p}
              type="button"
              onClick={() => setPrazo(p)}
              className={`flex-1 rounded-lg border py-3 text-sm font-medium transition-colors ${
                prazo === p
                  ? 'border-primary bg-primary/5 text-primary'
                  : 'border-surface-foreground/12 bg-surface-foreground/5 text-surface-foreground/60 hover:bg-surface-foreground/10'
              }`}
            >
              {p} dias
            </button>
          ))}
        </div>
      </div>

      {/* Valor principal */}
      <div>
        <p className="text-sm text-surface-foreground/55">Crédito antecipado</p>
        <p className="mt-1 text-3xl font-extrabold tracking-tight text-surface-foreground">
          {formatCurrency(data.valorCredito)}
        </p>
        <p className="mt-0.5 text-xs text-surface-foreground/45">Sistema PRICE (parcelas fixas)</p>
      </div>

      {/* Highlight pill */}
      <div className="flex items-center justify-between rounded-lg bg-primary/12 px-4 py-2.5">
        <span className="text-sm font-semibold text-surface-foreground">
          {prazo} dias — {formatCurrency(installment)}
        </span>
        <span className="text-sm font-semibold text-surface-foreground">
          {formatRate(rateMonthly)}% a.m.
        </span>
      </div>

      {/* Divider */}
      <div className="h-px bg-surface-foreground/8" />

      {/* Data rows */}
      <div className="space-y-2.5">
        {[
          { label: 'Crédito', value: formatCurrency(data.valorCredito) },
          { label: 'Total de recebíveis', value: formatCurrency(data.valorRecebiveis) },
          { label: 'Tipo de recebível', value: data.tipoRecebivel },
          { label: 'Taxa mensal', value: `${formatRate(rateMonthly)}% a.m.` },
          { label: 'CET anual', value: `${cetAnual.toFixed(1).replace('.', ',')}%` },
          { label: 'Prazo', value: `${prazo} dias` },
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
          Condições sujeitas à análise dos documentos de recebíveis. Simulação baseada na taxa
          mínima de{' '}
          <strong className="font-semibold text-primary">
            {formatRate(rateMonthly)}% a.m.
          </strong>{' '}
          para {productName}.
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
