'use client'

import { useState, useMemo, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { RefreshCw, Info, Download } from 'lucide-react'
import { formatCurrency } from '@/lib/utils/simulator'

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
  const [data, setData] = useState<{ nome: string; valorImovel: number; valorCredito: number } | null>(null)
  const [parcelas, setParcelas] = useState(240)
  const [modalidade, setModalidade] = useState<Modalidade>('SAC')

  useEffect(() => {
    const key = isPj ? 'sim:home-equity-pj' : 'sim:home-equity'
    const stored = sessionStorage.getItem(key)
    const route = isPj ? '/simulador/pessoa-juridica/home-equity-pj' : '/simulador/pessoa-fisica/home-equity'
    if (!stored) {
      router.replace(route + `?productId=${productId}`)
      return
    }
    try {
      setData(JSON.parse(stored))
    } catch {
      router.replace(route + `?productId=${productId}`)
    }
  }, [router, isPj, productId])

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
        <p className="text-[15px] font-medium text-surface-foreground">Olá, {data.nome}!</p>
      </div>
      {/* Valores do imóvel e crédito (somente leitura) */}
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="mb-1.5 block text-xs font-medium text-surface-foreground/55">
            Valor do imóvel
          </label>
          <div className="rounded-2xl border border-surface-foreground/12 bg-surface px-4 py-3 text-[15px] font-semibold text-surface-foreground">
            R$ {data.valorImovel.toLocaleString('pt-BR')}
          </div>
        </div>
        <div>
          <label className="mb-1.5 block text-xs font-medium text-surface-foreground/55">
            Valor do crédito
          </label>
          <div className="rounded-2xl border border-surface-foreground/12 bg-surface px-4 py-3 text-[15px] font-semibold text-surface-foreground">
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
              className="w-full appearance-none rounded-2xl border border-surface-foreground/15 bg-white px-4 py-3 text-[15px] font-semibold text-surface-foreground focus:outline-none focus:ring-2 focus:ring-primary/20"
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
                    ? 'bg-background text-primary'
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
      <div className="rounded-2xl bg-background p-7">
        <div className="mb-4 flex items-center gap-1.5 text-xs text-primary/70">
          <RefreshCw className="h-3 w-3" />
          <span>Cálculo em tempo real</span>
        </div>

        <p className="mb-1 text-sm font-medium text-primary/80">
          {isSAC ? 'Primeira parcela (decrescente)' : 'Parcela fixa (PRICE)'}
        </p>
        <div className="mb-3 text-[40px] font-bold leading-none tracking-tight text-white">
          {formatCurrency(calc.firstInstallment)}
        </div>

        {isSAC && (
          <div className="space-y-1 text-sm text-primary/80">
            <p>Última parcela: <strong className="text-primary">{formatCurrency(calc.lastInstallment)}</strong></p>
            <p>Amortização mensal fixa: <strong className="text-primary">{formatCurrency(calc.amortization!)}</strong></p>
          </div>
        )}

        <div className="mt-5 border-t border-white/10 pt-4">
          <div className="grid grid-cols-4 gap-2 text-xs">
            {[
              { label: 'Crédito', value: formatCurrency(data.valorCredito) },
              { label: 'Prazo', value: `${parcelas}x` },
              { label: 'Taxa ref.', value: `${rateMonthly.toFixed(2).replace('.', ',')}% a.m.` },
              { label: 'LTV', value: `${ltv}%` },
            ].map(({ label, value }) => (
              <div key={label}>
                <div className="text-white/50">{label}</div>
                <div className="mt-0.5 font-semibold text-white">{value}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Aviso */}
      <div className="flex items-start gap-2.5 rounded-xl border border-[oklch(0.83_0.10_85)/30%] bg-[oklch(0.97_0.03_85)] px-4 py-3">
        <Info className="mt-0.5 h-4 w-4 flex-shrink-0 text-[oklch(0.55_0.10_60)]" />
        <p className="text-xs text-surface-foreground/65">
          Simulação estimada. A taxa e condições definitivas são apresentadas após a análise do seu perfil de crédito.
        </p>
      </div>

      {/* CTAs */}
      <button
        type="button"
        onClick={() => router.push(`/solicitar/${productId}?amount=${data.valorCredito}&term=${parcelas}`)}
        className="w-full rounded-2xl bg-background px-5 py-4 text-[15px] font-semibold text-primary transition-opacity hover:opacity-90"
      >
        Quero contratar este crédito →
      </button>

      <button
        type="button"
        disabled
        className="flex w-full items-center justify-center gap-2 rounded-2xl border border-surface-foreground/15 bg-white px-5 py-4 text-[15px] font-medium text-surface-foreground/50 disabled:cursor-not-allowed"
      >
        <Download className="h-4 w-4" />
        Baixar simulação em PDF
      </button>
    </div>
  )
}
