'use client'

import { InputMask } from '@react-input/mask'
import { type ComponentProps, useState } from 'react'

import { cn } from '@/lib/utils'

const inputClass =
  'h-9 w-full min-w-0 rounded-md border border-input bg-transparent px-2.5 py-1 text-base shadow-xs transition-[color,box-shadow] outline-none placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50 aria-invalid:border-destructive aria-invalid:ring-3 aria-invalid:ring-destructive/20 md:text-sm dark:bg-input/30 dark:aria-invalid:border-destructive/50 dark:aria-invalid:ring-destructive/40'

// ---------------------------------------------------------------------------
// PhoneInput — (11) 99999-9999
// ---------------------------------------------------------------------------

export function PhoneInput({
  className,
  ...props
}: ComponentProps<typeof InputMask>) {
  return (
    <InputMask
      mask="(__) _____-____"
      replacement={{ _: /\d/ }}
      inputMode="numeric"
      placeholder="(11) 99999-9999"
      className={cn(inputClass, className)}
      {...props}
    />
  )
}

// ---------------------------------------------------------------------------
// PercentInput — até 999,99 %
// ---------------------------------------------------------------------------

export function PercentInput({
  className,
  ...props
}: Omit<ComponentProps<typeof InputMask>, 'mask' | 'replacement'>) {
  return (
    <div className="relative">
      <InputMask
        mask="___,__"
        replacement={{ _: /\d/ }}
        separate
        inputMode="numeric"
        placeholder="0,00"
        className={cn(inputClass, 'pr-8', className)}
        {...props}
      />
      <span className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 select-none text-sm text-muted-foreground">
        %
      </span>
    </div>
  )
}

// ---------------------------------------------------------------------------
// MoneyInput — R$ 0,01 … 9.999.999,99
// Implementado com formatação controlada (right-to-left fill de centavos)
// pois @react-input/mask não suporta máscara de comprimento variável.
// ---------------------------------------------------------------------------

function formatMoneyCents(cents: number): string {
  return (cents / 100).toLocaleString('pt-BR', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })
}

function parseToDisplay(raw: unknown): string {
  if (!raw) return ''
  const digits = String(raw).replace(/\D/g, '').replace(/^0+/, '')
  return digits ? formatMoneyCents(parseInt(digits, 10)) : ''
}

type MoneyInputProps = Omit<ComponentProps<'input'>, 'type'>

export function MoneyInput({
  className,
  defaultValue,
  onChange,
  ...props
}: MoneyInputProps) {
  const [display, setDisplay] = useState(() => parseToDisplay(defaultValue))

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    const digits = e.target.value.replace(/\D/g, '').replace(/^0+/, '')
    const formatted = digits ? formatMoneyCents(parseInt(digits, 10)) : ''
    setDisplay(formatted)

    // Repassa o evento com o valor formatado para que onChange funcione normalmente
    Object.defineProperty(e, 'target', {
      writable: false,
      value: Object.assign(e.target, { value: formatted }),
    })
    onChange?.(e)
  }

  return (
    <div className="relative">
      <span className="pointer-events-none absolute left-2.5 top-1/2 -translate-y-1/2 select-none text-sm text-muted-foreground">
        R$
      </span>
      <input
        type="text"
        inputMode="numeric"
        placeholder="0,00"
        value={display}
        onChange={handleChange}
        className={cn(inputClass, 'pl-8', className)}
        {...props}
      />
    </div>
  )
}
