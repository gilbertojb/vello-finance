'use client'

import { cn } from '@/lib/utils'

type Props = {
  value: string
  onChange: (formatted: string) => void
  className?: string
}

function formatInteger(n: number): string {
  return n > 0 ? new Intl.NumberFormat('pt-BR').format(n) : ''
}

export function StoreCurrencyInput({ value, onChange, className }: Props) {
  return (
    <div
      className={cn(
        'flex h-11 items-center rounded-lg border border-surface-foreground/15 bg-white',
        'focus-within:border-primary/40 focus-within:ring-2 focus-within:ring-primary/20',
        className,
      )}
    >
      <span className="select-none pl-5 pr-3 text-sm font-medium text-surface-foreground/50">R$</span>
      <input
        type="text"
        inputMode="numeric"
        value={value}
        placeholder="0"
        className="flex-1 bg-transparent py-2 pr-5 text-sm text-surface-foreground placeholder:text-surface-foreground/35 outline-none"
        onChange={(e) => {
          const digits = e.target.value.replace(/\D/g, '')
          onChange(formatInteger(parseInt(digits || '0', 10)))
        }}
      />
    </div>
  )
}
