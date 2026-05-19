'use client'

import { cn } from '@/lib/utils'

type Props = {
  value: string
  onChange: (formatted: string) => void
  className?: string
}

function fmt(reais: number): string {
  return reais.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
}

export function StoreCurrencyInput({ value, onChange, className }: Props) {
  return (
    <div className={cn('flex h-11 items-center rounded-lg border border-input bg-transparent focus-within:border-ring focus-within:ring-3 focus-within:ring-ring/50', className)}>
      <span className="select-none pl-3 pr-2 text-sm text-surface-foreground/60">R$</span>
      <input
        type="text"
        inputMode="decimal"
        value={value}
        placeholder="0,00"
        className="flex-1 bg-transparent py-2 pr-3 text-sm outline-none placeholder:text-surface-foreground/40"
        onChange={(e) => {
          const digits = e.target.value.replace(/\D/g, '')
          onChange(fmt(parseInt(digits || '0') / 100))
        }}
      />
    </div>
  )
}
