'use client'

import { useState, useMemo, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { RefreshCw, Info, Download } from 'lucide-react'
import { formatCurrency } from '@/lib/utils/simulator'
import { saveSimulation, qualifySimulation } from '@/app/(store)/simulador/actions'

const PARCELAS_OPTIONS = [60, 120, 180, 240]

type Modalidade = 'SAC' | 'PRICE'

type Props = {
  productId: string
  productName: string
  rateMonthly: number
  isPj?: boolean
}

function calcSAC(principal: number, ratePercent: number, n: number) {
  const r = ratePercent / 100
  const amortization = principal / n
  const firstInstallment = amortization + principal * r
  const lastInstallment = amortization + amortization * r
  return { firstInstallment, lastInstallment, amortization }
}

function calcPRICE(principal: number, ratePercent: number, n: number) {
  const r = ratePercent / 100
  if (r === 0) return principal / n
  return (principal * (r * Math.pow(1 + r, n))) / (Math.pow(1 + r, n) - 1)
}

export function HomeEquityResultado({ productId, rateMonthly, isPj = false }: Props) {
  const router = useRouter()
  const [data, setData] = useState<{ nome: string; whatsapp: string; valorImovel: number; valorCredito: number; parcelas?: number } | null>(null)
  const [parcelas, setParcelas] = useState(240)
  const [modalidade, setModalidade] = useState<Modalidade>('SAC')
  const [simulationId, setSimulationId] = useState<string | null>(null)
  const [isQualifying, setIsQualifying] = useState(false)

  useEffect(() => {
    const key = isPj ? 'sim:home-equity-pj' : 'sim:home-equity'
    const stored = sessionStorage.getItem(key)
    const route = isPj ? '/simulador/pessoa-juridica/imovel-em-garantia' : '/simulador/pessoa-fisica/imovel-em-garantia'
    if (!stored) {
      router.replace(route + `?productId=${productId}`)
      return
    }
    try {
      const parsed = JSON.parse(stored)
      setData(parsed)
      if (parsed.parcelas) setParcelas(parsed.parcelas)

      const SIM_ID_KEY = isPj ? 'sim:home-equity-pj:id' : 'sim:home-equity:id'
      const existingId = sessionStorage.getItem(SIM_ID_KEY)
      if (existingId) {
        setSimulationId(existingId)
      } else {
        const termMonths = parsed.parcelas ?? 240
        const payment = calcPRICE(parsed.valorCredito, rateMonthly, termMonths)
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
          if (result.success) {
            setSimulationId(result.data.id)
            sessionStorage.setItem(SIM_ID_KEY, result.data.id)
          }
        })
      }
    } catch {
      router.replace(route + `?productId=${productId}`)
    }
  }, [router, isPj, productId, rateMonthly])

  const ltv = data ? Math.round((data.valorCredito / data.valorImovel) * 100) : 0

  const calc = useMemo(() => {
    if (!data) return { firstInstallment: 0, lastInstallment: 0, amortization: 0 }
    if (modalidade === 'SAC') {
      return calcSAC(data.valorCredito, rateMonthly, parcelas)
    }
    const installment = calcPRICE(data.valorCredito, rateMonthly, parcelas)
    return { firstInstallment: installment, lastInstallment: installment, amortization: null }
  }, [data, rateMonthly, parcelas, modalidade])

  const isSAC = modalidade === 'SAC'

  if (!data) {
    return <div className="py-12 text-center text-sm text-surface-foreground/50">Carregando dados da simulação...</div>
  }

  return (
    <div className="space-y-5">
      <div className="mb-4">
        <p className="text-sm font-medium text-surface-foreground">Olá, {data.nome}!</p>
      </div>
      {/* Valores do imóvel e crédito (somente leitura) */}
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="mb-1.5 block text-xs font-medium text-surface-foreground/55">
            Valor do imóvel
          </label>
          <div className="rounded-2xl border border-surface-foreground/12 bg-surface px-4 py-3 text-sm font-semibold text-surface-foreground">
            R$ {data.valorImovel.toLocaleString('pt-BR')}
          </div>
        </div>
        <div>
          <label className="mb-1.5 block text-xs font-medium text-surface-foreground/55">
            Valor do crédito
          </label>
          <div className="rounded-2xl border border-surface-foreground/12 bg-surface px-4 py-3 text-sm font-semibold text-surface-foreground">
            R$ {data.valorCredito.toLocaleString('pt-BR')}
          </div>
        </div>
      </div>

      {/* Parcelas e modalidade */}
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="mb-1.5 block text-xs font-medium text-surface-foreground/55">
            Parcelas
          </label>
          <div className="relative">
            <select
              value={parcelas}
              onChange={(e) => setParcelas(Number(e.target.value))}
              className="w-full appearance-none rounded-2xl border border-surface-foreground/15 bg-white px-4 py-3 text-sm font-semibold text-surface-foreground focus:outline-none focus:ring-2 focus:ring-primary/20"
            >
              {PARCELAS_OPTIONS.map((n) => (
                <option key={n} value={n}>{n}x</option>
              ))}
            </select>
            <svg className="pointer-events-none absolute right-4 top-1/2 h-4 w-4 -translate-y-1/2 text-surface-foreground/40" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" /></svg>
          </div>
        </div>
        <div>
          <label className="mb-1.5 block text-xs font-medium text-surface-foreground/55">
            Modalidade
          </label>
          <div className="flex overflow-hidden rounded-2xl border border-surface-foreground/15 bg-white">
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
      </div>

      {/* Card de resultado */}
      <div className="rounded-2xl bg-surface-foreground p-7">
        <div className="mb-4 flex items-center gap-1.5 text-xs text-primary/70">
          <RefreshCw className="h-3 w-3" />
          <span>Cálculo em tempo real</span>
        </div>

        <p className="mb-1 text-sm font-medium text-primary/80">
          {isSAC ? 'Primeira parcela (decrescente)' : 'Parcela fixa (PRICE)'}
        </p>
        <div className="mb-3 text-4xl font-bold leading-none tracking-tight text-surface">
          {formatCurrency(calc.firstInstallment)}
        </div>

        {isSAC && (
          <div className="space-y-1 text-sm text-primary/80">
            <p>Última parcela: <strong className="text-primary">{formatCurrency(calc.lastInstallment)}</strong></p>
            <p>Amortização mensal fixa: <strong className="text-primary">{formatCurrency(calc.amortization!)}</strong></p>
          </div>
        )}

        <div className="mt-5 border-t border-surface/15 pt-4">
          <div className="grid grid-cols-4 gap-2 text-xs">
            {[
              { label: 'Crédito', value: formatCurrency(data.valorCredito) },
              { label: 'Prazo', value: `${parcelas}x` },
              { label: 'Taxa ref.', value: `${rateMonthly.toFixed(2).replace('.', ',')}% a.m.` },
              { label: 'LTV', value: `${ltv}%` },
            ].map(({ label, value }) => (
              <div key={label}>
                <div className="text-surface/50">{label}</div>
                <div className="mt-0.5 font-semibold text-surface">{value}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Aviso */}
      <div className="flex items-start gap-2.5 rounded-xl border border-primary/30 bg-primary/5 px-4 py-3">
        <Info className="mt-0.5 h-4 w-4 flex-shrink-0 text-primary/70" />
        <p className="text-xs text-surface-foreground/65">
          Simulação estimada. A taxa e condições definitivas são apresentadas após a análise do seu perfil de crédito.
        </p>
      </div>

      {/* CTAs */}
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
