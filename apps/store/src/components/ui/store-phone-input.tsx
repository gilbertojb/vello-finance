'use client'

import { cn } from '@/lib/utils'

type Props = {
  value: string
  onChange: (formatted: string) => void
  id?: string
  className?: string
}

function maskPhone(raw: string): string {
  const d = raw.replace(/\D/g, '').slice(0, 11)
  if (d.length === 0) return ''
  if (d.length <= 2) return `(${d}`
  if (d.length <= 6) return `(${d.slice(0, 2)}) ${d.slice(2)}`
  if (d.length <= 10) return `(${d.slice(0, 2)}) ${d.slice(2, 6)}-${d.slice(6)}`
  return `(${d.slice(0, 2)}) ${d.slice(2, 7)}-${d.slice(7)}`
}

export function StorePhoneInput({ value, onChange, id, className }: Props) {
  return (
    <div
      className={cn(
        'flex h-11 items-center rounded-lg border border-surface-foreground/15 bg-white',
        'focus-within:border-primary/40 focus-within:ring-2 focus-within:ring-primary/20',
        className,
      )}
    >
      <span className="select-none pl-5 pr-3 text-sm font-medium text-surface-foreground/40">+55</span>
      <div className="h-5 w-px bg-surface-foreground/12" />
      <input
        type="tel"
        id={id}
        inputMode="numeric"
        value={value}
        placeholder="(11) 99999-9999"
        className="flex-1 bg-transparent pl-3 pr-5 text-sm text-surface-foreground placeholder:text-surface-foreground/35 focus:outline-none"
        onChange={(e) => onChange(maskPhone(e.target.value))}
      />
    </div>
  )
}
