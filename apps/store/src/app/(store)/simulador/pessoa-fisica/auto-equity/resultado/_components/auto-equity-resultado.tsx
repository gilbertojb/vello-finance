'use client'

import { useState, useMemo, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { RefreshCw, Info, Download } from 'lucide-react'
import { formatCurrency } from '@/lib/utils/simulator'

const PARCELAS_OPTIONS = [24, 36, 48, 60]

type Props = {
  productId: string
  productName: string
  rateMonthly: number
  isPj?: boolean
}

function calcPRICE(principal: number, ratePercent: number, n: number) {
  const r = ratePercent / 100
  if (r === 0) return principal / n
  return (principal * (r * Math.pow(1 + r, n))) / (Math.pow(1 + r, n) - 1)
}

export function AutoEquityResultado({ productId, rateMonthly, isPj = false }: Props) {
  const router = useRouter()
  const [data, setData] = useState<{
    nome: string
    valorFipe: number
    valorCredito: number
    marca: string
    ano: number
  } | null>(null)
  const [parcelas, setParcelas] = useState(48)

  useEffect(() => {
    const key = isPj ? 'sim:auto-equity-pj' : 'sim:auto-equity'
    const stored = sessionStorage.getItem(key)
    const route = isPj ? '/simulador/pessoa-juridica/auto-equity-pj' : '/simulador/pessoa-fisica/auto-equity'
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

  const ltv = data ? Math.round((data.valorCredito / data.valorFipe) * 100) : 0

  const installment = useMemo(() => {
    if (!data) return 0
    return calcPRICE(data.valorCredito, rateMonthly, parcelas)
  }, [data, rateMonthly, parcelas])

  if (!data) {
    return <div className="py-12 text-center text-sm text-surface-foreground/50">Carregando dados da simulação...</div>
  }

  return (
    <div className="space-y-5">
      <div className="mb-4">
        <p className="text-[15px] font-medium text-surface-foreground">Olá, {data.nome}!</p>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="mb-1.5 block text-xs font-medium text-surface-foreground/55">
            Valor da Tabela FIPE
          </label>
          <div className="rounded-2xl border border-surface-foreground/12 bg-surface px-4 py-3 text-[15px] font-semibold text-surface-foreground">
            R$ {data.valorFipe.toLocaleString('pt-BR')}
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

      <div>
        <label className="mb-1.5 block text-sm font-semibold text-surface-foreground">
          Em quanto tempo quer pagar?
        </label>
        <div className="flex gap-2 max-sm:grid max-sm:grid-cols-2">
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
          <div className="grid grid-cols-4 gap-2 text-xs">
            {[
              { label: 'Crédito', value: formatCurrency(data.valorCredito) },
              { label: 'Prazo', value: `${parcelas}x` },
              { label: 'Taxa ref.', value: `${rateMonthly.toFixed(2).replace('.', ',')}% a.m.` },
              { label: 'LTV', value: `${ltv}%` },
            ].map((item, i) => (
              <div key={i}>
                <p className="mb-0.5 text-white/40">{item.label}</p>
                <p className="font-medium text-white/90">{item.value}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="flex items-start gap-2.5 rounded-xl border border-primary/20 bg-primary/5 px-4 py-3">
        <Info className="mt-0.5 h-4 w-4 flex-shrink-0 text-primary" />
        <p className="text-xs leading-relaxed text-primary/80">
          Esta é uma simulação referencial baseada na taxa mínima de{' '}
          <strong className="font-semibold text-primary">{rateMonthly.toFixed(2).replace('.', ',')}% a.m.</strong> As
          condições finais dependem da análise de crédito e vistoria do veículo ({data.marca} - {data.ano}).
        </p>
      </div>

      <button
        type="button"
        onClick={() => router.push(`/solicitar/${productId}?amount=${data.valorCredito}&term=${parcelas}`)}
        className="w-full rounded-2xl bg-background px-5 py-4 text-[15px] font-semibold text-primary transition-opacity hover:opacity-90"
      >
        Quero contratar este crédito →
      </button>

      <div className="flex items-center justify-center gap-6 pt-2">
        <button
          onClick={() => {
            router.back()
          }}
          className="inline-flex items-center gap-2 text-xs font-medium text-surface-foreground/40 transition-colors hover:text-surface-foreground"
        >
          <RefreshCw className="h-3.5 w-3.5" /> Refazer
        </button>
        <button className="inline-flex items-center gap-2 text-xs font-medium text-surface-foreground/40 transition-colors hover:text-surface-foreground">
          <Download className="h-3.5 w-3.5" /> Baixar PDF
        </button>
      </div>
    </div>
  )
}
