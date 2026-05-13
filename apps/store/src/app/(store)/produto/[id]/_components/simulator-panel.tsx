'use client'

import { useState, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { cn } from '@/lib/utils'
import { formatCurrency, calcPMT, calcCETAnual } from '@/lib/utils/simulator'

type Props = {
  tenantProductId: string
  minAmount: number
  maxAmount: number
  termOptions: number[]
  minRate: number
  initialAmount: number
  initialTerm: number
}

export function SimulatorPanel({ tenantProductId, minAmount, maxAmount, termOptions, minRate, initialAmount, initialTerm }: Props) {
  const router = useRouter()
  const [amount, setAmount] = useState(initialAmount)
  const [term, setTerm] = useState(initialTerm)

  const installment = useMemo(() => calcPMT(amount, minRate, term), [amount, minRate, term])
  const total = installment * term
  const cet = useMemo(() => calcCETAnual(minRate), [minRate])

  return (
    <div className="space-y-9">
      {/* Slider de valor */}
      <div>
        <div className="mb-3.5 flex items-center justify-between">
          <span className="text-xs font-semibold uppercase tracking-[.02em] text-surface-foreground">Valor do empréstimo</span>
          <span className="text-lg font-semibold text-primary">{formatCurrency(amount)}</span>
        </div>
        <input
          type="range"
          min={minAmount}
          max={maxAmount}
          step={500}
          value={amount}
          onChange={(e) => setAmount(Number(e.target.value))}
          className="h-1 w-full cursor-pointer appearance-none rounded-full bg-surface-foreground/12 accent-primary outline-none"
        />
        <div className="mt-2.5 flex justify-between text-[11px] uppercase tracking-[.16em] text-surface-foreground/50">
          <span>{formatCurrency(minAmount)}</span><span>{formatCurrency(maxAmount)}</span>
        </div>
      </div>

      {/* Prazo */}
      <div>
        <div className="mb-3.5 flex items-center justify-between">
          <span className="text-xs font-semibold uppercase tracking-[.02em] text-surface-foreground">Prazo de pagamento</span>
          <span className="text-lg font-semibold text-primary">{term} meses</span>
        </div>
        <div className={cn('grid gap-2', termOptions.length <= 4 ? 'grid-cols-4' : 'grid-cols-5')}>
          {termOptions.map((t) => (
            <button
              key={t}
              type="button"
              onClick={() => setTerm(t)}
              className={cn(
                'rounded-[10px] border py-3.5 text-sm font-semibold transition-all',
                term === t
                  ? 'border-primary bg-primary text-primary-foreground'
                  : 'border-surface-foreground/10 bg-white text-surface-foreground hover:border-[oklch(0.48_0.07_50)]',
              )}
            >
              {t % 12 === 0 ? `${t / 12}a` : `${t}m`}
            </button>
          ))}
        </div>
      </div>

      {/* Resultado */}
      <div className="grid grid-cols-[1fr_1fr_auto] items-center gap-6 rounded-[18px] bg-background px-7 py-6 text-foreground max-sm:grid-cols-1">
        <div>
          <div className="text-[10px] font-medium uppercase tracking-[.2em] text-foreground/50">Parcela mensal</div>
          <div className="mt-1 text-[28px] font-semibold leading-none tracking-tight">{formatCurrency(installment)}</div>
        </div>
        <div>
          <div className="text-[10px] font-medium uppercase tracking-[.2em] text-foreground/50">CET anual</div>
          <div className="mt-1 text-[28px] font-semibold leading-none tracking-tight text-green-400">
            {cet.toFixed(2).replace('.', ',')}%
          </div>
        </div>
        <button
          type="button"
          onClick={() => router.push(`/simulador`)}
          className="whitespace-nowrap rounded-full bg-gradient-to-b from-primary to-primary/80 px-[22px] py-3.5 text-sm font-semibold text-primary-foreground shadow-[0_8px_24px_-10px_oklch(0.83_0.10_85/50%)] transition-all hover:brightness-110"
        >
          Continuar →
        </button>
      </div>

      <p className="text-center text-[11px] leading-relaxed text-surface-foreground/50">
        Total estimado: <strong className="text-surface-foreground/70">{formatCurrency(total)}</strong>
        {' '}· Taxa a partir de <strong className="text-surface-foreground/70">{minRate.toFixed(2).replace('.', ',')}% a.m.</strong>
        {' '}· Esta consulta não afeta seu score.
      </p>
    </div>
  )
}
